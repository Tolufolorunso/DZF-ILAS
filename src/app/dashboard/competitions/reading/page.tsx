import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import {
  getActiveSession,
  getCompetitionResults,
  listCompetitionEntries,
} from '@/lib/competitions/service';
import { ReadingCompetitionDesk } from './ReadingCompetitionDesk';

export const metadata: Metadata = {
  title: 'Reading Competition Desk | Dzuels Educational Foundation',
  description:
    'Judge evaluation, competition book checkout/checkin, and session scoring desk.',
};

export const dynamic = 'force-dynamic';

export default async function ReadingCompetitionDeskPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/competitions/reading');
  }

  const [activeSession, initialResults, initialEntries] = await Promise.all([
    getActiveSession(),
    getCompetitionResults(undefined, 'ALL'),
    listCompetitionEntries({ limit: 25 }),
  ]);

  return (
    <ReadingCompetitionDesk
      user={user}
      activeSession={activeSession}
      initialResults={initialResults}
      initialEntries={initialEntries}
    />
  );
}
