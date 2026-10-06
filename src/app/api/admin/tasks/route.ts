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

    const tasks = await listTasks({ status, limit });
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
 * Creates a new operational task assigned to a staff member.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.title || !body.assignedToUsername) {
      return NextResponse.json(
        { success: false, error: 'Fields "title" and "assignedToUsername" are required.' },
        { status: 400 }
      );
    }

    const priority = body.priority === 'high' || body.priority === 'low' ? body.priority : 'medium';
    const dueDate = body.dueDate ? new Date(body.dueDate) : undefined;

    const task = await createTask({
      title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : undefined,
      dueDate,
      priority,
      assignedToUsername: String(body.assignedToUsername).trim(),
      assignedToName: body.assignedToName ? String(body.assignedToName).trim() : String(body.assignedToUsername).trim(),
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
