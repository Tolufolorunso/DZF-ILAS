import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { recalculateMonthlyRanks } from '@/lib/activity/service';

/**
 * POST /api/leaderboard/recalculate
 * Protected staff action (librarian/admin) to recompute activity scores and assign sequential ranks.
 * Body: { year?: number, month?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Staff authentication required to recalculate rankings.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const year = body.year ? parseInt(body.year, 10) : now.getFullYear();
    const month = body.month ? parseInt(body.month, 10) : now.getMonth() + 1;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Valid year and month (1-12) are required.' },
        { status: 400 }
      );
    }

    const result = await recalculateMonthlyRanks(year, month);

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated ${result.count} patron rankings for ${result.monthYear}.`,
      data: result,
    });
  } catch (error) {
    console.error('POST /api/leaderboard/recalculate error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error recalculating leaderboard.',
      },
      { status: 500 }
    );
  }
}
