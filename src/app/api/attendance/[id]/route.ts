import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { undoAttendance } from '@/lib/attendance/service';

/**
 * DELETE /api/attendance/[id]
 * Undoes an attendance check-in and reverses points on Patron and MonthlyActivity.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Attendance ID is required.' },
        { status: 400 }
      );
    }

    const result = await undoAttendance(id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('DELETE /api/attendance/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to undo attendance check-in.' },
      { status: 500 }
    );
  }
}
