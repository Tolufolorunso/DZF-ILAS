import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canActivateStaff, ALL_ROLES, ROLE_HIERARCHY_RANK } from '@/lib/auth/rbac';
import connectDB from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/users/[id]/role
 * Updates the assigned role of a staff member.
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
        { success: false, error: 'Unauthorized. Staff administration privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (!body.role || !ALL_ROLES.includes(body.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'A valid staff role is required.' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Staff user not found' }, { status: 404 });
    }

    // Forbid self-role modification
    if (
      sessionUser.id === id ||
      (sessionUser.username && user.username && sessionUser.username.toLowerCase() === user.username.toLowerCase())
    ) {
      return NextResponse.json(
        { success: false, error: 'Self-role modification is forbidden.' },
        { status: 403 }
      );
    }

    const actorRank = ROLE_HIERARCHY_RANK[sessionUser.role as UserRole] || 0;
    const targetCurrentRank = ROLE_HIERARCHY_RANK[user.role as UserRole] || 0;
    const targetNewRank = ROLE_HIERARCHY_RANK[body.role as UserRole] || 0;

    // IMA has top rank and can modify any staff member.
    // Non-IMA leadership cannot modify peers or superiors.
    if (sessionUser.role !== 'ima') {
      if (targetCurrentRank >= actorRank) {
        return NextResponse.json(
          {
            success: false,
            error: `Unauthorized. You cannot modify the role of a staff member with equal or higher rank (${user.role.toUpperCase()}).`,
          },
          { status: 403 }
        );
      }

      if (targetNewRank > actorRank) {
        return NextResponse.json(
          {
            success: false,
            error: `Unauthorized. You cannot assign a role with higher rank than your own (${String(body.role).toUpperCase()}).`,
          },
          { status: 403 }
        );
      }
    }

    const previousRole = user.role;
    user.role = body.role as UserRole;
    await user.save();

    await logAuditEvent({
      action: 'STAFF_ROLE_UPDATED',
      performedBy: sessionUser.username,
      performedByRole: sessionUser.role,
      targetEntity: 'User',
      targetId: id,
      details: {
        username: user.username,
        name: user.name,
        previousRole,
        newRole: user.role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Role for @${user.username} updated to ${user.role.toUpperCase()}.`,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          active: user.active,
          updatedAt: user.updatedAt?.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[UPDATE_USER_ROLE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update staff role' },
      { status: 500 }
    );
  }
}
