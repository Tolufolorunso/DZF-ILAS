import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { listDailyActions, getCurrentNigeriaDateString } from '@/lib/audit/dailyActionService';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['admin', 'asst_admin', 'country_manager', 'ima'];

/**
 * GET /api/admin/daily-actions
 * Retrieves staff actions stream filtered by date and staff, enforcing leadership privacy.
 */
export async function GET(req: NextRequest) {
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
          error: 'Forbidden: You do not have authorization to access staff daily actions.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date')?.trim() || getCurrentNigeriaDateString();
    const staff = searchParams.get('staff')?.trim() || undefined;
    const actionType = searchParams.get('type')?.trim() || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const result = await listDailyActions({
      date,
      staff,
      actionType,
      limit,
      skip,
      currentUserRole: sessionUser.role,
    });

    return NextResponse.json({
      success: true,
      actions: result.actions,
      total: result.total,
      targetDate: result.targetDate,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit) || 1,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve daily actions';
    console.error('[DAILY_ACTIONS_GET_ERROR]', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
