import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { getSystemSettings } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings
 * Retrieves active system settings.
 * Restricted to admin and asst_admin staff.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const settings = await getSystemSettings();
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_GET_SETTINGS_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve system settings',
      },
      { status: 500 }
    );
  }
}
