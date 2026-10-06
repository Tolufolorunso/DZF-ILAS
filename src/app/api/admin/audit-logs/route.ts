import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { queryAuditLogs } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit-logs
 * Retrieves paginated system audit ledger entries.
 * Restricted to administrator roles.
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

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || undefined;
    const performedBy = searchParams.get('performedBy') || undefined;
    const targetEntity = searchParams.get('targetEntity') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const result = await queryAuditLogs({
      action,
      performedBy,
      targetEntity,
      page,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET_AUDIT_LOGS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve audit logs' },
      { status: 500 }
    );
  }
}
