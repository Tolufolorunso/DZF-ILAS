import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getPendingSummariesQueue } from '@/lib/summaries/service';

/**
 * GET /api/summaries/queue
 * Returns all pending book summaries awaiting librarian moderation.
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

    const queue = await getPendingSummariesQueue();

    return NextResponse.json({
      success: true,
      queue,
      count: queue.length,
    });
  } catch (error) {
    console.error('GET /api/summaries/queue error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve moderation queue.' },
      { status: 500 }
    );
  }
}
