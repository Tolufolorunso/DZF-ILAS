import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCertificates } from '@/lib/auth/rbac';
import {
  createCertificate,
  listCertificates,
} from '@/lib/certificates/service';

/**
 * GET /api/certificates
 * Lists issued certificates with search, template filter, and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const templateType = searchParams.get('templateType') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listCertificates({
      search,
      templateType,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates
 * Creates and issues a single certificate with atomic serial code.
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
          error: 'Permission denied. Staff credentials required to issue certificates.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const certificate = await createCertificate(
      {
        templateType: body.templateType,
        title: body.title,
        recipientName: body.recipientName,
        recipientBarcode: body.recipientBarcode,
        recipientCohort: body.recipientCohort,
        recipientCategory: body.recipientCategory,
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
      data: certificate,
      message: `Certificate ${certificate.certificateCode} issued successfully.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
