import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models/Notification';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * Retrieves recent notifications and unread count for the active staff session.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const username = user.username.toLowerCase();

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientUsername: username })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ recipientUsername: username, read: false }),
    ]);

    return NextResponse.json(
      {
        success: true,
        notifications: notifications.map((n) => ({
          id: String(n._id),
          recipientUsername: n.recipientUsername,
          senderUsername: n.senderUsername,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
        })),
        unreadCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET_NOTIFICATIONS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Marks notifications as read (either all or specific ID).
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();
    const username = user.username.toLowerCase();
    const body = await req.json().catch(() => ({}));

    if (body.markAllRead) {
      await Notification.updateMany({ recipientUsername: username, read: false }, { read: true });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' }, { status: 200 });
    }

    if (body.id) {
      await Notification.updateOne({ _id: body.id, recipientUsername: username }, { read: true });
      return NextResponse.json({ success: true, message: 'Notification marked as read' }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: 'Either "id" or "markAllRead: true" is required' }, { status: 400 });
  } catch (error) {
    console.error('[PATCH_NOTIFICATIONS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update notification' },
      { status: 500 }
    );
  }
}
