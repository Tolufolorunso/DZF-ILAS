import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { universalBarcodeLookup } from '@/lib/circulation/loan';

/**
 * GET /api/circulations/lookup?barcode=...
 * Auto-resolves a scanned barcode to either a patron passport card or catalog book card.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode')?.trim();

    if (!barcode) {
      return NextResponse.json(
        { success: false, error: 'Barcode query parameter is required.' },
        { status: 400 }
      );
    }

    const result = await universalBarcodeLookup(barcode);

    return NextResponse.json(
      {
        success: true,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/circulations/lookup:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during barcode lookup.' },
      { status: 500 }
    );
  }
}
