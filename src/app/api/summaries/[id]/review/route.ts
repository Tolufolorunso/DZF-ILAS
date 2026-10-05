import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { reviewBookSummary } from '@/lib/summaries/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/summaries/[id]/review
 * Moderates a pending book summary:
 * - Approved: awards +2 to +10 points to patron and updates monthly activity.
 * - Rejected: marks as rejected with mandatory feedback.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const allowedRoles = ['admin', 'librarian', 'ict'];
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Staff privileges required to moderate book summaries.',
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    if (!body || !body.action) {
      return NextResponse.json(
        { success: false, error: 'Moderation "action" ("approved" or "rejected") is required.' },
        { status: 400 }
      );
    }

    const action = body.action === 'approved' ? 'approved' : body.action === 'rejected' ? 'rejected' : null;
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approved" or "rejected".' },
        { status: 400 }
      );
    }

    const reviewerName = auth.name || auth.username || 'Library Staff';

    const result = await reviewBookSummary(id, {
      action,
      points: typeof body.points === 'number' ? body.points : Number(body.points),
      feedback: body.feedback ? String(body.feedback) : undefined,
      reviewer: {
        id: auth.userId,
        name: reviewerName,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'approved'
          ? `Summary approved! ${result.summary?.points} points awarded to ${result.summary?.patronName}.`
          : `Summary rejected with feedback.`,
      summary: result.summary,
    });
  } catch (error) {
    console.error('POST /api/summaries/[id]/review error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to review book summary.' },
      { status: 500 }
    );
  }
}
