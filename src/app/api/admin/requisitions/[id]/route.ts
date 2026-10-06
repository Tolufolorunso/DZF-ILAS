import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { updateRequisitionStatus } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/requisitions/[id]
 * Approves, rejects, or updates procurement requisition status.
 * Restricted to administrator roles.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body || !body.status) {
      return NextResponse.json(
        { success: false, error: 'Field "status" is required in payload.' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'done', 'received'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await updateRequisitionStatus({
      id,
      status: body.status,
      comment: body.comment ? String(body.comment).trim() : undefined,
      price: typeof body.price === 'number' ? body.price : undefined,
      staffUsername: user.username,
      staffRole: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Requisition status updated to "${body.status}".`,
        requisition: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[UPDATE_REQUISITION_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update requisition' },
      { status: 500 }
    );
  }
}
