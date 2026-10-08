import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCirculation } from '@/lib/auth/rbac';
import { executeCheckIn } from '@/lib/circulation/loan';

/**
 * POST /api/circulations/check-in
 * Processes book returns, updates copy counts, and awards return points.
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
        { success: false, error: 'Unauthorized. Staff privileges required for book check-in.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || (!body.bookBarcode && !body.patronBarcode)) {
      return NextResponse.json(
        { success: false, error: 'Either bookBarcode or patronBarcode is required for check-in.' },
        { status: 400 }
      );
    }

    const result = await executeCheckIn({
      bookBarcode: body.bookBarcode ? String(body.bookBarcode) : undefined,
      patronBarcode: body.patronBarcode ? String(body.patronBarcode) : undefined,
      receivedByUserId: auth.userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    if (result.success) {
      const { recordDailyAction } = await import('@/lib/audit/dailyActionService');
      const patronDisplay = result.patron
        ? `${result.patron.firstname} ${result.patron.surname}`
        : body.patronBarcode || 'Patron';
      const bookDisplay = result.book?.title?.mainTitle || result.book?.title || body.bookBarcode || 'Monograph';

      await recordDailyAction({
        actionType: 'book_return',
        actionTitle: `Checked in returned book "${bookDisplay}" from ${patronDisplay}`,
        performedBy: auth.username,
        performedByName: auth.name || auth.username,
        performedByRole: auth.role,
        targetEntity: 'Library',
        targetId: result.book?.barcode || body.bookBarcode,
        reversiblePayload: {
          bookBarcode: result.book?.barcode || body.bookBarcode,
          patronBarcode: result.patron?.barcode || body.patronBarcode,
          patronName: patronDisplay,
          pointsAwarded: result.pointsAwarded || 0,
        },
        isReversible: true,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Book returned successfully.',
        pointsAwarded: result.pointsAwarded,
        daysLate: result.daysLate,
        returnDate: result.returnDate,
        holdNotice: result.holdNotice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/circulations/check-in:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing check-in.' },
      { status: 500 }
    );
  }
}
