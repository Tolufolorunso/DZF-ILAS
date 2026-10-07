import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getAllCohortGroups, createCohortGroup } from '@/lib/cohorts/service';
import { recordDailyAction } from '@/lib/audit/dailyActionService';

/**
 * GET /api/cohorts
 * Returns all cohort groups enriched with statistics
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const cohorts = await getAllCohortGroups();
    return NextResponse.json({ success: true, cohorts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/cohorts
 * Creates a new cohort group (admin or cohort_lead role)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'cohort_lead') {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Only Admins and Cohort Leads can create cohorts.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.cohortType) {
      return NextResponse.json({ success: false, error: 'cohortType is required' }, { status: 400 });
    }

    const newCohort = await createCohortGroup({
      cohortType: body.cohortType,
      displayName: body.displayName,
      description: body.description,
      active: body.active !== undefined ? body.active : true,
      order: body.order,
      createdBy: user.name || user.username,
    });

    await recordDailyAction({
      actionType: 'cohort_action',
      actionTitle: `Created cohort group "${newCohort.displayName || newCohort.cohortType}"`,
      performedBy: user.username,
      performedByName: user.name || user.username,
      performedByRole: user.role,
      targetEntity: 'Cohort',
      targetId: String(newCohort._id || newCohort.cohortType),
      reversiblePayload: {
        cohortType: newCohort.cohortType,
      },
      isReversible: false,
    });

    return NextResponse.json({ success: true, cohort: newCohort }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
