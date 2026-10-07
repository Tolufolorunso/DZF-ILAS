import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCompetitions } from '@/lib/auth/rbac';
import { processCompetitionCheckin } from '@/lib/competitions/service';
import { recordDailyAction } from '@/lib/audit/dailyActionService';

/**
 * POST /api/competitions/checkin
 * Evaluates a competition book submission (grade 0-100, summary, teacher verification).
 * Enforces the 2-book daily cap in Africa/Lagos timezone.
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
            'Permission denied. Staff or judge credentials required to record competition evaluations.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (body.grade === undefined || body.grade === null) {
      return NextResponse.json(
        { success: false, error: 'Grade is required (0 to 100).' },
        { status: 400 }
      );
    }

    const entry = await processCompetitionCheckin({
      entryId: body.entryId,
      sessionKey: body.sessionKey,
      patronBarcode: body.patronBarcode,
      bookBarcode: body.bookBarcode,
      bookTitle: body.bookTitle,
      category: body.category,
      grade: Number(body.grade),
      summary: body.summary,
      feedback: body.feedback,
      teacherVerified: Boolean(body.teacherVerified),
      teacherVerifiedBy: body.teacherVerifiedBy || user.name || user.username,
      gradedBy: user.name || user.username,
    });

    await recordDailyAction({
      actionType: 'competition_entry',
      actionTitle: `Graded competition book "${entry.bookTitle}" (${entry.grade}/100) for patron ${entry.patronBarcode}`,
      performedBy: user.username,
      performedByName: user.name || user.username,
      performedByRole: user.role,
      targetEntity: 'Competition',
      targetId: String(entry._id),
      reversiblePayload: {
        competitionId: String(entry._id),
      },
      isReversible: true,
    });

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Competition evaluation and check-in recorded successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
