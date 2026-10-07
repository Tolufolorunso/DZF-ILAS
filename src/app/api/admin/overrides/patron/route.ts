import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { getPatron360Data, executePatronOverride } from '@/lib/admin/service';
import type { PatronOverrideAction } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/overrides/patron?query=...
 * Inspects a patron's complete 360-degree profile, loans history, attendance ledger, competitions, and summaries.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('query') || searchParams.get('barcode') || searchParams.get('id') || '';
    const clean = rawQuery.trim();

    if (!clean) {
      return NextResponse.json(
        { success: false, error: 'A search query or patron barcode is required.' },
        { status: 400 }
      );
    }

    const data = await getPatron360Data(clean);

    return NextResponse.json(
      {
        success: true,
        patron: data.patron,
        activeLoans: data.loans.filter((l) => l.status === 'borrowed' || l.status === 'overdue'),
        patron360: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_PATRON_OVERRIDE_GET_ERROR]', error);
    const msg = error instanceof Error ? error.message : 'Lookup failed';
    const is404 = msg.includes('not found');
    return NextResponse.json(
      { success: false, error: msg },
      { status: is404 ? 404 : 500 }
    );
  }
}

/**
 * POST /api/admin/overrides/patron
 * Grants administrative circulation overrides or executes executive interventions across loans, attendance, competitions, summaries, or profile.
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

    const validActions: PatronOverrideAction[] = [
      'clear_borrow_lock',
      'waive_overdues',
      'grant_loan_override',
      'force_return',
      'force_checkout',
      'toggle_active_status',
      'update_profile',
      'adjust_points',
      'delete_loan',
      'edit_loan',
      'add_attendance',
      'delete_attendance',
      'edit_competition',
      'delete_competition',
      'edit_summary',
      'delete_summary',
      'delete_patron',
    ];
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
        loanId: body.loanId ? String(body.loanId).trim() : undefined,
        monographBarcode: body.monographBarcode ? String(body.monographBarcode).trim() : undefined,
        attendanceId: body.attendanceId ? String(body.attendanceId).trim() : undefined,
        competitionId: body.competitionId ? String(body.competitionId).trim() : undefined,
        summaryId: body.summaryId ? String(body.summaryId).trim() : undefined,
        updates: body.updates && typeof body.updates === 'object' ? body.updates : undefined,
        newEntry: body.newEntry && typeof body.newEntry === 'object' ? body.newEntry : undefined,
        pointsDelta: body.pointsDelta !== undefined ? Number(body.pointsDelta) : undefined,
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
