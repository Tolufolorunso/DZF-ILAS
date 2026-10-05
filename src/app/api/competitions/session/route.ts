import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCompetitions } from '@/lib/auth/rbac';
import {
  getActiveSession,
  updateSessionSettings,
} from '@/lib/competitions/service';

/**
 * GET /api/competitions/session
 * Returns active competition session metadata, settings, and participant totals.
 */
export async function GET() {
  try {
    const sessionInfo = await getActiveSession();
    return NextResponse.json({
      success: true,
      data: sessionInfo,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competitions/session
 * Admin/Librarian updates session active status or result publication gate.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (!canManageCompetitions(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Permission denied. Staff credentials required to manage competition settings.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await updateSessionSettings({
      isActive: body.isActive,
      isPublished: body.isPublished,
      sessionKey: body.sessionKey,
      title: body.title,
      staffName: user.name || user.username,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Competition session configuration updated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
