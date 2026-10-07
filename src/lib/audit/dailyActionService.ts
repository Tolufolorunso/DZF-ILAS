import { connectDB } from '@/lib/db';
import { DailyAction } from '@/models/DailyAction';
import { Attendance } from '@/models/Attendance';
import { Library } from '@/models/Library';
import { Cataloging } from '@/models/Cataloging';
import { Patron } from '@/models/Patron';
import { Task } from '@/models/Task';
import { Competition } from '@/models/Competition';
import type {
  IDailyActionDTO,
  RecordDailyActionParams,
  DailyActionsQueryOptions,
  DailyActionUndoResult,
} from './types';

/**
 * Get current date string in West Africa Time (WAT, UTC+1 / Nigeria).
 * Format: YYYY-MM-DD
 */
export function getCurrentNigeriaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Determine if the 12:00 AM midnight cutoff has expired for an action.
 * Any action performed on a prior calendar date cannot be undone.
 */
export function isActionCutoffExpired(actionDayTimestamp: string, currentDate: Date = new Date()): boolean {
  const currentDay = getCurrentNigeriaDateString(currentDate);
  return actionDayTimestamp !== currentDay;
}

/**
 * Non-blocking, safe audit logger for staff actions across DZF-ILAS.
 * Errors in recording will be logged to console without failing user business transactions.
 */
export async function recordDailyAction(params: RecordDailyActionParams): Promise<void> {
  try {
    await connectDB();
    const dayTimestamp = getCurrentNigeriaDateString();

    await DailyAction.create({
      actionType: params.actionType,
      actionTitle: params.actionTitle,
      performedBy: params.performedBy,
      performedByName: params.performedByName,
      performedByRole: params.performedByRole,
      targetEntity: params.targetEntity,
      targetId: String(params.targetId),
      reversiblePayload: params.reversiblePayload || {},
      isReversible: params.isReversible !== undefined ? params.isReversible : true,
      dayTimestamp,
    });
  } catch (err) {
    // Non-blocking: never fail user operations due to logging
    console.error('[DailyAction] Failed to record daily action:', err);
  }
}

/**
 * Query daily actions with role-scoped concealment and date filtering.
 */
export async function listDailyActions(
  options: DailyActionsQueryOptions
): Promise<{ actions: IDailyActionDTO[]; total: number; targetDate: string }> {
  await connectDB();

  const targetDate = options.date || getCurrentNigeriaDateString();
  const query: Record<string, unknown> = {
    dayTimestamp: targetDate,
  };

  // Enforce leadership confidentiality
  // Admin & Asst Admin cannot view actions performed by IMA or Country Manager
  if (options.currentUserRole === 'admin' || options.currentUserRole === 'asst_admin') {
    query.performedByRole = { $nin: ['ima', 'country_manager'] };
  } else if (options.currentUserRole === 'country_manager') {
    // Country Manager views actions by everyone except IMA's private leadership actions
    query.performedByRole = { $nin: ['ima'] };
  }
  // IMA views all actions without concealment filter

  if (options.staff) {
    query.performedBy = options.staff;
  }

  if (options.actionType && options.actionType !== 'all') {
    query.actionType = options.actionType;
  }

  const limit = options.limit || 100;
  const skip = options.skip || 0;

  const [docs, total] = await Promise.all([
    DailyAction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DailyAction.countDocuments(query),
  ]);

  const actions: IDailyActionDTO[] = docs.map((doc) => ({
    id: doc._id.toString(),
    actionType: doc.actionType,
    actionTitle: doc.actionTitle,
    performedBy: doc.performedBy,
    performedByName: doc.performedByName,
    performedByRole: doc.performedByRole,
    targetEntity: doc.targetEntity,
    targetId: doc.targetId,
    isReversible: doc.isReversible,
    isUndone: doc.isUndone,
    undoneAt: doc.undoneAt ? doc.undoneAt.toISOString() : undefined,
    undoneBy: doc.undoneBy,
    dayTimestamp: doc.dayTimestamp,
    createdAt: doc.createdAt.toISOString(),
    isCutoffExpired: isActionCutoffExpired(doc.dayTimestamp),
  }));

  return {
    actions,
    total,
    targetDate,
  };
}

/**
 * Execute same-day reversible undo for a recorded staff action.
 */
export async function undoDailyAction(
  actionId: string,
  currentUser: { username: string; role: string; name: string }
): Promise<DailyActionUndoResult> {
  await connectDB();

  const action = await DailyAction.findById(actionId);
  if (!action) {
    throw new Error('Daily action record not found');
  }

  if (action.isUndone) {
    throw new Error('This action has already been undone.');
  }

  if (!action.isReversible) {
    throw new Error('This action type does not support automated reversal.');
  }

  // Guard: Administrators cannot undo leadership actions (IMA or Country Manager)
  if (
    (currentUser.role === 'admin' || currentUser.role === 'asst_admin') &&
    (action.performedByRole === 'ima' || action.performedByRole === 'country_manager')
  ) {
    throw new Error('Unauthorized: Administrators cannot undo leadership actions performed by IMA or Country Manager.');
  }

  // Guard: Same-day midnight cutoff
  if (isActionCutoffExpired(action.dayTimestamp)) {
    throw new Error('Undo window closed at 12:00 AM midnight for this action. Historical actions cannot be reversed.');
  }

  const payload = (action.reversiblePayload || {}) as Record<string, any>;

  // Execute entity-specific reversal
  switch (action.actionType) {
    case 'attendance_scan': {
      const attendanceId = payload.attendanceId || action.targetId;
      await Attendance.findByIdAndDelete(attendanceId);

      // Deduct awarded points if any
      if (payload.pointsAwarded && payload.patronId) {
        await Patron.findByIdAndUpdate(payload.patronId, {
          $inc: { points: -Math.abs(payload.pointsAwarded) },
        });
      }
      break;
    }

    case 'book_checkout': {
      const loanId = payload.loanId || action.targetId;
      await Library.findByIdAndDelete(loanId);

      if (payload.bookBarcode) {
        await Cataloging.findOneAndUpdate(
          { barcode: payload.bookBarcode },
          { status: 'available', lastBorrowedBy: null }
        );
      }
      break;
    }

    case 'book_return': {
      let loanDoc = payload.loanId ? await Library.findById(payload.loanId) : null;
      if (!loanDoc && payload.bookBarcode) {
        loanDoc = await Library.findOne({
          bookBarcode: payload.bookBarcode,
          status: 'returned',
        }).sort({ returnDate: -1, updatedAt: -1 });
      }

      if (loanDoc) {
        loanDoc.status = payload.previousStatus || 'issued';
        loanDoc.returnDate = undefined;
        await loanDoc.save();
      }

      if (payload.bookBarcode) {
        await Cataloging.findOneAndUpdate(
          { barcode: payload.bookBarcode },
          {
            status: 'borrowed',
            lastBorrowedBy: {
              patronBarcode: payload.patronBarcode,
              patronName: payload.patronName,
              dueDate: payload.dueDate ? new Date(payload.dueDate) : (loanDoc?.dueDate || undefined),
            },
          }
        );
      }

      // Revert return points if points were credited
      if (payload.pointsAwarded && payload.patronBarcode) {
        await Patron.findOneAndUpdate(
          { barcode: payload.patronBarcode },
          { $inc: { points: -Math.abs(payload.pointsAwarded) } }
        );
      }
      break;
    }

    case 'book_create': {
      const bookId = payload.bookId || action.targetId;
      await Cataloging.findByIdAndDelete(bookId);
      break;
    }

    case 'book_update': {
      const bookId = payload.bookId || action.targetId;
      if (payload.previousState) {
        await Cataloging.findByIdAndUpdate(bookId, payload.previousState);
      }
      break;
    }

    case 'book_delete': {
      if (payload.deletedBook) {
        // Re-create the deleted book document
        const { _id, ...bookData } = payload.deletedBook;
        await Cataloging.create(bookData);
      }
      break;
    }

    case 'patron_create': {
      const patronId = payload.patronId || action.targetId;
      await Patron.findByIdAndDelete(patronId);
      break;
    }

    case 'patron_update': {
      const patronId = payload.patronId || action.targetId;
      if (payload.previousState) {
        await Patron.findByIdAndUpdate(patronId, payload.previousState);
      }
      break;
    }

    case 'patron_delete': {
      if (payload.deletedPatron) {
        // Re-create the deleted patron document
        const { _id, ...patronData } = payload.deletedPatron;
        await Patron.create(patronData);
      }
      break;
    }

    case 'task_create': {
      const taskId = payload.taskId || action.targetId;
      await Task.findByIdAndDelete(taskId);
      break;
    }

    case 'task_status_change': {
      const taskId = payload.taskId || action.targetId;
      if (payload.previousStatus) {
        await Task.findByIdAndUpdate(taskId, { status: payload.previousStatus });
      }
      break;
    }

    case 'competition_entry': {
      const entryId = payload.entryId || action.targetId;
      await Competition.findByIdAndDelete(entryId);

      if (payload.pointsAwarded && payload.patronId) {
        await Patron.findByIdAndUpdate(payload.patronId, {
          $inc: { points: -Math.abs(payload.pointsAwarded) },
        });
      }
      break;
    }

    default:
      throw new Error(`Undo handler for action type '${action.actionType}' is not implemented.`);
  }

  // Update action state
  action.isUndone = true;
  action.undoneAt = new Date();
  action.undoneBy = currentUser.username;
  await action.save();

  return {
    success: true,
    message: `Action "${action.actionTitle}" was successfully undone. Target ${action.targetEntity} state has been reverted.`,
    actionId: action._id.toString(),
    actionType: action.actionType,
    targetEntity: action.targetEntity,
    targetId: action.targetId,
  };
}
