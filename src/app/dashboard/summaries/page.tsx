import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getSummaryStats } from '@/lib/summaries/service';
import SummaryClient from './SummaryClient';

export const dynamic = 'force-dynamic';

export default async function SummariesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/summaries');
  }

  const initialStats = await getSummaryStats();

  return (
    <SummaryClient
      user={user}
      initialStats={initialStats}
    />
  );
}
