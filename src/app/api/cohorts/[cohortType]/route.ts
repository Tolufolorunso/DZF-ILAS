import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getCohortGroupByType, updateCohortGroup } from '@/lib/cohorts/service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ cohortType: string }>;
}

/**
 * GET /api/cohorts/[cohortType]
 * Retrieves single cohort group metadata and stats
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { cohortType } = await params;
    const cohort = await getCohortGroupByType(cohortType);

    if (!cohort) {
      return NextResponse.json({ success: false, error: `Cohort "${cohortType}" not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, cohort });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PUT /api/cohorts/[cohortType]
 * Updates cohort group metadata
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'cohort_lead') {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Only Admins and Cohort Leads can update cohorts.' },
        { status: 403 }
      );
    }

    const { cohortType } = await params;
    const body = await req.json();

    const updated = await updateCohortGroup(cohortType, {
      displayName: body.displayName,
      description: body.description,
      active: body.active,
      order: body.order,
      updatedBy: user.name || user.username,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: `Cohort "${cohortType}" not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, cohort: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
