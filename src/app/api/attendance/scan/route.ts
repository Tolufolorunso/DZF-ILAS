import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { recordAttendanceScan } from '@/lib/attendance/service';

/**
 * POST /api/attendance/scan
 * High-speed scan logging endpoint for Web and Android mobile scanner.
 * Accepts: { barcode, classType, className, classDate, points, notes }
 * Returns: 201 Created on success, 409 Conflict on duplicate scan.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to scan attendance.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.barcode) {
      return NextResponse.json(
        { success: false, error: 'Patron barcode is required.' },
        { status: 400 }
      );
    }

    const markedBy = auth.name || auth.username || 'Desk Staff';

    const result = await recordAttendanceScan({
      barcode: String(body.barcode).trim(),
      classType: body.classType,
      className: body.className,
      classDate: body.classDate,
      points: typeof body.points === 'number' ? body.points : undefined,
      notes: body.notes,
      markedBy,
    });

    if (!result.success) {
      if (result.alreadyMarked) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            alreadyMarked: true,
            existingAttendance: result.existingAttendance,
            patron: result.patron,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    if (result.success) {
      const attendanceObj = result.attendance as unknown as { _id?: unknown; id?: unknown; points?: unknown } | undefined;
      const patronObj = result.patron as unknown as { _id?: unknown; id?: unknown } | undefined;
      const targetAttendanceId = String(attendanceObj?._id || attendanceObj?.id || '');
      const targetPatronId = String(patronObj?._id || patronObj?.id || '');
      const awardedPoints = typeof attendanceObj?.points === 'number'
        ? attendanceObj.points
        : (typeof body.points === 'number' ? body.points : 2);

      const { recordDailyAction } = await import('@/lib/audit/dailyActionService');
      await recordDailyAction({
        actionType: 'attendance_scan',
        actionTitle: `Logged attendance for ${result.patron?.fullName || 'Patron'} (${result.patron?.barcode || body.barcode}) in ${body.className || 'Library Session'}`,
        performedBy: auth.username,
        performedByName: auth.name || auth.username,
        performedByRole: auth.role,
        targetEntity: 'Attendance',
        targetId: targetAttendanceId,
        reversiblePayload: {
          attendanceId: targetAttendanceId,
          patronId: targetPatronId,
          pointsAwarded: awardedPoints,
        },
        isReversible: true,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        attendance: result.attendance,
        patron: result.patron,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/attendance/scan error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while logging attendance.' },
      { status: 500 }
    );
  }
}
