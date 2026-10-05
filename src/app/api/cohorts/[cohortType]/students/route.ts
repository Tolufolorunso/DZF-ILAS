import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getCohortStudents, enrollStudent } from '@/lib/cohorts/service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ cohortType: string }>;
}

/**
 * GET /api/cohorts/[cohortType]/students
 * Retrieves paginated, filterable student roster for cohort
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { cohortType } = await params;
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const filter = (searchParams.get('filter') as 'all' | 'active' | 'certified' | 'removed') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await getCohortStudents(cohortType, { search, filter, page, limit });

    return NextResponse.json({
      success: true,
      cohortType,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/cohorts/[cohortType]/students
 * Enrolls a patron into the cohort by barcode or patron ID
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'cohort_lead') {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Only Admins and Cohort Leads can enroll students.' },
        { status: 403 }
      );
    }

    const { cohortType } = await params;
    const body = await req.json();

    const barcode = body.barcode || body.patronBarcode || body.patronId;
    if (!barcode) {
      return NextResponse.json({ success: false, error: 'Patron barcode or ID is required.' }, { status: 400 });
    }

    const student = await enrollStudent(cohortType, barcode);

    return NextResponse.json({
      success: true,
      message: `Student ${student.firstname} ${student.surname} enrolled in ${cohortType}.`,
      student,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
