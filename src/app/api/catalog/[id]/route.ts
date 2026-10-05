import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Cataloging } from '@/models/Cataloging';
import { getSessionUser } from '@/lib/auth/session';

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

    const allowedRoles = ['admin', 'librarian', 'ict'];
    if (!allowedRoles.includes(auth.role)) {
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

    if (auth.role !== 'admin') {
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

    if (book.isCheckedOut) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a book that is currently checked out on loan.' },
        { status: 400 }
      );
    }

    await Cataloging.deleteOne({ _id: book._id });

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
