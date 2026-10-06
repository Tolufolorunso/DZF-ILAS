import * as React from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';

export const metadata = {
  title: 'Staff Dashboard | DZF-ILLS',
  description: 'Dzuels Integrated Library & Learning System central workspace',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/dashboard');
  }

  const formattedRole = user.role
    ? user.role
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Librarian';

  return (
    <AppShell
      user={user}
      staffName={user.name || user.username}
      staffRole={formattedRole}
    >
      {children}
    </AppShell>
  );
}
