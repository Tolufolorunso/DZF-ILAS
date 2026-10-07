import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listEvents } from '@/lib/admin/service';
import { IEventItemDTO } from '@/lib/admin/types';
import CalendarWorkspaceClient from './CalendarWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function CalendarWorkspacePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/dashboard/calendar');
  }

  const currentYear = new Date().getFullYear();
  let initialEvents: IEventItemDTO[] = [];
  try {
    initialEvents = await listEvents({ academicYear: currentYear, limit: 100 });
  } catch (err) {
    console.error('[CALENDAR_WORKSPACE_INITIAL_FETCH_ERROR]', err);
    initialEvents = [];
  }

  return (
    <CalendarWorkspaceClient
      user={user}
      initialEvents={JSON.parse(JSON.stringify(initialEvents))}
    />
  );
}
