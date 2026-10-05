import { NextRequest, NextResponse } from 'next/server';
import { getPatronMonthlyHistory } from '@/lib/activity/service';

/**
 * GET /api/leaderboard/patron/[id]
 * Retrieves multi-month performance trajectory for an individual patron.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Patron ID is required.' },
        { status: 400 }
      );
    }

    const data = await getPatronMonthlyHistory(id);
    if (!data.patron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('GET /api/leaderboard/patron/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error fetching patron history.',
      },
      { status: 500 }
    );
  }
}
