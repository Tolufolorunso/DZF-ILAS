import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canActivateStaff, isAdmin } from '@/lib/auth/rbac';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id]
 * Retrieves details for a specific staff member.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || !isAdmin(sessionUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();
    const user = await User.findById(id).select('-password').lean();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Staff user not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
          updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET_USER_DETAILS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve staff details' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Permanently removes a staff account or rejects a pending registration.
 * Strictly restricted to Administrator roles (IMA, Country Manager, Admin).
 */
export async function DELETE(
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

    // Prevent self-deletion
    if (user.username === sessionUser.username.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own administrative account.' },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    await logAuditEvent({
      action: 'STAFF_ACCOUNT_DELETED',
      performedBy: sessionUser.username,
      performedByRole: sessionUser.role,
      targetEntity: 'User',
      targetId: id,
      details: {
        username: user.username,
        name: user.name,
        role: user.role,
        wasActive: user.active,
      },
    });

    return NextResponse.json(
      { success: true, message: `Staff account @${user.username} (${user.name}) deleted successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE_USER_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete staff account' },
      { status: 500 }
    );
  }
}
