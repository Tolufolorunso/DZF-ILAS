import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { extractAndParseCalendarCsv } from '@/lib/calendar/csv-parser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/calendar/parse-csv
 * Accepts an operational calendar CSV, extracts records, parses
 * single and multi-stage milestones, and returns structured events for review.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { success: false, error: 'Invalid form submission. Multipart form data required.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No CSV file provided. Please select a calendar CSV to upload.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please upload a standard CSV (.csv) document.' },
        { status: 400 }
      );
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowable limit of 5MB.' },
        { status: 400 }
      );
    }

    const targetYearRaw = formData.get('targetYear');
    const targetYear = targetYearRaw ? parseInt(String(targetYearRaw), 10) : new Date().getFullYear();

    const csvText = await file.text();
    const { events, rawRowsCount } = extractAndParseCalendarCsv(csvText, targetYear);

    return NextResponse.json(
      {
        success: true,
        eventsCount: events.length,
        events,
        rawRowsCount,
        targetYear,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CALENDAR_PARSE_CSV_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse calendar CSV document',
      },
      { status: 500 }
    );
  }
}
