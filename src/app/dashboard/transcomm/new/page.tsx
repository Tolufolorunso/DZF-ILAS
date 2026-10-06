import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { canPublishArticles } from '@/lib/auth/rbac';
import ArticleFormClient from '../ArticleFormClient';

export const metadata: Metadata = {
  title: 'Author New Article | Transcomm Editorial Studio',
  description: 'Author and publish a new DRNICER values or leadership article.',
};

export const dynamic = 'force-dynamic';

export default async function NewArticlePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/dashboard/transcomm/new');
  }

  if (!canPublishArticles(user.role)) {
    redirect('/transcomm');
  }

  return <ArticleFormClient user={user} mode="create" />;
}
