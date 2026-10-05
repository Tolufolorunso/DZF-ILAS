import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getActiveSessions } from '@/lib/attendance/service';

/**
 * GET /api/attendance/sessions
 * Returns default sessions merged with dynamic active cohorts from the database.
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

    const sessions = await getActiveSessions();

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('GET /api/attendance/sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve active sessions.' },
      { status: 500 }
    );
  }
}
