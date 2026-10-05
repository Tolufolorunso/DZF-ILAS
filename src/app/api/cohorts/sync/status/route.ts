import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { checkGoogleSheetsConnection } from '@/lib/cohorts/googleSheets';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cohorts/sync/status
 * Returns Google Sheets service account connectivity status and spreadsheet metadata
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const status = await checkGoogleSheetsConnection();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
