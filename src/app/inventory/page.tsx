import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import { Inventory, IInventory } from '@/models/Inventory';
import { getSessionUser } from '@/lib/auth/session';
import AppShell from '@/components/layout/AppShell';
import InventoryClient from './InventoryClient';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?from=/inventory');
  }

  await connectDB();

  const totalCount = await Inventory.countDocuments();
  const rawItems = await Inventory.find()
    .sort({ createdAt: -1, _id: -1 })
    .limit(20)
    .lean();

  const initialItems = JSON.parse(JSON.stringify(rawItems)) as IInventory[];

  return (
    <AppShell user={user}>
      <InventoryClient
        initialItems={initialItems}
        initialTotal={totalCount}
        user={user}
      />
    </AppShell>
  );
}
