import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCompetitions } from '@/lib/auth/rbac';
import { listCompetitionEntries } from '@/lib/competitions/service';

/**
 * GET /api/competitions/entries
 * Returns a paginated list of competition entries for the staff ledger table.
 */
export async function GET(req: NextRequest) {
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
            'Permission denied. Staff credentials required to view competition entries.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionKey = searchParams.get('sessionKey') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listCompetitionEntries({
      sessionKey,
      category,
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
