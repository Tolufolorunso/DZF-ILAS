import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canActivateStaff } from '@/lib/auth/rbac';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/users/[id]/deactivate
 * Deactivates a staff account.
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

    await connectDB();
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Staff user not found' }, { status: 404 });
    }

    // Prevent self-deactivation
    if (user.username === sessionUser.username.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'You cannot deactivate your own active administrative account.' },
        { status: 400 }
      );
    }

    user.active = false;
    await user.save();

    await logAuditEvent({
      action: 'STAFF_ACCOUNT_DEACTIVATED',
      performedBy: sessionUser.username,
      performedByRole: sessionUser.role,
      targetEntity: 'User',
      targetId: id,
      details: {
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Staff account @${user.username} has been deactivated.`,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          active: false,
          updatedAt: user.updatedAt?.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DEACTIVATE_USER_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to deactivate staff account' },
      { status: 500 }
    );
  }
}
