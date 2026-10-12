import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { logAuditEvent, getSystemSettings } from '@/lib/admin/service';
import { SystemSetting } from '@/models/SystemSetting';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { eventBus } from '@/lib/realtime/eventBus';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/broadcast
 * Returns the currently active broadcast announcement banner.
 */
export async function GET() {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json({
      success: true,
      broadcastBanner: settings.broadcastBanner || null,
    });
  } catch (error) {
    console.error('[BROADCAST_GET_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve broadcast banner',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/broadcast
 * Updates system-wide broadcast announcement and dispatches real-time SSE + desktop alerts (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();
    const {
      message = '',
      severity = 'info',
      isActive = false,
      link = '',
      pushToDesktop = false,
    } = body;

    const trimmedMessage = String(message).trim();
    const validSeverity = ['info', 'warning', 'error', 'success'].includes(severity)
      ? severity
      : 'info';

    const now = new Date();
    const broadcastData = {
      message: trimmedMessage,
      severity: validSeverity,
      isActive: Boolean(isActive),
      link: String(link).trim(),
      pushToDesktop: Boolean(pushToDesktop),
      updatedAt: now,
      updatedBy: user.username,
    };

    const setting = await SystemSetting.findByIdAndUpdate(
      'default',
      {
        $set: {
          broadcastBanner: broadcastData,
          announcementBanner: isActive ? trimmedMessage : '',
          updatedBy: user.username,
        },
      },
      { new: true, upsert: true }
    );

    // If active and urgent push is requested, dispatch SSE and in-app notifications
    if (isActive && pushToDesktop && trimmedMessage) {
      eventBus.broadcast({
        type: 'broadcast',
        data: {
          title: 'Institutional Broadcast Announcement',
          message: trimmedMessage,
          link: link || '/dashboard',
          severity: validSeverity,
          timestamp: now.toISOString(),
        },
      });

      // Insert notifications for active staff
      const activeUsers = await User.find({ active: true }).select('username').lean();
      const notifs = activeUsers.map((u) => ({
        recipientUsername: u.username,
        type: 'broadcast' as const,
        title: 'Institutional Broadcast Announcement',
        message: trimmedMessage,
        link: link || '/dashboard',
        read: false,
      }));

      if (notifs.length > 0) {
        await Notification.insertMany(notifs);
      }
    }

    await logAuditEvent({
      action: 'BROADCAST_ANNOUNCEMENT_UPDATED',
      performedBy: user.username,
      performedByRole: user.role,
      targetEntity: 'SystemSetting',
      targetId: 'default',
      details: {
        isActive,
        severity: validSeverity,
        pushToDesktop,
        messageLength: trimmedMessage.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: isActive ? 'Broadcast banner published successfully.' : 'Broadcast banner deactivated.',
      broadcastBanner: setting.broadcastBanner,
    });
  } catch (error) {
    console.error('[BROADCAST_POST_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update broadcast banner',
      },
      { status: 500 }
    );
  }
}
