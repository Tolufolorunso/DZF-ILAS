import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { listCertificates } from '@/lib/certificates/service';
import CertificateStudioClient from './CertificateStudioClient';

export const metadata: Metadata = {
  title: 'Certificate Studio & Vector Pipeline | Dzuels Educational Foundation',
  description:
    'Design, issue, batch-generate, and export landscape A4 vector certificates for cohorts, reading competitions, and library merit.',
};

export const dynamic = 'force-dynamic';

export default async function CertificateStudioPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/certificates');
  }

  const initialCertificates = await listCertificates({ limit: 25 });

  return (
    <CertificateStudioClient
      user={user}
      initialCertificates={initialCertificates}
    />
  );
}
