import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getActiveLoans } from '@/lib/circulation/loan';

/**
 * GET /api/circulations/overdues
 * Returns all active overdue loans prioritized by delinquency severity.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const allLoans = await getActiveLoans();
    const overdues = allLoans.filter((l) => l.isOverdue);

    return NextResponse.json(
      {
        success: true,
        total: overdues.length,
        loans: overdues,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/circulations/overdues:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching overdue loans.' },
      { status: 500 }
    );
  }
}
