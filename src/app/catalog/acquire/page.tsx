import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import AppShell from '@/components/layout/AppShell';
import BookAcquireClient from './BookAcquireClient';

export const dynamic = 'force-dynamic';

export default async function AcquireBookPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/catalog/acquire');
  }

  // Only admin, librarian, ict can acquire books
  const allowedRoles = ['admin', 'librarian', 'ict'];
  if (!allowedRoles.includes(user.role)) {
    redirect('/catalog');
  }

  return (
    <AppShell user={user}>
      <BookAcquireClient user={user} />
    </AppShell>
  );
}
