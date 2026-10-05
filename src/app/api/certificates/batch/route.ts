import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCertificates } from '@/lib/auth/rbac';
import { batchGenerateCertificates } from '@/lib/certificates/service';

/**
 * POST /api/certificates/batch
 * Batch issue certificates for a Cohort class or Reading Competition category.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (!canManageCertificates(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Staff credentials required to batch issue certificates.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = await batchGenerateCertificates(
      {
        sourceType: body.sourceType,
        cohortType: body.cohortType,
        competitionSessionKey: body.competitionSessionKey,
        competitionCategory: body.competitionCategory,
        recipientBarcodes: body.recipientBarcodes,
        templateType: body.templateType,
        title: body.title,
        awardDescription: body.awardDescription,
        issueDate: body.issueDate,
        primarySignatory: body.primarySignatory,
        secondarySignatory: body.secondarySignatory,
        goldSealText: body.goldSealText,
      },
      user.name || user.username
    );

    return NextResponse.json({
      success: true,
      data: result.created,
      total: result.total,
      message: `Successfully batch issued ${result.total} certificates.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
