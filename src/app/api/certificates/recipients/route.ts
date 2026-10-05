import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { loadEligibleRecipients } from '@/lib/certificates/service';

/**
 * GET /api/certificates/recipients
 * Query eligible recipients from cohorts or reading competitions for studio preview.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sourceType = (searchParams.get('sourceType') || 'cohort') as
      | 'cohort'
      | 'competition';
    const key = searchParams.get('key') || undefined;

    const list = await loadEligibleRecipients(sourceType, key);

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
