import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getAttendanceLogs } from '@/lib/attendance/service';

/**
 * GET /api/attendance
 * Returns filterable, paginated audit list of attendance records.
 * Query params: page, limit, date, startDate, endDate, classType, className, barcode, search
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const date = searchParams.get('date') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const classType = searchParams.get('classType') || undefined;
    const className = searchParams.get('className') || undefined;
    const patronBarcode = searchParams.get('patronBarcode') || searchParams.get('barcode') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getAttendanceLogs({
      page,
      limit,
      date,
      startDate,
      endDate,
      classType,
      className,
      patronBarcode,
      search,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('GET /api/attendance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve attendance logs.' },
      { status: 500 }
    );
  }
}
