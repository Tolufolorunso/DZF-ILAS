import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { canManageCatalog } from '@/lib/auth/rbac';
import BookAcquireClient from './BookAcquireClient';

export const dynamic = 'force-dynamic';

export default async function AcquireBookPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/dashboard/catalog/acquire');
  }

  // Only authorized staff can acquire books
  if (!canManageCatalog(user.role)) {
    redirect('/dashboard/catalog');
  }

  return <BookAcquireClient user={user} />;
}
