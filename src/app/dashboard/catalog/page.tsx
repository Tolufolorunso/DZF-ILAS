import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import { Cataloging, ICataloging } from '@/models/Cataloging';
import { getSessionUser } from '@/lib/auth/session';
import CatalogListClient from './CatalogListClient';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/dashboard/catalog');
  }

  await connectDB();

  // Fetch initial page of catalog books
  const limit = 20;
  const totalCount = await Cataloging.countDocuments();
  const rawBooks = await Cataloging.find()
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  // Serialize MongoDB ObjectIds and Dates for Client Component
  const initialBooks = JSON.parse(JSON.stringify(rawBooks)) as ICataloging[];

  return (
    <CatalogListClient
      initialBooks={initialBooks}
      initialTotal={totalCount}
      user={user}
    />
  );
}
