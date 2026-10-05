import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getAttendanceStats } from '@/lib/attendance/service';

/**
 * GET /api/attendance/stats
 * Live daily statistics: total check-ins, library visitors, class attendance, unique patrons, total points.
 * Query param: date (optional, defaults to today)
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
    const date = searchParams.get('date') || undefined;

    const stats = await getAttendanceStats(date);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('GET /api/attendance/stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve attendance statistics.' },
      { status: 500 }
    );
  }
}
