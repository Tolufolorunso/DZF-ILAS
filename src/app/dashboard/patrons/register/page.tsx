import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { previewNextPatronBarcode } from '@/lib/patron/barcode';
import PatronRegisterClient from './PatronRegisterClient';

export const metadata = {
  title: 'Register Patron | DZF-ILAS',
  description: 'Enroll new library patron with live webcam photo capture, barcode assignment, and thermal label printing.',
};

export const dynamic = 'force-dynamic';

export default async function PatronRegisterPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/dashboard/patrons/register');
  }

  let nextBarcode = '20260584';

  try {
    await connectDB();
    const preview = await previewNextPatronBarcode();
    if (preview && preview.barcode) {
      nextBarcode = preview.barcode;
    }
  } catch (err) {
    console.error('Failed to load registration dependencies:', err);
  }

  return (
    <PatronRegisterClient
      user={user}
      initialNextBarcode={nextBarcode}
    />
  );
}
