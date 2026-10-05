import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Library } from '@/models/Library';
import { Patron } from '@/models/Patron';
import { getSessionUser } from '@/lib/auth/session';
import { getActiveLoans } from '@/lib/circulation/loan';

/**
 * GET /api/circulations/history
 * Comprehensive loan circulation ledger with status filtering, search, and pagination.
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim() || 'all';

    // If querying active/borrowed loans
    if (statusFilter === 'borrowed' || statusFilter === 'overdue') {
      const activeLoans = await getActiveLoans();
      let filtered = activeLoans;

      if (statusFilter === 'overdue') {
        filtered = filtered.filter((l) => l.isOverdue);
      } else if (statusFilter === 'borrowed') {
        filtered = filtered.filter((l) => !l.isOverdue);
      }

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.bookTitle.toLowerCase().includes(q) ||
            l.bookBarcode.toLowerCase().includes(q) ||
            l.patronName.toLowerCase().includes(q) ||
            l.patronBarcode.toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const paginated = filtered.slice((page - 1) * limit, page * limit);

      return NextResponse.json(
        {
          success: true,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          loans: paginated,
        },
        { status: 200 }
      );
    }

    // Default or 'all' / 'returned' / 'lost': Query Library collection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      // Ignore institutional library settings document that doesn't have bookBarcode
      bookBarcode: { $exists: true, $ne: '' },
    };

    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { bookTitle: regex },
        { bookBarcode: regex },
        { patronBarcode: regex },
      ];
    }

    const total = await Library.countDocuments(filter);
    const rawLoans = await Library.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Enrich with patron names if missing
    const patronBarcodes = Array.from(
      new Set(rawLoans.map((l) => l.patronBarcode).filter((b): b is string => Boolean(b)))
    );
    const patrons = await Patron.find({ barcode: { $in: patronBarcodes } })
      .select('barcode firstname surname image_url studentSchoolInfo')
      .lean();
    const patronMap = new Map(patrons.map((p) => [p.barcode, p]));

    const now = new Date();
    const loans = rawLoans.map((l) => {
      const p = patronMap.get(l.patronBarcode || '');
      const due = l.dueDate ? new Date(l.dueDate) : new Date();
      const isOverdue = l.status === 'borrowed' && due < now;
      const overdueDays = isOverdue ? Math.max(1, Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      return {
        id: String(l._id),
        bookId: l.bookId ? String(l.bookId) : '',
        bookBarcode: l.bookBarcode || '',
        bookTitle: l.bookTitle || 'Untitled Book',
        patronId: l.patronId ? String(l.patronId) : '',
        patronBarcode: l.patronBarcode || '',
        patronName: p ? `${p.firstname} ${p.surname}`.trim() : 'Registered Patron',
        patronPhoto: p?.image_url?.secure_url,
        patronClass: p?.studentSchoolInfo?.currentClass || 'N/A',
        issueDate: l.issueDate ? new Date(l.issueDate).toISOString() : new Date(l.createdAt).toISOString(),
        dueDate: due.toISOString(),
        returnDate: l.returnDate ? new Date(l.returnDate).toISOString() : undefined,
        renewalsCount: l.renewalsCount || 0,
        status: isOverdue ? 'overdue' : l.status || 'borrowed',
        isOverdue,
        overdueDays,
      };
    });

    return NextResponse.json(
      {
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        loans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/circulations/history:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching circulation history.' },
      { status: 500 }
    );
  }
}
