import React from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { canPublishArticles } from '@/lib/auth/rbac';
import { getArticleById } from '@/lib/transcomm/service';
import ArticleFormClient from '../ArticleFormClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return { title: 'Article Not Found | Transcomm' };
  }

  return {
    title: `Edit: ${article.title} | Transcomm Editorial Studio`,
  };
}

export const dynamic = 'force-dynamic';

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    redirect(`/auth/login?redirect=/transcomm/manage/${id}`);
  }

  if (!canPublishArticles(user.role)) {
    redirect('/transcomm');
  }

  const article = await getArticleById(id);
  if (!article) {
    notFound();
  }

  return (
    <ArticleFormClient
      user={user}
      mode="edit"
      initialArticle={article}
    />
  );
}
