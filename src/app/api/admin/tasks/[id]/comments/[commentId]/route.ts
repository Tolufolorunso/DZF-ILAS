import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { deleteTaskComment } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/tasks/[id]/comments/[commentId]
 * Deletes an operational note. Permitted for comment author or administrators (admin, ima, country_manager).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, commentId } = await params;
    const updatedTask = await deleteTaskComment({
      taskId: id,
      commentId,
      currentUsername: user.username,
      currentUserRole: user.role,
    });

    return NextResponse.json(
      { success: true, message: 'Note deleted successfully.', task: updatedTask },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE_TASK_COMMENT_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Failed to delete note';
    const status =
      message.includes('Unauthorized')
        ? 403
        : message === 'Task not found' || message === 'Comment not found'
        ? 404
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
