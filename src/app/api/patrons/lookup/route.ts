import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Patron } from '@/models/Patron';
import { Library } from '@/models/Library';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/patrons/lookup
 * High-tolerance lookup endpoint for patron records and their active circulation loans.
 * Matches by exact barcode, case-insensitive barcode, MongoDB ObjectId, or name search.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('barcode') || searchParams.get('query') || searchParams.get('id') || '';
    const clean = rawQuery.trim();

    if (!clean) {
      return NextResponse.json(
        { success: false, error: 'A search barcode or identifier is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(clean);

    // 1. Direct barcode or ObjectId match
    let patron = await Patron.findOne({
      $or: [
        { barcode: clean },
        { barcode: new RegExp(`^${clean}$`, 'i') },
        ...(isObjectId ? [{ _id: clean }] : []),
      ],
      isDeleted: { $ne: true },
    }).lean();

    // 2. Name or phone fallback match if not found by barcode
    if (!patron) {
      patron = await Patron.findOne({
        $or: [
          { firstname: new RegExp(`^${clean}$`, 'i') },
          { surname: new RegExp(`^${clean}$`, 'i') },
          { phoneNumber: clean },
        ],
        isDeleted: { $ne: true },
      }).lean();
    }

    if (!patron) {
      return NextResponse.json(
        {
          success: false,
          error: `No active patron found matching identifier "${clean}".`,
        },
        { status: 404 }
      );
    }

    // 3. Retrieve all active / overdue loans for this patron
    const activeLoans = await Library.find({
      patronBarcode: patron.barcode,
      status: { $in: ['borrowed', 'overdue'] },
    })
      .sort({ checkoutDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      patron,
      activeLoans,
    });
  } catch (error) {
    console.error('[PATRON_LOOKUP_ERROR]', error);
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to lookup patron.' },
      { status: 500 }
    );
  }
}
