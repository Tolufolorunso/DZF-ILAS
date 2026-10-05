import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCertificates } from '@/lib/auth/rbac';
import { connectDB } from '@/lib/db';
import { Certificate } from '@/models/Certificate';
import { getCertificate, serializeCertificate } from '@/lib/certificates/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/certificates/[id]
 * Retrieve single certificate by MongoDB _id or certificateCode.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cert = await getCertificate(id);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certificate record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cert,
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
 * PATCH /api/certificates/[id]
 * Staff updates certificate status (e.g. revoke/reinstate).
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
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
          error: 'Permission denied. Staff credentials required to manage certificates.',
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    await connectDB();
    const cert = await Certificate.findById(id);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found.' },
        { status: 404 }
      );
    }

    if (body.isRevoked !== undefined) {
      cert.isRevoked = Boolean(body.isRevoked);
    }
    if (body.title) cert.title = body.title.trim();
    if (body.recipientName) cert.recipientName = body.recipientName.trim();
    if (body.awardDescription) cert.awardDescription = body.awardDescription.trim();

    await cert.save();

    return NextResponse.json({
      success: true,
      data: serializeCertificate(cert),
      message: 'Certificate updated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
