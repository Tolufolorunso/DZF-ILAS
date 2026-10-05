import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Inventory } from '@/models/Inventory';
import { getSessionUser } from '@/lib/auth/session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inventory/[id]
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: Record<string, any> = { barcode: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { barcode: id }] };
    }

    const item = await Inventory.findOne(query).lean();
    if (!item) {
      return NextResponse.json(
        { success: false, error: `Inventory item not found for "${id}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch inventory item' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/[id]
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    const allowedRoles = ['admin', 'librarian', 'ict'];
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to edit inventory.' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;
    const body = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: Record<string, any> = { barcode: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { barcode: id }] };
    }

    const item = await Inventory.findOne(query);
    if (!item) {
      return NextResponse.json(
        { success: false, error: `Inventory item not found for "${id}"` },
        { status: 404 }
      );
    }

    if (body.name) item.name = body.name.trim().toLowerCase();
    if (body.dept) item.dept = body.dept.trim().toLowerCase();
    if (body.quantity !== undefined) item.quantity = Math.max(0, parseInt(body.quantity, 10));
    if (body.condition) item.condition = body.condition;
    if (body.status) item.status = body.status;
    if (body.image?.secure_url) {
      item.image = { secure_url: body.image.secure_url, public_id: body.image.public_id };
    }

    await item.save();

    return NextResponse.json({
      success: true,
      message: 'Inventory item updated successfully',
      item,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inventory/[id]
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    if (auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only administrators can delete inventory records.' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: Record<string, any> = { barcode: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { barcode: id }] };
    }

    const item = await Inventory.findOne(query);
    if (!item) {
      return NextResponse.json(
        { success: false, error: `Inventory item not found for "${id}"` },
        { status: 404 }
      );
    }

    await Inventory.deleteOne({ _id: item._id });

    return NextResponse.json({
      success: true,
      message: `Asset "${item.name}" deleted from inventory successfully.`,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
