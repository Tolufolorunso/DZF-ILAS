import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCirculation } from '@/lib/auth/rbac';
import { executeCheckout } from '@/lib/circulation/loan';

/**
 * POST /api/circulations/check-out
 * Books a loan checkout between a registered patron and catalog book copy.
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
        { success: false, error: 'Unauthorized. Staff privileges required for book checkouts.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.patronBarcode || !body.bookBarcode) {
      return NextResponse.json(
        { success: false, error: 'patronBarcode and bookBarcode are required.' },
        { status: 400 }
      );
    }

    const dueDays = typeof body.dueDays === 'number' ? body.dueDays : 5;
    const eventTitle = body.eventTitle ? String(body.eventTitle).trim() : undefined;

    const result = await executeCheckout({
      patronBarcode: String(body.patronBarcode),
      bookBarcode: String(body.bookBarcode),
      dueDays,
      eventTitle,
      issuedByUserId: auth.userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    if (result.success && result.loan) {
      const { recordDailyAction } = await import('@/lib/audit/dailyActionService');
      const patronDisplay = result.patron
        ? `${result.patron.firstname} ${result.patron.surname}`
        : String(body.patronBarcode);
      const loanObj = result.loan as unknown as { id?: unknown; _id?: unknown };
      const targetLoanId = String(loanObj.id || loanObj._id || '');
      await recordDailyAction({
        actionType: 'book_checkout',
        actionTitle: `Checked out "${result.loan.bookTitle || body.bookBarcode}" to ${patronDisplay}`,
        performedBy: auth.username,
        performedByName: auth.name || auth.username,
        performedByRole: auth.role,
        targetEntity: 'Library',
        targetId: targetLoanId,
        reversiblePayload: {
          loanId: targetLoanId,
          bookBarcode: String(body.bookBarcode),
          patronBarcode: String(body.patronBarcode),
        },
        isReversible: true,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Book checkout completed successfully.',
        dueDate: result.dueDate,
        pointsAwarded: result.pointsAwarded,
        eventTitle: result.eventTitle,
        loan: result.loan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in /api/circulations/check-out:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing checkout.' },
      { status: 500 }
    );
  }
}
