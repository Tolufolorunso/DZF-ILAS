import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getArticleBySlug } from '@/lib/transcomm/service';
import ArticleReaderClient from './ArticleReaderClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await getArticleBySlug(slug, false);

  if (!article) {
    return {
      title: 'Article Not Found | Transcomm Knowledge Hub',
    };
  }

  return {
    title: `${article.title} | Transcomm Knowledge Hub`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.createdAt,
      authors: [article.author],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSessionUser();
  const { article, related } = await getArticleBySlug(slug, true);

  if (!article) {
    notFound();
  }

  return (
    <ArticleReaderClient
      user={user}
      article={article}
      relatedArticles={related}
    />
  );
}
