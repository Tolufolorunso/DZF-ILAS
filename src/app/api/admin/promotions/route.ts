import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  simulateAcademicPromotion,
  executeAcademicPromotion,
  checkAnnualPromotionStatus,
} from '@/lib/patron/promotion';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/promotions
 * Retrieves annual promotion status and dry-run preview simulation.
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

    const allowedRoles = ['admin', 'ima', 'country_manager'];
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrative privileges required.' },
        { status: 403 }
      );
    }

    const [status, simulation] = await Promise.all([
      checkAnnualPromotionStatus(),
      simulateAcademicPromotion(),
    ]);

    return NextResponse.json(
      {
        success: true,
        status,
        simulation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/admin/promotions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching promotion preview.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promotions
 * Executes the annual student class promotions.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // Only Admin can execute promotion
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Only Super Administrator can execute academic promotions.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (body.dryRun) {
      const simulation = await simulateAcademicPromotion();
      return NextResponse.json({ success: true, simulation }, { status: 200 });
    }

    const result = await executeAcademicPromotion(auth.username, auth.role);

    return NextResponse.json(
      {
        success: true,
        message: `Academic class promotions executed successfully. ${result.promotedCount} students promoted, ${result.graduatedCount} graduated out-of-school.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/admin/promotions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while executing academic promotions.' },
      { status: 500 }
    );
  }
}
