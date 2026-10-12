import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/admin/service';
import { Cataloging } from '@/models/Cataloging';
import { Library } from '@/models/Library';

export const dynamic = 'force-dynamic';

export interface IReconcileResult {
  monographsAudited: number;
  activeLoansAudited: number;
  discrepanciesRepaired: number;
  overdueLoansCount: number;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * GET /api/admin/health/reconcile
 * Returns read-only discrepancy audit metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();
    const now = new Date();

    const activeLoans = await Library.find({
      status: { $in: ['borrowed', 'overdue'] },
    }).lean();

    const activeBookBarcodes = new Set(
      activeLoans.map((l) => l.bookBarcode).filter(Boolean) as string[]
    );

    const monographs = await Cataloging.find()
      .select('barcode isCheckedOut copiesTotal copiesAvailable')
      .lean();

    let overdueLoansCount = 0;
    for (const l of activeLoans) {
      if (l.dueDate && new Date(l.dueDate) < now) {
        overdueLoansCount++;
      }
    }

    let discrepancies = 0;
    for (const b of monographs) {
      const hasActiveLoan = activeBookBarcodes.has(b.barcode);
      if (hasActiveLoan && !b.isCheckedOut) {
        discrepancies++;
      } else if (!hasActiveLoan && b.isCheckedOut) {
        discrepancies++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        monographsAudited: monographs.length,
        activeLoansAudited: activeLoans.length,
        potentialDiscrepancies: discrepancies,
        overdueLoansCount,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('[HEALTH_RECONCILE_GET_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query reconciliation status',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/health/reconcile
 * Executes reconciliation across Cataloging monographs and Library active loans.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();
    const now = new Date();

    // 1. Audit active loans and recalculate overdue statuses
    const activeLoans = await Library.find({
      status: { $in: ['borrowed', 'overdue'] },
    });

    let overdueLoansCount = 0;
    for (const loan of activeLoans) {
      if (loan.dueDate && new Date(loan.dueDate) < now) {
        overdueLoansCount++;
        if (loan.status !== 'overdue') {
          loan.status = 'overdue';
          await loan.save();
        }
      }
    }

    const activeBookBarcodes = new Set(
      activeLoans.map((l) => l.bookBarcode).filter(Boolean) as string[]
    );

    // 2. Audit all monographs in Cataloging
    const monographs = await Cataloging.find();
    let discrepanciesRepaired = 0;

    for (const book of monographs) {
      const hasActiveLoan = activeBookBarcodes.has(book.barcode);
      let needsSave = false;

      // Case A: Book is loaned out according to Library, but Cataloging shows available
      if (hasActiveLoan && !book.isCheckedOut) {
        book.isCheckedOut = true;
        book.copiesAvailable = 0;
        needsSave = true;
        discrepanciesRepaired++;
      }
      // Case B: Book is marked isCheckedOut in Cataloging, but no active loan exists in Library
      else if (!hasActiveLoan && book.isCheckedOut) {
        book.isCheckedOut = false;
        book.copiesAvailable = book.copiesTotal ?? 1;
        needsSave = true;
        discrepanciesRepaired++;
      }

      if (needsSave) {
        await book.save();
      }
    }

    const result: IReconcileResult = {
      monographsAudited: monographs.length,
      activeLoansAudited: activeLoans.length,
      discrepanciesRepaired,
      overdueLoansCount,
      timestamp: now.toISOString(),
    };

    await logAuditEvent({
      action: 'DATA_HEALTH_RECONCILIATION_RUN',
      performedBy: user.username,
      performedByRole: user.role,
      targetEntity: 'Cataloging',
      targetId: 'all',
      details: result,
    });

    return NextResponse.json({
      success: true,
      message: `Reconciliation complete: audited ${monographs.length} monographs and ${activeLoans.length} loans; repaired ${discrepanciesRepaired} discrepancies.`,
      data: result,
    });
  } catch (error) {
    console.error('[HEALTH_RECONCILE_POST_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute data health reconciliation',
      },
      { status: 500 }
    );
  }
}
