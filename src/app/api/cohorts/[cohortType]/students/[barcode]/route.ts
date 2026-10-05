import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { updateStudentStatus } from '@/lib/cohorts/service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ cohortType: string; barcode: string }>;
}

/**
 * PATCH /api/cohorts/[cohortType]/students/[barcode]
 * Updates student status in cohort (receivedCertificate, isRemoved, schoolClass)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'cohort_lead') {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Only Admins and Cohort Leads can modify student statuses.' },
        { status: 403 }
      );
    }

    const { cohortType, barcode } = await params;
    const body = await req.json();

    const student = await updateStudentStatus(cohortType, barcode, {
      receivedCertificate: body.receivedCertificate,
      isRemoved: body.isRemoved,
      schoolClass: body.schoolClass,
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: `Student with barcode "${barcode}" not found in cohort "${cohortType}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student record updated successfully.',
      student,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/cohorts/[cohortType]/students/[barcode]
 * Soft removes student from cohort
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'cohort_lead') {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Only Admins and Cohort Leads can remove students.' },
        { status: 403 }
      );
    }

    const { cohortType, barcode } = await params;

    const student = await updateStudentStatus(cohortType, barcode, { isRemoved: true });
    if (!student) {
      return NextResponse.json(
        { success: false, error: `Student with barcode "${barcode}" not found in cohort "${cohortType}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Student with barcode "${barcode}" marked as removed from cohort "${cohortType}".`,
      student,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
