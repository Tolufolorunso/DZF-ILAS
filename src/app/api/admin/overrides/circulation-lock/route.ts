import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { toggleCirculationLock } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/overrides/circulation-lock
 * Toggles system-wide emergency circulation lock.
 * Restricted to administrator roles with audit logging.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.lock !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Field "lock" (boolean) is required in request payload.' },
        { status: 400 }
      );
    }

    const settings = await toggleCirculationLock({
      lock: body.lock,
      reason: body.reason ? String(body.reason).trim() : undefined,
      staffUsername: user.username,
      staffRole: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: body.lock
          ? 'Emergency circulation lock activated. Book checkouts paused.'
          : 'Emergency circulation lock deactivated. Normal checkouts resumed.',
        settings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_CIRCULATION_LOCK_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update circulation lock',
      },
      { status: 500 }
    );
  }
}
