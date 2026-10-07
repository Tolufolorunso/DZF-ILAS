import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Cataloging, Inventory } from '@/models';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCatalog } from '@/lib/auth/rbac';
import { getNextControlNumber, generateDefaultBookBarcode } from '@/lib/catalog/accession';

/**
 * GET /api/catalog
 * Paginated and filtered catalog listing
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate caller (cookie or Bearer)
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const classification = searchParams.get('classification')?.trim() || '';
    const genre = searchParams.get('genre')?.trim() || '';
    const availableOnly = searchParams.get('available') === 'true';

    // Build query filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { 'title.mainTitle': regex },
        { 'title.subtitle': regex },
        { 'author.mainAuthor': regex },
        { barcode: regex },
        { controlNumber: regex },
        { ISBN: regex },
        { shelfLocation: regex },
      ];
    }

    if (classification && classification !== 'all') {
      filter.classification = new RegExp(`^${classification}`, 'i');
    }

    if (genre && genre !== 'all') {
      filter.indexTermGenre = new RegExp(genre, 'i');
    }

    if (availableOnly) {
      filter.isCheckedOut = false;
    }

    const total = await Cataloging.countDocuments(filter);
    const books = await Cataloging.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      books,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching catalog:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/catalog
 * Acquire a new book into the catalog
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    // Role check: Only admin, librarian, ict can acquire books
    if (!canManageCatalog(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to catalog new books.' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    const {
      mainTitle,
      subtitle,
      mainAuthor,
      additionalAuthors,
      publisher,
      place,
      year,
      ISBN,
      classification,
      controlNumber: customControlNumber,
      barcode: customBarcode,
      indexTermGenre,
      informationSummary,
      language = 'english',
      physicalDescription,
      copiesTotal = 1,
      shelfLocation,
      image_url,
    } = body;

    // Validate required fields
    if (!mainTitle?.trim()) {
      return NextResponse.json({ success: false, error: 'Book main title is required' }, { status: 400 });
    }
    if (!mainAuthor?.trim()) {
      return NextResponse.json({ success: false, error: 'Main author is required' }, { status: 400 });
    }
    if (!classification?.trim()) {
      return NextResponse.json({ success: false, error: 'Dewey classification is required' }, { status: 400 });
    }

    const cleanClass = classification.trim();

    // Determine Accession Control Number
    let controlNumber = customControlNumber?.trim();
    if (!controlNumber) {
      controlNumber = await getNextControlNumber(cleanClass);
    }

    // Check unique controlNumber
    const existingControl = await Cataloging.findOne({ controlNumber });
    if (existingControl) {
      return NextResponse.json(
        { success: false, error: `A book with control number "${controlNumber}" already exists.` },
        { status: 409 }
      );
    }

    // Determine Barcode
    const pubYear = year ? parseInt(year, 10) : new Date().getFullYear();
    let barcode = customBarcode?.trim();
    if (!barcode) {
      barcode = generateDefaultBookBarcode(cleanClass, controlNumber, pubYear);
    }

    // Check unique barcode
    const existingBarcode = await Cataloging.findOne({ barcode });
    if (existingBarcode) {
      return NextResponse.json(
        { success: false, error: `A book with barcode "${barcode}" already exists.` },
        { status: 409 }
      );
    }

    const copies = Math.max(1, parseInt(copiesTotal, 10) || 1);

    const newBook = await Cataloging.create({
      title: {
        mainTitle: mainTitle.trim(),
        subtitle: subtitle?.trim() || '',
      },
      author: {
        mainAuthor: mainAuthor.trim(),
        additionalAuthors: Array.isArray(additionalAuthors) ? additionalAuthors.filter(Boolean) : [],
      },
      publicationInfo: {
        publisher: publisher?.trim() || 'DZF Press',
        place: place?.trim() || 'Nigeria',
        year: pubYear,
      },
      ISBN: ISBN?.trim() || '',
      classification: cleanClass,
      controlNumber,
      barcode,
      indexTermGenre: Array.isArray(indexTermGenre) ? indexTermGenre.filter(Boolean) : (indexTermGenre ? [indexTermGenre] : []),
      informationSummary: informationSummary?.trim() || '',
      language: language?.trim() || 'english',
      physicalDescription: physicalDescription?.trim() || '',
      holdingsInformation: copies,
      copiesTotal: copies,
      copiesAvailable: copies,
      shelfLocation: shelfLocation?.trim() || 'Main Stacks',
      image_url: image_url || '',
      isCheckedOut: false,
      library: 'AAoJ',
      checkedOutHistory: [],
      patronsCheckedOutHistory: [],
    });

    // Create corresponding Inventory copy tracking entry
    try {
      await Inventory.create({
        name: newBook.title.mainTitle,
        dept: 'Library',
        quantity: copies,
        barcode: newBook.barcode,
        bookId: newBook._id,
        condition: 'new',
        status: 'available',
        acquisitionDate: new Date(),
        addedBy: auth.name || auth.username,
      });
    } catch (invErr) {
      console.warn('Note: Could not create duplicate Inventory record:', invErr);
    }

    try {
      const { recordDailyAction } = await import('@/lib/audit/dailyActionService');
      await recordDailyAction({
        actionType: 'book_create',
        actionTitle: `Acquired monograph "${newBook.title.mainTitle}" (Barcode: ${newBook.barcode})`,
        performedBy: auth.username,
        performedByName: auth.name || auth.username,
        performedByRole: auth.role,
        targetEntity: 'Cataloging',
        targetId: newBook._id.toString(),
        reversiblePayload: {
          bookId: newBook._id.toString(),
          barcode: newBook.barcode,
        },
        isReversible: true,
      });
    } catch (logErr) {
      console.warn('DailyAction logging warning:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Book cataloged successfully',
      book: newBook,
    }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating catalog entry:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to catalog book' },
      { status: 500 }
    );
  }
}
