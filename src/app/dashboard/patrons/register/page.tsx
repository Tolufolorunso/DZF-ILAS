import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import { CohortGroup } from '@/models/CohortGroup';
import { getSessionUser } from '@/lib/auth/session';
import { previewNextPatronBarcode } from '@/lib/patron/barcode';
import AppShell from '@/components/layout/AppShell';
import PatronRegisterClient, { CohortGroupItem } from './PatronRegisterClient';

export const metadata = {
  title: 'Register Patron | DZF-ILLS',
  description: 'Enroll new library patron with live webcam photo capture, barcode assignment, and thermal label printing.',
};

export const dynamic = 'force-dynamic';

export default async function PatronRegisterPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/dashboard/patrons/register');
  }

  let nextBarcode = '20260584';
  let cohortGroups: CohortGroupItem[] = [];

  try {
    await connectDB();

    const [preview, groups] = await Promise.all([
      previewNextPatronBarcode(),
      CohortGroup.find({ active: true }).select('cohortType displayName').sort({ order: 1 }).lean(),
    ]);

    if (preview && preview.barcode) {
      nextBarcode = preview.barcode;
    }

    cohortGroups = (groups || []).map((g) => ({
      cohortType: g.cohortType,
      displayName: g.displayName || g.cohortType,
    }));
  } catch (err) {
    console.error('Failed to load registration dependencies:', err);
  }

  return (
    <AppShell user={user}>
      <PatronRegisterClient
        user={user}
        initialNextBarcode={nextBarcode}
        cohortGroups={cohortGroups}
      />
    </AppShell>
  );
}
