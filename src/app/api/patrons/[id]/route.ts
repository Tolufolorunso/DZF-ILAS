import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Patron } from '@/models/Patron';
import { Library } from '@/models/Library';
import { getSessionUser } from '@/lib/auth/session';
import { canUpdatePatron, canDeletePatron } from '@/lib/auth/rbac';

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

    // RBAC: Only admin, asst_admin, and ict can update patron profiles
    if (!canUpdatePatron(sessionUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Forbidden: Only administrators and ICT staff have permission to update patron profiles.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    // Prevent mutating barcode or _id directly
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

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    // RBAC: Only admin (and asst_admin) can delete patrons
    if (!canDeletePatron(sessionUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Forbidden: Only administrators have permission to delete patron records.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    const patron = await Patron.findOne(query);

    if (!patron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    // Safety check: ensure patron does not have active unreturned loans
    const activeLoans = await Library.countDocuments({
      $or: [{ patronId: patron._id }, { patronBarcode: patron.barcode }],
      status: { $in: ['borrowed', 'overdue'] },
    });

    if (activeLoans > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete patron ${patron.firstname} ${patron.surname}: They have ${activeLoans} active or overdue book loan(s) that must be returned first.`,
        },
        { status: 400 }
      );
    }

    const isHard = request.nextUrl.searchParams.get('hard') === 'true';

    if (isHard) {
      await Patron.deleteOne({ _id: patron._id });
    } else {
      await Patron.updateOne(
        { _id: patron._id },
        { $set: { isDeleted: true, active: false } }
      );
    }

    return NextResponse.json({
      success: true,
      message: isHard
        ? 'Patron record permanently removed.'
        : 'Patron deactivated successfully.',
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Error deleting patron' },
      { status: 500 }
    );
  }
}
