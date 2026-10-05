import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getCirculationStats } from '@/lib/circulation/loan';
import CirculationClient from './CirculationClient';

export const dynamic = 'force-dynamic';

export default async function CirculationsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/circulations');
  }

  const initialStats = await getCirculationStats();

  return (
    <CirculationClient
      user={user}
      initialStats={initialStats}
    />
  );
}
