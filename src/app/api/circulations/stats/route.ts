import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getCirculationStats } from '@/lib/circulation/loan';

/**
 * GET /api/circulations/stats
 * Returns active loans, overdues, returns today, and monthly checkouts.
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

    const stats = await getCirculationStats();

    return NextResponse.json(
      {
        success: true,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/circulations/stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching circulation statistics.' },
      { status: 500 }
    );
  }
}
