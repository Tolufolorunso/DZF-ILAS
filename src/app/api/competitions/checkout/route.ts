import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCompetitions } from '@/lib/auth/rbac';
import { createCompetitionCheckout } from '@/lib/competitions/service';

/**
 * POST /api/competitions/checkout
 * Records a competition checkout for a patron.
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
            'Permission denied. Staff credentials required to checkout competition books.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.patronBarcode) {
      return NextResponse.json(
        { success: false, error: 'Patron barcode is required.' },
        { status: 400 }
      );
    }

    const entry = await createCompetitionCheckout({
      sessionKey: body.sessionKey,
      patronBarcode: body.patronBarcode,
      bookBarcode: body.bookBarcode,
      bookTitle: body.bookTitle,
      category: body.category,
      checkedOutBy: user.name || user.username,
    });

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Competition book checked out successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
