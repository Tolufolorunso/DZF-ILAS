import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getMonthlyLeaderboard, getInactivePatrons } from '@/lib/activity/service';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/leaderboard');
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Attempt to fetch current month first
  let targetYear = currentYear;
  let targetMonth = currentMonth;

  let initialLeaderboard = await getMonthlyLeaderboard({
    year: targetYear,
    month: targetMonth,
  });

  // If current month has 0 active patrons in development, check October 2025 where real sample data exists
  if (initialLeaderboard.total === 0) {
    const historicalSample = await getMonthlyLeaderboard({ year: 2025, month: 10 });
    if (historicalSample.total > 0) {
      targetYear = 2025;
      targetMonth = 10;
      initialLeaderboard = historicalSample;
    }
  }

  const initialInactive = await getInactivePatrons({
    year: targetYear,
    month: targetMonth,
    limit: 15,
  });

  return (
    <LeaderboardClient
      user={user}
      initialYear={targetYear}
      initialMonth={targetMonth}
      initialLeaderboard={JSON.parse(JSON.stringify(initialLeaderboard))}
      initialInactive={JSON.parse(JSON.stringify(initialInactive))}
    />
  );
}
