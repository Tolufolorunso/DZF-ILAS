import { NextRequest, NextResponse } from 'next/server';
import { getInactivePatrons } from '@/lib/activity/service';

/**
 * GET /api/leaderboard/inactive
 * Librarian outreach endpoint listing registered patrons who have 0 activity in the chosen month.
 * Query Params:
 *  - year: number (defaults to current year)
 *  - month: number (1-12, defaults to current month)
 *  - class: string (filter by student grade)
 *  - patronType: string
 *  - search: string
 *  - page: number
 *  - limit: number
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const classLevel = searchParams.get('class') || undefined;
    const patronType = searchParams.get('patronType') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid year or month parameter provided.' },
        { status: 400 }
      );
    }

    const data = await getInactivePatrons({
      year,
      month,
      classLevel,
      patronType,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('GET /api/leaderboard/inactive error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error fetching inactive patrons.',
      },
      { status: 500 }
    );
  }
}
