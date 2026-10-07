import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { listTasks, createTask } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/tasks
 * Lists operational tasks for staff.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const tasks = await listTasks({
      status,
      limit,
      currentUserUsername: user.username,
      currentUserRole: user.role,
    });
    return NextResponse.json({ success: true, tasks }, { status: 200 });
  } catch (error) {
    console.error('[GET_TASKS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tasks
 * Creates a new operational task assigned to a staff member or self.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { canCreateTask, canAssignTaskTo, isLeadershipRole } = await import('@/lib/auth/rbac');
    const { User } = await import('@/models/User');

    if (!canCreateTask(user.role)) {
      return NextResponse.json(
        { success: false, error: 'You do not have privileges to create operational tasks.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.title || !body.assignedToUsername) {
      return NextResponse.json(
        { success: false, error: 'Fields "title" and "assignedToUsername" are required.' },
        { status: 400 }
      );
    }

    const targetUsername = String(body.assignedToUsername).trim();
    const isSelf = targetUsername.toLowerCase() === user.username.toLowerCase();
    const isLeadership = isLeadershipRole(user.role);

    // Non-leadership staff can ONLY assign tasks to themselves
    if (!isLeadership && !isSelf) {
      return NextResponse.json(
        { success: false, error: 'Your role can only create private self-assigned tasks.' },
        { status: 403 }
      );
    }

    // Verify task assignment hierarchy for delegation
    if (targetUsername === 'group:all') {
      if (!isLeadership) {
        return NextResponse.json(
          { success: false, error: 'Only leadership can broadcast tasks to all team members.' },
          { status: 403 }
        );
      }
    } else if (targetUsername.startsWith('group:')) {
      const targetGroupRole = targetUsername.replace('group:', '');
      if (!canAssignTaskTo(user.role, targetGroupRole, user.username, targetUsername)) {
        return NextResponse.json(
          { success: false, error: `Your role (${user.role}) cannot assign tasks to the ${targetGroupRole} group.` },
          { status: 403 }
        );
      }
    } else if (!isSelf) {
      const targetUserDoc = await User.findOne({ username: targetUsername.toLowerCase() }, 'role name').lean();
      if (targetUserDoc && !canAssignTaskTo(user.role, targetUserDoc.role, user.username, targetUsername)) {
        return NextResponse.json(
          {
            success: false,
            error: `Your role (${user.role}) is not authorized to assign tasks to ${targetUsername} (${targetUserDoc.role}).`,
          },
          { status: 403 }
        );
      }
    }

    const priority = body.priority === 'high' || body.priority === 'low' ? body.priority : 'medium';
    const dueDate = body.dueDate ? new Date(body.dueDate) : undefined;

    const task = await createTask({
      title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : undefined,
      dueDate,
      priority,
      assignedToUsername: targetUsername,
      assignedToName: body.assignedToName ? String(body.assignedToName).trim() : targetUsername,
      staffUsername: user.username,
      staffName: user.name || user.username,
      staffRole: user.role,
    });

    return NextResponse.json(
      { success: true, message: 'Operational task created successfully.', task },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CREATE_TASK_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}
