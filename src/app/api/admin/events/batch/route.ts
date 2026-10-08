import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { createEventsBatch } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/events/batch
 * Bulk imports an array of verified/edited calendar events (e.g. from PDF ingestion).
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

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: "events" must be a non-empty array.' },
        { status: 400 }
      );
    }

    type EventCategory = 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
    const VALID_CATEGORIES: EventCategory[] = ['assembly', 'workshop', 'competition', 'holiday', 'meeting', 'general'];

    interface RawBatchEvent {
      eventName?: string;
      title?: string;
      eventDate?: string;
      academicYear?: number;
      category?: string;
      location?: string;
      targetAudience?: string;
      arrivalTime?: string;
      description?: string;
      participants?: string;
      focalPerson?: string;
      remarks?: string;
    }

    const rawEvents = body.events as RawBatchEvent[];
    const parsedEvents = rawEvents.map((e) => {
      const category: EventCategory | undefined =
        typeof e.category === 'string' && VALID_CATEGORIES.includes(e.category as EventCategory)
          ? (e.category as EventCategory)
          : undefined;

      return {
        eventName: String(e.eventName || e.title || 'Untitled Event').trim(),
        title: e.title ? String(e.title).trim() : String(e.eventName || 'Untitled Event').trim(),
        eventDate: new Date(String(e.eventDate || '')),
        academicYear: e.academicYear ? Number(e.academicYear) : new Date(String(e.eventDate || '')).getFullYear(),
        category,
        location: e.location ? String(e.location).trim() : undefined,
        targetAudience: e.targetAudience ? String(e.targetAudience).trim() : undefined,
        arrivalTime: e.arrivalTime ? String(e.arrivalTime).trim() : undefined,
        description: e.description ? String(e.description).trim() : undefined,
        participants: e.participants ? String(e.participants).trim() : undefined,
        focalPerson: e.focalPerson ? String(e.focalPerson).trim() : undefined,
        remarks: e.remarks ? String(e.remarks).trim() : undefined,
      };
    });

    // Filter out invalid dates
    const validEvents = parsedEvents.filter((e) => !isNaN(e.eventDate.getTime()));
    if (validEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'None of the provided events contained valid event dates.' },
        { status: 400 }
      );
    }

    const result = await createEventsBatch({
      events: validEvents,
      staffUsername: user.username,
      staffRole: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully imported ${result.count} foundation events to the operational calendar.`,
        count: result.count,
        events: result.events,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[BATCH_EVENTS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to import events batch' },
      { status: 500 }
    );
  }
}
