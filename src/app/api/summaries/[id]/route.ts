import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getSummaryById } from '@/lib/summaries/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/summaries/[id]
 * Retrieves full details of a specific book summary record.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const summary = await getSummaryById(id);

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Book summary not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('GET /api/summaries/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve book summary.' },
      { status: 500 }
    );
  }
}
