import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import SystemSetting from '@/models/SystemSetting';
import connectDB from '@/lib/db';
import {
  markCohortAttendanceBatch,
  getCohortSessionAttendance,
} from '@/lib/cohorts/service';
import { recordDailyAction } from '@/lib/audit/dailyActionService';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ cohortType: string }>;
}

/**
 * Helper to resolve actor identity via secret API Key or staff session
 */
async function authenticateRequest(req: NextRequest): Promise<{
  authenticated: boolean;
  actor: string;
  isApiKey: boolean;
  error?: string;
}> {
  // 1. Check for API key in custom header or Bearer token
  const headerKey =
    req.headers.get('x-dzf-api-key') ||
    req.headers.get('X-DZF-API-Key') ||
    null;

  let authKey = headerKey;
  if (!authKey) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      authKey = authHeader.substring(7).trim();
    }
  }

  if (authKey) {
    await connectDB();
    const setting = await SystemSetting.findById('default').lean();
    if (
      setting &&
      setting.externalAttendanceApiKey &&
      setting.externalAttendanceApiKey === authKey
    ) {
      const staffIdentity = setting.externalAttendanceAttributedStaff || 'Academy Instructor';
      return {
        authenticated: true,
        actor: `API: ${staffIdentity}`,
        isApiKey: true,
      };
    }
    return {
      authenticated: false,
      actor: '',
      isApiKey: true,
      error: 'Invalid or expired External Attendance API Key.',
    };
  }

  // 2. Fall back to active staff session (cookie or JWT)
  const sessionUser = await getSessionUser(req);
  if (sessionUser) {
    return {
      authenticated: true,
      actor: sessionUser.name || sessionUser.username,
      isApiKey: false,
    };
  }

  return {
    authenticated: false,
    actor: '',
    isApiKey: false,
    error: 'Authentication required. Provide "X-DZF-API-Key" header or valid staff session.',
  };
}

/**
 * GET /api/cohorts/[cohortType]/attendance
 * Retrieves session attendance breakdown for a specified cohort on a given date or week.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { cohortType } = await params;
    const { searchParams } = new URL(req.url);

    const dateParam = searchParams.get('date') || undefined;
    const weekParam = searchParams.get('week') ? parseInt(searchParams.get('week')!, 10) : undefined;

    const data = await getCohortSessionAttendance(cohortType, dateParam, weekParam);

    return NextResponse.json({
      success: true,
      ...data,
      requester: auth.actor,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[COHORT_GET_ATTENDANCE_ERROR]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/cohorts/[cohortType]/attendance
 * Marks individual or bulk student attendance for a cohort.
 * Strictly awards 0 patron gamification/leaderboard points.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { cohortType } = await params;
    const body = await req.json().catch(() => ({}));

    // Normalize incoming items
    const records: Array<{ barcode: string; attended?: boolean; week?: number }> = [];

    if (body.records && Array.isArray(body.records)) {
      for (const rec of body.records) {
        if (rec && rec.barcode) {
          records.push({
            barcode: String(rec.barcode).trim(),
            attended: rec.attended !== undefined ? Boolean(rec.attended) : true,
            week: rec.week ? Number(rec.week) : undefined,
          });
        }
      }
    } else if (body.barcodes && Array.isArray(body.barcodes)) {
      for (const b of body.barcodes) {
        if (b) {
          records.push({
            barcode: String(b).trim(),
            attended: body.attended !== undefined ? Boolean(body.attended) : true,
            week: body.week ? Number(body.week) : undefined,
          });
        }
      }
    } else if (body.barcode) {
      records.push({
        barcode: String(body.barcode).trim(),
        attended: body.attended !== undefined ? Boolean(body.attended) : true,
        week: body.week ? Number(body.week) : undefined,
      });
    }

    if (records.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No student barcode(s) provided. Send "barcode", "barcodes" array, or "records" array.',
        },
        { status: 400 }
      );
    }

    const result = await markCohortAttendanceBatch({
      cohortType,
      date: body.date,
      week: body.week ? Number(body.week) : undefined,
      records,
      markedBy: auth.actor,
    });

    if (result.markedCount > 0) {
      await recordDailyAction({
        actionType: 'attendance_scan',
        actionTitle: `Marked attendance for ${result.markedCount} student(s) in cohort "${cohortType}" (Week ${result.week})`,
        performedBy: auth.isApiKey ? 'external_api' : auth.actor,
        performedByName: auth.actor,
        performedByRole: auth.isApiKey ? 'ict' : 'staff',
        targetEntity: 'Cohort',
        targetId: cohortType,
        reversiblePayload: {
          cohortType,
          date: result.date,
          week: result.week,
        },
        isReversible: false,
      }).catch((err) => console.warn('[DAILY_ACTION_LOG_WARN]', err));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed attendance for ${result.markedCount} student(s).`,
      ...result,
      markedBy: auth.actor,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[COHORT_POST_ATTENDANCE_ERROR]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

