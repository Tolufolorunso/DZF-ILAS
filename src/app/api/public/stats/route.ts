import { NextResponse } from 'next/server';
import { getSystemStats } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/stats
 * Public institutional metrics feed for home board, Android app, and public dashboards.
 */
export async function GET() {
  try {
    const stats = await getSystemStats();

    return NextResponse.json(
      {
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[PUBLIC_STATS_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve system statistics',
      },
      { status: 500 }
    );
  }
}
