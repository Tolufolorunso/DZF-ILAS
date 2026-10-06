import React from 'react';
import { Metadata } from 'next';
import { getSessionUser } from '@/lib/auth/session';
import { listArticles } from '@/lib/transcomm/service';
import KnowledgeHubClient from './KnowledgeHubClient';

export const metadata: Metadata = {
  title: 'Transcomm Knowledge Hub | Dzuels Educational Foundation',
  description:
    'DRNICER leadership values, character building, academic rigor, and inspirational monographs for the DZF community.',
};

export const dynamic = 'force-dynamic';

export default async function TranscommPage() {
  const user = await getSessionUser();
  const initialData = await listArticles({ limit: 18, sort: 'newest' });

  return (
    <KnowledgeHubClient
      user={user}
      initialArticles={initialData.items}
      initialPagination={initialData.pagination}
    />
  );
}
