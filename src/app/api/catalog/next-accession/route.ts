import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getNextControlNumber, generateDefaultBookBarcode } from '@/lib/catalog/accession';

/**
 * GET /api/catalog/next-accession?classification=800&year=2026
 * Preview the next control number and suggested barcode for a given Dewey class
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid session or Bearer token.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classification = searchParams.get('classification')?.trim() || '800';
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const nextControlNumber = await getNextControlNumber(classification);
    const suggestedBarcode = generateDefaultBookBarcode(classification, nextControlNumber, year);

    return NextResponse.json({
      success: true,
      classification,
      nextControlNumber,
      suggestedBarcode,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching next accession numbers:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to determine next accession sequence' },
      { status: 500 }
    );
  }
}
