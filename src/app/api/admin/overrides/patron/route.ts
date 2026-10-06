import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { executePatronOverride } from '@/lib/admin/service';
import type { PatronOverrideAction } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/overrides/patron
 * Grants administrative circulation overrides or clears borrow locks on patron accounts.
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
    if (!body || !body.patronBarcode || !body.action) {
      return NextResponse.json(
        { success: false, error: 'Fields "patronBarcode" and "action" are required.' },
        { status: 400 }
      );
    }

    const validActions: PatronOverrideAction[] = ['clear_borrow_lock', 'waive_overdues', 'grant_loan_override'];
    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { success: false, error: `Invalid override action. Valid actions: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await executePatronOverride({
      override: {
        patronBarcode: String(body.patronBarcode).trim(),
        action: body.action,
        reason: body.reason ? String(body.reason).trim() : 'Administrative executive discretion',
      },
      staffUsername: user.username,
      staffRole: user.role,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_PATRON_OVERRIDE_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply patron circulation override',
      },
      { status: 500 }
    );
  }
}
