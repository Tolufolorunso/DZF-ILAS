import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Cataloging, Library, Hold, Inventory } from '@/models';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCatalog, canDeleteBook } from '@/lib/auth/rbac';
import { recordDailyAction } from '@/lib/audit/dailyActionService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/catalog/[id]
 * Fetch book record by ObjectId or barcode
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

    // Search by ObjectId if valid, otherwise barcode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: Record<string, any> = { barcode: id };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new mongoose.Types.ObjectId(id) }, { barcode: id }] };
    }

    const book = await Cataloging.findOne(query)
      .populate('checkedOutBy', 'firstname surname barcode phoneNumber')
      .lean();

    if (!book) {
      return NextResponse.json(
        { success: false, error: `Book not found for identifier "${id}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      book,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching catalog record:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch catalog record' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/catalog/[id]
 * Update catalog record
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

    if (!canManageCatalog(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to edit books.' },
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

    const book = await Cataloging.findOne(query);
    if (!book) {
      return NextResponse.json(
        { success: false, error: `Book not found for identifier "${id}"` },
        { status: 404 }
      );
    }
    const previousState = book.toObject();

    // Update allowable fields
    if (body.mainTitle) book.title.mainTitle = body.mainTitle.trim();
    if (body.subtitle !== undefined) book.title.subtitle = body.subtitle.trim();
    if (body.mainAuthor) book.author.mainAuthor = body.mainAuthor.trim();
    if (Array.isArray(body.additionalAuthors)) {
      book.author.additionalAuthors = body.additionalAuthors.filter(Boolean);
    }
    if (body.publisher) book.publicationInfo.publisher = body.publisher.trim();
    if (body.place) book.publicationInfo.place = body.place.trim();
    if (body.year) book.publicationInfo.year = parseInt(body.year, 10);
    if (body.ISBN !== undefined) book.ISBN = body.ISBN.trim();
    if (body.classification) book.classification = body.classification.trim();
    if (body.shelfLocation !== undefined) book.shelfLocation = body.shelfLocation.trim();
    if (body.copiesTotal !== undefined) {
      const newTotal = Math.max(1, parseInt(body.copiesTotal, 10));
      book.copiesTotal = newTotal;
      book.holdingsInformation = newTotal;
      if (!book.isCheckedOut) {
        book.copiesAvailable = newTotal;
      }
    }
    if (body.indexTermGenre !== undefined) {
      book.indexTermGenre = Array.isArray(body.indexTermGenre)
        ? body.indexTermGenre.filter(Boolean)
        : [body.indexTermGenre];
    }
    if (body.informationSummary !== undefined) {
      book.informationSummary = body.informationSummary.trim();
    }
    if (body.image_url !== undefined) {
      book.image_url = body.image_url;
    }

    await book.save();

    await recordDailyAction({
      actionType: 'book_update',
      actionTitle: `Updated monograph details for "${book.title.mainTitle}" (Barcode: ${book.barcode})`,
      performedBy: auth.username,
      performedByName: auth.name || auth.username,
      performedByRole: auth.role,
      targetEntity: 'Cataloging',
      targetId: book._id.toString(),
      reversiblePayload: {
        bookId: book._id.toString(),
        previousState,
      },
      isReversible: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Catalog record updated successfully',
      book,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error updating catalog record:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update catalog record' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/catalog/[id]
 * Remove or archive catalog record
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

    if (!canDeleteBook(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only administrators can delete book records.' },
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

    const book = await Cataloging.findOne(query);
    if (!book) {
      return NextResponse.json(
        { success: false, error: `Book not found for identifier "${id}"` },
        { status: 404 }
      );
    }

    // 1. Guard against book marked isCheckedOut
    if (book.isCheckedOut) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete book: At least one copy is currently checked out on active loan.' },
        { status: 400 }
      );
    }

    // 2. Guard against active loans in the circulation ledger
    const activeLoan = await Library.findOne({
      $or: [{ bookId: book._id }, { bookBarcode: book.barcode }],
      status: 'borrowed',
    });
    if (activeLoan) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete book: Copy is currently checked out on loan to patron (${activeLoan.patronBarcode}). Please process return first.`,
        },
        { status: 400 }
      );
    }

    // 3. Guard against active waiting or ready holds
    const activeHold = await Hold.findOne({
      $or: [{ bookId: book._id }, { bookBarcode: book.barcode }],
      status: { $in: ['waiting', 'ready'] },
    });
    if (activeHold) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete book: An active hold reservation exists for patron "${activeHold.patronName}" (${activeHold.patronBarcode}). Please cancel or fulfill the hold first.`,
        },
        { status: 400 }
      );
    }

    const deletedBook = book.toObject();

    // Safe deletion: remove monograph and clean up associated inventory copies
    await Cataloging.deleteOne({ _id: book._id });
    await Inventory.deleteMany({ $or: [{ bookId: book._id }, { barcode: book.barcode }] });
    await Hold.deleteMany({ $or: [{ bookId: book._id }, { bookBarcode: book.barcode }] });

    await recordDailyAction({
      actionType: 'book_delete',
      actionTitle: `Deleted monograph "${deletedBook.title?.mainTitle || book.barcode}" (Barcode: ${book.barcode})`,
      performedBy: auth.username,
      performedByName: auth.name || auth.username,
      performedByRole: auth.role,
      targetEntity: 'Cataloging',
      targetId: book._id.toString(),
      reversiblePayload: {
        deletedBook,
      },
      isReversible: true,
    });

    return NextResponse.json({
      success: true,
      message: `Book "${book.title.mainTitle}" removed from catalog successfully.`,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error deleting catalog record:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete catalog record' },
      { status: 500 }
    );
  }
}
