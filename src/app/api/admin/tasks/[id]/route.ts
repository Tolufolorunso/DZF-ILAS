import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { updateTaskStatus } from '@/lib/admin/service';
import { Task } from '@/models/Task';
import { connectDB } from '@/lib/db';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/tasks/[id]
 * Updates operational task status.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ success: false, error: 'Payload is required.' }, { status: 400 });
    }

    const { updateTaskStatus, updateTaskDetails } = await import('@/lib/admin/service');

    let updated;
    if (body.title !== undefined || body.description !== undefined || body.priority !== undefined || body.assignedToUsername !== undefined) {
      // Full details update
      updated = await updateTaskDetails({
        id,
        title: body.title,
        description: body.description,
        priority: body.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : body.dueDate === null ? null : undefined,
        status: body.status,
        assignedToUsername: body.assignedToUsername,
        assignedToName: body.assignedToName,
        staffUsername: user.username,
        staffRole: user.role,
      });
    } else if (body.status) {
      // Quick status transition (e.g. Kanban drag and drop)
      const validStatuses = ['todo', 'inProgress', 'completed', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid task status. Valid: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      updated = await updateTaskStatus({
        id,
        status: body.status,
        staffUsername: user.username,
        staffRole: user.role,
      });
    } else {
      return NextResponse.json({ success: false, error: 'No valid update fields provided.' }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, message: 'Task updated successfully.', task: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('[UPDATE_TASK_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tasks/[id]
 * Removes an operational task. Restricted to staff with task creation privileges (IMA, Country Manager, Admin).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    const { canCreateTask } = await import('@/lib/auth/rbac');

    if (!user || !canCreateTask(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Higher administrative privileges required to delete tasks.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    await logAuditEvent({
      action: 'TASK_DELETED',
      performedBy: user.username,
      performedByRole: user.role,
      targetEntity: 'Task',
      targetId: id,
      details: { title: task.title },
    });

    return NextResponse.json(
      { success: true, message: 'Operational task deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE_TASK_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete task' },
      { status: 500 }
    );
  }
}
