import React from 'react';
import { Metadata } from 'next';
import { getCompetitionResults } from '@/lib/competitions/service';
import { ResultClient } from './ResultClient';

export const metadata: Metadata = {
  title: 'Live Reading Competition Results | Dzuels Educational Foundation',
  description:
    'Live scoreboard and category leaderboard for Dzuels Foundation annual reading competitions across Senior Secondary, Junior Secondary, and Primary schools.',
};

export const dynamic = 'force-dynamic';

export default async function ReadingCompetitionResultPage() {
  const initialData = await getCompetitionResults(undefined, 'ALL');

  return <ResultClient initialData={initialData} />;
}
