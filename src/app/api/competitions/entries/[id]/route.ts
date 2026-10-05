import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCompetitions } from '@/lib/auth/rbac';
import { updateCompetitionEntry } from '@/lib/competitions/service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/competitions/entries/[id]
 * Updates grade, feedback, teacher verification, or category for an existing entry.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
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
            'Permission denied. Staff credentials required to edit competition entries.',
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const updated = await updateCompetitionEntry(id, {
      grade: body.grade !== undefined ? Number(body.grade) : undefined,
      summary: body.summary,
      feedback: body.feedback,
      teacherVerified:
        body.teacherVerified !== undefined
          ? Boolean(body.teacherVerified)
          : undefined,
      teacherVerifiedBy: body.teacherVerifiedBy || user.name || user.username,
      gradedBy: user.name || user.username,
      category: body.category,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Competition entry updated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
