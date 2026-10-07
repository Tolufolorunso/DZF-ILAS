import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectDB } from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { canAssignTaskTo, canCreateTask } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/assignees
 * Returns list of active staff members and role groups that the current user is permitted to assign tasks to.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    if (!canCreateTask(sessionUser.role)) {
      return NextResponse.json(
        { success: false, error: 'You do not have privileges to assign operational tasks.' },
        { status: 403 }
      );
    }

    await connectDB();
    const users = await User.find({ active: true }, 'name username role')
      .sort({ name: 1 })
      .lean();

    // Filter staff members based on task assignment hierarchy
    const permittedAssignees = users
      .filter((u) => canAssignTaskTo(sessionUser.role, u.role))
      .map((u) => ({
        username: u.username,
        name: u.name,
        role: u.role,
        isGroup: false,
      }));

    // Generate permissible role group targets
    const candidateGroupRoles: { role: UserRole; label: string }[] = [
      { role: 'librarian', label: 'All Librarians' },
      { role: 'ict', label: 'All ICT Staff' },
      { role: 'asst_admin', label: 'All Assistant Admins' },
      { role: 'cohort_lead', label: 'All Cohort Leads' },
      { role: 'intern', label: 'All Interns' },
    ];

    const permittedGroups = candidateGroupRoles
      .filter((g) => canAssignTaskTo(sessionUser.role, g.role))
      .map((g) => ({
        username: `group:${g.role}`,
        name: `${g.label} (Group)`,
        role: g.role,
        isGroup: true,
      }));

    return NextResponse.json(
      {
        success: true,
        assignees: permittedAssignees,
        groups: permittedGroups,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET_ASSIGNEES_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve assignees' },
      { status: 500 }
    );
  }
}
