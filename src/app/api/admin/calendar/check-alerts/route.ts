import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { evaluateCalendarAlerts } from '@/lib/calendar/alerts';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/calendar/check-alerts
 * Evaluates advance milestone notification thresholds (30-day, 14-day, 7-day)
 * and dispatches in-app alerts to staff members.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    // Allow admin or valid authorization header
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const summary = await evaluateCalendarAlerts();

    return NextResponse.json(
      {
        success: true,
        message: `Alert evaluation complete. Processed ${summary.evaluatedEventsCount} events, dispatched ${summary.alertsDispatchedCount} milestone alerts (${summary.notificationsCreatedCount} total notifications sent).`,
        summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CHECK_CALENDAR_ALERTS_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to evaluate calendar alerts',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/calendar/check-alerts
 * Quick trigger / health-check evaluation.
 */
export async function GET(req: NextRequest) {
  return POST(req);
}
