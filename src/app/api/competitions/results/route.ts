import { NextRequest, NextResponse } from 'next/server';
import { getCompetitionResults } from '@/lib/competitions/service';

/**
 * GET /api/competitions/results
 * Public and mobile-accessible endpoint for reading competition live leaderboard and podium results.
 * Supports filtering by category ('SS1-3', 'JSS1-3', 'P4-6', 'P1-3', or 'ALL').
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionKey = searchParams.get('sessionKey') || undefined;
    const category = searchParams.get('category') || 'ALL';

    const data = await getCompetitionResults(sessionKey, category);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
