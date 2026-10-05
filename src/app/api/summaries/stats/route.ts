import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getSummaryStats } from '@/lib/summaries/service';

/**
 * GET /api/summaries/stats
 * Returns high-level metrics on book summaries and awarded gamification points.
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

    const stats = await getSummaryStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('GET /api/summaries/stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve summary statistics.' },
      { status: 500 }
    );
  }
}
