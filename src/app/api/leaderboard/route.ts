import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyLeaderboard } from '@/lib/activity/service';

/**
 * GET /api/leaderboard
 * Public & Staff endpoint for monthly gamified activity rankings and top 3 podium.
 * Strictly read-only to avoid N+1 write bottleneck on GET requests.
 * Query Params:
 *  - year: number (defaults to current year)
 *  - month: number (1-12, defaults to current month)
 *  - patronType: string ('all', 'student', 'teacher', 'staff', 'guest')
 *  - class: string (e.g. 'SS2', 'P5')
 *  - search: string (patron name or barcode)
 *  - page: number (default 1)
 *  - limit: number (default 20, max 100)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const now = new Date();
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const patronType = searchParams.get('patronType') || undefined;
    const classLevel = searchParams.get('class') || undefined;
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

    const data = await getMonthlyLeaderboard({
      year,
      month,
      patronType,
      classLevel,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error fetching leaderboard.',
      },
      { status: 500 }
    );
  }
}
