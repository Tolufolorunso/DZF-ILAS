import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { listEvents, createEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/events
 * Lists upcoming institutional foundation calendar events.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const events = await listEvents({ limit });
    return NextResponse.json({ success: true, events }, { status: 200 });
  } catch (error) {
    console.error('[GET_EVENTS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/events
 * Schedules a new foundation event. Restricted to administrator roles.
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
    if (!body || !body.eventName || !body.eventDate) {
      return NextResponse.json(
        { success: false, error: 'Fields "eventName" and "eventDate" are required.' },
        { status: 400 }
      );
    }

    const event = await createEvent({
      eventName: String(body.eventName).trim(),
      title: body.title ? String(body.title).trim() : undefined,
      eventDate: new Date(body.eventDate),
      location: body.location ? String(body.location).trim() : undefined,
      targetAudience: body.targetAudience ? String(body.targetAudience).trim() : undefined,
      arrivalTime: body.arrivalTime ? String(body.arrivalTime).trim() : undefined,
      description: body.description ? String(body.description).trim() : undefined,
      staffUsername: user.username,
      staffRole: user.role,
    });

    return NextResponse.json(
      { success: true, message: 'Foundation event scheduled successfully.', event },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CREATE_EVENT_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to schedule event' },
      { status: 500 }
    );
  }
}
