import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Task } from '@/models/Task';
import { connectDB } from '@/lib/db';
import { logAuditEvent } from '@/lib/admin/service';
import { recordDailyAction } from '@/lib/audit/dailyActionService';
import { realtimeEventBus } from '@/lib/realtime/eventBus';

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
    const { isLeadershipRole } = await import('@/lib/auth/rbac');

    await connectDB();
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const isLeadership = isLeadershipRole(user.role);
    const assignedBy = (existingTask.assignedBy?.username || '').toLowerCase();
    const assignedTo = (existingTask.assignedTo?.username || '').toLowerCase();
    const currentUsername = user.username.toLowerCase();
    const isAuthor = assignedBy === currentUsername;
    const isAssignee = assignedTo === currentUsername;
    const isSelfTask = existingTask.isSelfAssigned || (assignedBy && assignedTo && assignedBy === assignedTo);
    const isConfidential = existingTask.isPrivate || isSelfTask;

    // Private / confidential tasks can only be updated by the owner or author (or leadership)
    if (isConfidential && !isAuthor && !isAssignee && !isLeadership) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. This is a private confidential task.' },
        { status: 403 }
      );
    }

    let updated;
    if (body.title !== undefined || body.description !== undefined || body.priority !== undefined || body.isPrivate !== undefined || body.assignedToUsername !== undefined) {
      // Full details update requires being author or leadership
      if (!isLeadership && !isAuthor) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. You can only edit tasks you created.' },
          { status: 403 }
        );
      }

      // STRICT CREATOR-ONLY ARCHIVE GUARD (Zero Exceptions)
      if (body.status === 'archived' && !isAuthor) {
        return NextResponse.json(
          {
            success: false,
            error: `Unauthorized. Only the task creator (@${existingTask.assignedBy?.username || 'creator'}) can archive this task.`,
          },
          { status: 403 }
        );
      }

      // STRICT CREATOR-ONLY RESTORE GUARD (Zero Exceptions)
      if (existingTask.status === 'archived' && body.status && body.status !== 'archived' && !isAuthor) {
        return NextResponse.json(
          {
            success: false,
            error: `Unauthorized. Only the task creator (@${existingTask.assignedBy?.username || 'creator'}) can restore this task from the archive.`,
          },
          { status: 403 }
        );
      }

      updated = await updateTaskDetails({
        id,
        title: body.title,
        description: body.description,
        priority: body.priority,
        isPrivate: body.isPrivate !== undefined ? Boolean(body.isPrivate) : undefined,
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

      // STRICT CREATOR-ONLY ARCHIVE GUARD (Zero Exceptions)
      if (body.status === 'archived' && !isAuthor) {
        return NextResponse.json(
          {
            success: false,
            error: `Unauthorized. Only the task creator (@${existingTask.assignedBy?.username || 'creator'}) can archive this task.`,
          },
          { status: 403 }
        );
      }

      // STRICT CREATOR-ONLY RESTORE GUARD (Zero Exceptions)
      if (existingTask.status === 'archived' && body.status !== 'archived' && !isAuthor) {
        return NextResponse.json(
          {
            success: false,
            error: `Unauthorized. Only the task creator (@${existingTask.assignedBy?.username || 'creator'}) can restore this task from the archive.`,
          },
          { status: 403 }
        );
      }

      // Active operational lane move (todo, inProgress, completed)
      // Permitted for assignee, author, or leadership
      if (!isAuthor && !isAssignee && !isLeadership) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. You can only move tasks assigned to you or created by you.' },
          { status: 403 }
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

    if (updated && existingTask.status !== updated.status) {
      await recordDailyAction({
        actionType: 'task_status_change',
        actionTitle: `Changed status of task "${existingTask.title}" from ${existingTask.status} to ${updated.status}`,
        performedBy: user.username,
        performedByName: user.name || user.username,
        performedByRole: user.role,
        targetEntity: 'Task',
        targetId: String(existingTask._id),
        reversiblePayload: {
          taskId: String(existingTask._id),
          previousStatus: existingTask.status,
        },
        isReversible: true,
      });
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
 * Removes an operational task. Strictly restricted to task creators with zero exceptions.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const isAuthor = task.assignedBy?.username?.toLowerCase() === user.username.toLowerCase();

    // STRICT CREATOR-ONLY DELETION GUARD (Zero Exceptions)
    if (!isAuthor) {
      return NextResponse.json(
        {
          success: false,
          error: `Unauthorized. Only the task creator (@${task.assignedBy?.username || 'creator'}) can delete this task.`,
        },
        { status: 403 }
      );
    }

    await Task.findByIdAndDelete(id);

    realtimeEventBus.dispatch({
      type: 'task:deleted',
      payload: { taskId: id },
    });

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
