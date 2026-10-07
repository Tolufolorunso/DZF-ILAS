import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canActivateStaff, ALL_ROLES } from '@/lib/auth/rbac';
import connectDB from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { Notification } from '@/models/Notification';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/users/[id]/activate
 * Activates an inactive staff account and optionally updates assigned role.
 * Strictly restricted to Administrator roles (IMA, Country Manager, Admin).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || !canActivateStaff(sessionUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Staff activation privileges required (Admin only).' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Staff user not found' }, { status: 404 });
    }

    const previousRole = user.role;
    user.active = true;

    if (body.role && ALL_ROLES.includes(body.role as UserRole)) {
      user.role = body.role as UserRole;
    }

    await user.save();

    // Log audit event
    await logAuditEvent({
      action: 'STAFF_ACCOUNT_ACTIVATED',
      performedBy: sessionUser.username,
      performedByRole: sessionUser.role,
      targetEntity: 'User',
      targetId: id,
      details: {
        username: user.username,
        name: user.name,
        role: user.role,
        previousRole,
      },
    });

    // Send welcome notification to newly activated staff member
    try {
      await Notification.create({
        recipientUsername: user.username,
        senderUsername: sessionUser.username,
        type: 'system',
        title: '🎉 Staff Account Activated',
        message: `Welcome, ${user.name}! Your account has been approved and activated with role "${user.role.toUpperCase()}". You now have access to the DZF-ILLS workspace.`,
        link: '/dashboard',
        read: false,
      });
    } catch (notifErr) {
      console.warn('[ACTIVATION_NOTIF_ERROR]', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Staff account @${user.username} has been activated successfully.`,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          active: true,
          updatedAt: user.updatedAt?.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ACTIVATE_USER_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to activate staff account' },
      { status: 500 }
    );
  }
}
