import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Cataloging } from '@/models/Cataloging';
import { getSessionUser } from '@/lib/auth/session';

/**
 * GET /api/catalog/search
 * Fast lookup endpoint for barcode scanners, circulation checkout and Android companion app
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({
        success: true,
        books: [],
      });
    }

    // Exact barcode match takes highest priority
    const exactBarcodeMatch = await Cataloging.findOne({ barcode: query }).lean();
    if (exactBarcodeMatch) {
      return NextResponse.json({
        success: true,
        books: [exactBarcodeMatch],
        exactMatch: true,
      });
    }

    // Substring / regex query
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const books = await Cataloging.find({
      $or: [
        { barcode: regex },
        { ISBN: regex },
        { controlNumber: regex },
        { 'title.mainTitle': regex },
        { 'title.subtitle': regex },
        { 'author.mainAuthor': regex },
      ],
    })
      .select('title author publicationInfo classification controlNumber barcode isCheckedOut copiesTotal copiesAvailable shelfLocation image_url')
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      books,
      count: books.length,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error searching catalog:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to search catalog' },
      { status: 500 }
    );
  }
}
