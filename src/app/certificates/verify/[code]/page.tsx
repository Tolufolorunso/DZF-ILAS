import React from 'react';
import { Metadata } from 'next';
import { verifyCertificate } from '@/lib/certificates/service';
import VerifyCertificateClient from './VerifyCertificateClient';

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { code } = await props.params;
  return {
    title: `Verify Certificate ${code} | Dzuels Educational Foundation`,
    description: `Official public verification for certificate serial code ${code}.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function VerifyCertificatePage(props: PageProps) {
  const { code } = await props.params;
  const result = await verifyCertificate(code);

  return <VerifyCertificateClient code={code} result={result} />;
}
