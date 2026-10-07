import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listTasks } from '@/lib/admin/service';
import type { ITaskItemDTO } from '@/lib/admin/types';
import TasksWorkspaceClient from './TasksWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function TasksWorkspacePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/dashboard/tasks');
  }

  let initialTasks: ITaskItemDTO[] = [];
  try {
    initialTasks = await listTasks({
      limit: 100,
      currentUserUsername: user.username,
      currentUserRole: user.role,
    });
  } catch (err) {
    console.error('[TASKS_WORKSPACE_INITIAL_FETCH_ERROR]', err);
    initialTasks = [];
  }

  return (
    <TasksWorkspaceClient
      user={user}
      initialTasks={JSON.parse(JSON.stringify(initialTasks))}
    />
  );
}
