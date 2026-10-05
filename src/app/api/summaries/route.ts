import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getSummariesList, submitBookSummary } from '@/lib/summaries/service';

/**
 * GET /api/summaries
 * Returns filterable, paginated audit list of book summaries.
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const result = await getSummariesList({ status, search, page, limit });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('GET /api/summaries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve summaries.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/summaries
 * Submits a new book summary into the moderation queue.
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

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const { patronBarcode, bookBarcode, summary, rating, keyLearnings } = body;

    if (!patronBarcode || !bookBarcode || !summary) {
      return NextResponse.json(
        {
          success: false,
          error: 'patronBarcode, bookBarcode, and summary are required fields.',
        },
        { status: 400 }
      );
    }

    const result = await submitBookSummary({
      patronBarcode: String(patronBarcode),
      bookBarcode: String(bookBarcode),
      summary: String(summary),
      rating: typeof rating === 'number' ? rating : 5,
      keyLearnings: keyLearnings ? String(keyLearnings) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Book summary submitted successfully and queued for librarian review.',
        summary: result.summary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/summaries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit book summary.' },
      { status: 500 }
    );
  }
}
