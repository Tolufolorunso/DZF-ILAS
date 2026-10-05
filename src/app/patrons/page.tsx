import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import { Patron, IPatron } from '@/models/Patron';
import { getSessionUser } from '@/lib/auth/session';
import AppShell from '@/components/layout/AppShell';
import PatronListClient from './PatronListClient';

export const metadata = {
  title: 'Patron Directory | DZF-ILLS',
  description: 'Manage library patrons, live photo capture, and 60x40mm thermal roll barcode printing.',
};

export const dynamic = 'force-dynamic';

export default async function PatronsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/patrons');
  }

  let initialPatrons: IPatron[] = [];
  let initialTotal = 0;

  try {
    await connectDB();

    const [total, docs] = await Promise.all([
      Patron.countDocuments({ isDeleted: { $ne: true } }),
      Patron.find({ isDeleted: { $ne: true } })
        .sort({ registeredDate: -1, _id: -1 })
        .limit(10)
        .lean(),
    ]);

    initialTotal = total;
    initialPatrons = JSON.parse(JSON.stringify(docs));
  } catch (err) {
    console.error('Failed to load initial patrons for page:', err);
  }

  return (
    <AppShell user={user}>
      <PatronListClient
        initialPatrons={initialPatrons}
        initialTotal={initialTotal}
        user={user}
      />
    </AppShell>
  );
}
