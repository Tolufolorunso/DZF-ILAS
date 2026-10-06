import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Patron } from '@/models/Patron';
import { Library } from '@/models/Library';
import { getSessionUser } from '@/lib/auth/session';
import { canDeletePatron } from '@/lib/auth/rbac';

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    // RBAC: Only administrators have permission to delete patron records in bulk
    if (!canDeletePatron(sessionUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only administrators have permission to delete patron records.',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { patronIds } = body as { patronIds?: string[] };

    if (!Array.isArray(patronIds) || patronIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one patron to delete.' },
        { status: 400 }
      );
    }

    await connectDB();

    const objectIds = patronIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const patrons = await Patron.find({
      $or: [
        { _id: { $in: objectIds } },
        { barcode: { $in: patronIds } },
      ],
    }).lean();

    if (patrons.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching patron records found.' },
        { status: 404 }
      );
    }

    const foundIds = patrons.map((p) => p._id);
    const foundBarcodes = patrons.map((p) => p.barcode);

    // Active loan check: block if any selected patron has active or overdue loans
    const activeLoans = await Library.find({
      $or: [
        { patronId: { $in: foundIds } },
        { patronBarcode: { $in: foundBarcodes } },
      ],
      status: { $in: ['borrowed', 'overdue'] },
    })
      .select('patronId patronBarcode bookTitle status')
      .lean();

    if (activeLoans.length > 0) {
      const blockedPatronNames = patrons
        .filter((p) =>
          activeLoans.some(
            (l) =>
              String(l.patronId) === String(p._id) ||
              l.patronBarcode === p.barcode
          )
        )
        .map((p) => `${p.firstname} ${p.surname} (${p.barcode})`);

      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete selected patrons. ${blockedPatronNames.length} patron(s) have active or overdue book loans that must be returned first.`,
          blockedPatrons: blockedPatronNames,
        },
        { status: 400 }
      );
    }

    const isHard = request.nextUrl.searchParams.get('hard') === 'true';

    if (isHard) {
      await Patron.deleteMany({ _id: { $in: foundIds } });
    } else {
      await Patron.updateMany(
        { _id: { $in: foundIds } },
        { $set: { isDeleted: true, active: false } }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${foundIds.length} patron record(s).`,
      deletedCount: foundIds.length,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Error processing bulk patron deletion' },
      { status: 500 }
    );
  }
}
