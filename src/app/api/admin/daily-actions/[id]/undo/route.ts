import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { undoDailyAction } from '@/lib/audit/dailyActionService';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['admin', 'asst_admin', 'country_manager', 'ima'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/daily-actions/[id]/undo
 * Executes same-day reversible undo for an eligible staff action.
 * Enforces role guards, leadership privacy protection, and the 12:00 AM midnight cutoff.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(sessionUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You do not have authorization to undo operational actions.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Daily action ID is required.' },
        { status: 400 }
      );
    }

    const result = await undoDailyAction(id, {
      username: sessionUser.username,
      role: sessionUser.role,
      name: sessionUser.name,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to undo action';
    console.error('[DAILY_ACTION_UNDO_ERROR]', err);

    if (message.includes('Unauthorized') || message.includes('leadership')) {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }

    if (
      message.includes('12:00 AM midnight') ||
      message.includes('already been undone') ||
      message.includes('does not support automated reversal')
    ) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    if (message.includes('not found')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
