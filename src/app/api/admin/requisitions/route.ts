import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { listRequisitions } from '@/lib/admin/service';
import { Requisition } from '@/models/Requisition';
import { connectDB } from '@/lib/db';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/requisitions
 * Lists staff requisitions with optional status filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const items = await listRequisitions({ status, limit });
    return NextResponse.json({ success: true, requisitions: items }, { status: 200 });
  } catch (error) {
    console.error('[GET_REQUISITIONS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve requisitions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/requisitions
 * Creates a staff operational procurement / requisition request.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.item || !body.rationale || !body.quantity) {
      return NextResponse.json(
        { success: false, error: 'Fields "item", "rationale", and "quantity" are required.' },
        { status: 400 }
      );
    }

    await connectDB();
    const requisition = await Requisition.create({
      item: String(body.item).trim(),
      description: body.description ? String(body.description).trim() : undefined,
      rationale: String(body.rationale).trim(),
      quantity: Number(body.quantity) || 1,
      price: typeof body.price === 'number' ? body.price : undefined,
      estimatedCost: typeof body.estimatedCost === 'number' ? body.estimatedCost : (Number(body.quantity) || 1) * (Number(body.price) || 0),
      createdBy: user.name || user.username,
      status: 'pending',
      comments: [],
    });

    await logAuditEvent({
      action: 'REQUISITION_CREATED',
      performedBy: user.username,
      performedByRole: user.role,
      targetEntity: 'Requisition',
      targetId: String(requisition._id),
      details: {
        item: requisition.item,
        quantity: requisition.quantity,
        estimatedCost: requisition.estimatedCost,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Requisition submitted for administrative approval.',
        requisition: {
          id: String(requisition._id),
          item: requisition.item,
          status: requisition.status,
          quantity: requisition.quantity,
          estimatedCost: requisition.estimatedCost,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CREATE_REQUISITION_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create requisition' },
      { status: 500 }
    );
  }
}
