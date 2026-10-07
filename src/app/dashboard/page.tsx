import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Staff Dashboard | DZF-ILAS',
  description: 'Dzuels Integrated Library & Administrative System central workspace',
};

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/dashboard');
  }

  return <DashboardClient user={user} />;
}
