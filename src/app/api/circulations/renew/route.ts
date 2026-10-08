import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCirculation } from '@/lib/auth/rbac';
import { executeRenewal } from '@/lib/circulation/loan';

/**
 * POST /api/circulations/renew
 * Renews an active book loan, extending the dueDate.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (!canManageCirculation(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff privileges required for loan renewals.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || (!body.bookBarcode && !body.loanId)) {
      return NextResponse.json(
        { success: false, error: 'Either bookBarcode or loanId is required.' },
        { status: 400 }
      );
    }

    const extendDays = typeof body.extendDays === 'number' ? body.extendDays : 5;

    const result = await executeRenewal({
      bookBarcode: body.bookBarcode ? String(body.bookBarcode) : undefined,
      loanId: body.loanId ? String(body.loanId) : undefined,
      extendDays,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Loan renewed successfully.',
        newDueDate: result.newDueDate,
        renewalsCount: result.renewalsCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/circulations/renew:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while renewing loan.' },
      { status: 500 }
    );
  }
}
