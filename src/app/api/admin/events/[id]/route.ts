import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { Event } from '@/models/Event';
import { connectDB } from '@/lib/db';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

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
