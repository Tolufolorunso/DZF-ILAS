import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import {
  getAttendanceStats,
  getActiveSessions,
  getAttendanceLogs,
  normalizeClassDate,
} from '@/lib/attendance/service';
import AttendanceClient from './AttendanceClient';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/attendance');
  }

  const todayStr = normalizeClassDate().toISOString().split('T')[0];

  const [initialStats, initialSessions, initialLogs] = await Promise.all([
    getAttendanceStats(todayStr),
    getActiveSessions(),
    getAttendanceLogs({ date: todayStr, limit: 30 }),
  ]);

  return (
    <AttendanceClient
      user={user}
      initialStats={initialStats}
      initialSessions={initialSessions}
      initialLogs={JSON.parse(JSON.stringify(initialLogs.attendances || []))}
    />
  );
}
