import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Patron } from '@/models/Patron';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Patron identifier is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    const patron = await Patron.findOne({
      ...query,
      isDeleted: { $ne: true },
    }).lean();

    if (!patron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      patron,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching patron' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    // Prevent changing barcode through standard update
    delete body.barcode;
    delete body._id;

    if (body.dateOfBirth) {
      body.dateOfBirth = new Date(body.dateOfBirth);
    }

    const updatedPatron = await Patron.findOneAndUpdate(
      { ...query, isDeleted: { $ne: true } },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedPatron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Patron profile updated successfully.',
      patron: updatedPatron,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Error updating patron profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser || !['admin', 'asst_admin'].includes(sessionUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only administrators can deactivate or delete patrons.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    // Soft delete
    const patron = await Patron.findOneAndUpdate(
      query,
      { $set: { isDeleted: true, active: false } },
      { new: true }
    );

    if (!patron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Patron deactivated successfully.',
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Error deleting patron' },
      { status: 500 }
    );
  }
}
