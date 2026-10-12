import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { addTaskComment } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/tasks/[id]/comments
 * Appends a new chronological operational note to the task.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body || !body.text || typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Note text is required.' },
        { status: 400 }
      );
    }

    const updatedTask = await addTaskComment({
      taskId: id,
      commenter: {
        username: user.username,
        name: user.name || user.username,
        role: user.role,
      },
      text: body.text.trim(),
    });

    return NextResponse.json(
      { success: true, message: 'Note added successfully.', task: updatedTask },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ADD_TASK_COMMENT_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Failed to add note';
    const status =
      message.includes('Unauthorized')
        ? 403
        : message === 'Task not found'
        ? 404
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
