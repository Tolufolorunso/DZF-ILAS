import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { canPublishArticles } from '@/lib/auth/rbac';
import { listArticles } from '@/lib/transcomm/service';
import TranscommManageClient from './TranscommManageClient';

export const metadata: Metadata = {
  title: 'Editorial Management Studio | Transcomm Values',
  description:
    'Staff editorial publishing studio for DRNICER values, leadership articles, and editorial management.',
};

export const dynamic = 'force-dynamic';

export default async function TranscommManagePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/transcomm/manage');
  }

  if (!canPublishArticles(user.role)) {
    redirect('/transcomm');
  }

  const initialArticles = await listArticles({ status: 'all', limit: 100 });

  return (
    <TranscommManageClient
      user={user}
      initialArticles={initialArticles.items}
    />
  );
}
