import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { Event } from '@/models/Event';
import { connectDB } from '@/lib/db';
import { logAuditEvent, updateEventDetails } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/events/[id]
 * Updates details of a scheduled foundation event. Restricted to administrators.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const updated = await updateEventDetails({
      id,
      eventName: body.eventName !== undefined ? String(body.eventName).trim() : undefined,
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      academicYear: body.academicYear ? Number(body.academicYear) : undefined,
      category: body.category,
      location: body.location !== undefined ? String(body.location).trim() : undefined,
      targetAudience: body.targetAudience !== undefined ? String(body.targetAudience).trim() : undefined,
      arrivalTime: body.arrivalTime !== undefined ? String(body.arrivalTime).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      participants: body.participants !== undefined ? String(body.participants).trim() : undefined,
      focalPerson: body.focalPerson !== undefined ? String(body.focalPerson).trim() : undefined,
      remarks: body.remarks !== undefined ? String(body.remarks).trim() : undefined,
      staffUsername: user.username,
      staffRole: user.role,
    });

    return NextResponse.json(
      { success: true, message: 'Foundation event updated successfully.', event: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH_EVENT_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/events/[id]
 * Deletes a scheduled foundation event. Restricted to administrators.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    await logAuditEvent({
      action: 'EVENT_DELETED',
      performedBy: user.username,
      performedByRole: user.role,
      targetEntity: 'Event',
      targetId: id,
      details: { eventName: event.eventName },
    });

    return NextResponse.json(
      { success: true, message: 'Foundation event deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE_EVENT_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete event' },
      { status: 500 }
    );
  }
}
