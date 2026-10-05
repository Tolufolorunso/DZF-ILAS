import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { syncCohortRosterToGoogleSheets } from '@/lib/cohorts/googleSheets';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ cohortType: string }>;
}

/**
 * POST /api/cohorts/[cohortType]/sync
 * Pushes and synchronizes cohort roster to its dedicated tab in Google Sheets
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
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

    const { cohortType } = await params;
    const result = await syncCohortRosterToGoogleSheets(cohortType);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
