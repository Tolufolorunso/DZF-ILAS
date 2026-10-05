import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { syncAllActiveCohortsToGoogleSheets } from '@/lib/cohorts/googleSheets';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cohorts/sync
 * Pushes and synchronizes all active cohorts to Google Sheets
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'cohort_lead') {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Only Admins and Cohort Leads can trigger Google Sheets sync.' },
        { status: 403 }
      );
    }

    const summary = await syncAllActiveCohortsToGoogleSheets();

    return NextResponse.json({
      ...summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
