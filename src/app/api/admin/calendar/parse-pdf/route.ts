import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { extractAndParseCalendarPdf } from '@/lib/calendar/pdf-parser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/calendar/parse-pdf
 * Accepts an operational calendar PDF, extracts text streams, and parses
 * milestones into a structured array for staff preview and editing.
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
        { success: false, error: 'No PDF file provided. Please select a calendar file to upload.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please upload a standard PDF (.pdf) document.' },
        { status: 400 }
      );
    }

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowable limit of 15MB.' },
        { status: 400 }
      );
    }

    const targetYearRaw = formData.get('targetYear');
    const targetYear = targetYearRaw ? parseInt(String(targetYearRaw), 10) : new Date().getFullYear();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { totalPages, events, rawTextSnippet } = await extractAndParseCalendarPdf(buffer, targetYear);

    return NextResponse.json(
      {
        success: true,
        totalPages,
        eventsCount: events.length,
        events,
        rawTextSnippet,
        targetYear,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CALENDAR_PARSE_PDF_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse calendar PDF document',
      },
      { status: 500 }
    );
  }
}
