import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCirculation } from '@/lib/auth/rbac';
import { Hold } from '@/models/Hold';
import { Patron } from '@/models/Patron';
import { Cataloging } from '@/models/Cataloging';
import { getBookTitleString } from '@/lib/circulation/loan';

/**
 * GET /api/circulations/holds
 * Retrieves book hold reservations with optional status filter.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status')?.trim();
    const search = searchParams.get('search')?.trim() || '';

    // Filter by status
    const filter: Record<string, unknown> = {};
    if (statusParam && statusParam !== 'all') {
      filter.status = statusParam;
    } else if (!statusParam) {
      // Default: show active reservations (waiting or ready for pickup)
      filter.status = { $in: ['waiting', 'ready'] };
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { patronName: regex },
        { patronBarcode: regex },
        { bookTitle: regex },
        { bookBarcode: regex },
      ];
    }

    const rawHolds = await Hold.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const holds = rawHolds.map((h) => ({
      id: String(h._id),
      patronId: String(h.patronId),
      patronBarcode: h.patronBarcode,
      patronName: h.patronName,
      bookId: String(h.bookId),
      bookBarcode: h.bookBarcode,
      bookTitle: h.bookTitle,
      status: h.status,
      notifiedAt: h.notifiedAt ? new Date(h.notifiedAt).toISOString() : undefined,
      expiresAt: h.expiresAt ? new Date(h.expiresAt).toISOString() : undefined,
      fulfilledAt: h.fulfilledAt ? new Date(h.fulfilledAt).toISOString() : undefined,
      notes: h.notes,
      createdAt: new Date(h.createdAt).toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        total: holds.length,
        holds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/circulations/holds:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching holds.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/circulations/holds
 * Creates a new hold reservation or updates/cancels an existing one.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (!canManageCirculation(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff privileges required for hold management.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Handle Hold Cancellation / Fulfillment
    if (body.action === 'cancel' || body.action === 'fulfill') {
      const { holdId } = body;
      if (!holdId || !mongoose.Types.ObjectId.isValid(holdId)) {
        return NextResponse.json(
          { success: false, error: 'Valid holdId is required.' },
          { status: 400 }
        );
      }

      const hold = await Hold.findById(holdId);
      if (!hold) {
        return NextResponse.json(
          { success: false, error: 'Hold reservation not found.' },
          { status: 404 }
        );
      }

      if (body.action === 'cancel') {
        hold.status = 'cancelled';
        await hold.save();
        return NextResponse.json(
          { success: true, message: 'Hold reservation cancelled successfully.', hold },
          { status: 200 }
        );
      } else {
        hold.status = 'fulfilled';
        hold.fulfilledAt = new Date();
        await hold.save();
        return NextResponse.json(
          { success: true, message: 'Hold reservation marked as fulfilled.', hold },
          { status: 200 }
        );
      }
    }

    // 2. Handle New Hold Reservation Placement
    const { patronBarcode, bookBarcode, notes } = body;
    if (!patronBarcode || !bookBarcode) {
      return NextResponse.json(
        { success: false, error: 'patronBarcode and bookBarcode are required to place a hold.' },
        { status: 400 }
      );
    }

    const cleanPatronBarcode = String(patronBarcode).trim();
    const cleanBookBarcode = String(bookBarcode).trim();

    // Verify Patron
    const patron = await Patron.findOne({
      barcode: cleanPatronBarcode,
      isDeleted: { $ne: true },
    });

    if (!patron) {
      return NextResponse.json(
        { success: false, error: `Patron with barcode "${cleanPatronBarcode}" was not found.` },
        { status: 404 }
      );
    }

    if (!patron.active) {
      return NextResponse.json(
        { success: false, error: `Patron account (${patron.firstname} ${patron.surname}) is currently inactive.` },
        { status: 400 }
      );
    }

    // Verify Book
    const book = await Cataloging.findOne({ barcode: cleanBookBarcode });
    if (!book) {
      return NextResponse.json(
        { success: false, error: `Book with barcode "${cleanBookBarcode}" was not found in catalog.` },
        { status: 404 }
      );
    }

    const bookTitleStr = getBookTitleString(book);

    // Prevent duplicate active hold
    const existingActiveHold = await Hold.findOne({
      patronBarcode: cleanPatronBarcode,
      bookBarcode: cleanBookBarcode,
      status: { $in: ['waiting', 'ready'] },
    });

    if (existingActiveHold) {
      return NextResponse.json(
        {
          success: false,
          error: `Patron (${patron.firstname} ${patron.surname}) already has an active hold for "${bookTitleStr}".`,
        },
        { status: 400 }
      );
    }

    // Create Hold
    const placedByObjectId = mongoose.Types.ObjectId.isValid(auth.userId)
      ? new mongoose.Types.ObjectId(auth.userId)
      : undefined;

    const initialStatus: 'ready' | 'waiting' =
      !book.isCheckedOut && (book.copiesAvailable ?? 0) > 0 ? 'ready' : 'waiting';

    const newHold = await Hold.create({
      patronId: patron._id,
      patronBarcode: patron.barcode,
      patronName: `${patron.firstname} ${patron.surname}`.trim(),
      bookId: book._id,
      bookBarcode: book.barcode,
      bookTitle: bookTitleStr,
      status: initialStatus,
      placedBy: placedByObjectId,
      notes: notes ? String(notes).trim() : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          initialStatus === 'ready'
            ? `Hold placed! A copy of "${bookTitleStr}" is currently available and ready for pickup.`
            : `Hold placed! Patron queued for next available copy of "${bookTitleStr}".`,
        hold: {
          id: String(newHold._id),
          patronBarcode: newHold.patronBarcode,
          patronName: newHold.patronName,
          bookBarcode: newHold.bookBarcode,
          bookTitle: newHold.bookTitle,
          status: newHold.status,
          createdAt: new Date(newHold.createdAt).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/circulations/holds:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing hold request.' },
      { status: 500 }
    );
  }
}
