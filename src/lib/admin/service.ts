import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { recordDailyAction } from '@/lib/audit/dailyActionService';
import {
  SystemSetting,
  AuditLog,
  Cataloging,
  Patron,
  Library,
  Attendance,
  Cohort,
  TranscommArticle,
  User,
  Requisition,
  Task,
  Event,
  Notification,
  Competition,
  BookSummary,
} from '@/models';
import type { Gender, PatronType } from '@/models/Patron';
import type { LoanStatus } from '@/models/Library';
import type { ClassType } from '@/models/Attendance';
import type {
  ISystemStats,
  ISystemSettingsDTO,
  IPatronOverrideRequest,
  IRequisitionItemDTO,
  ITaskItemDTO,
  IEventItemDTO,
  IAuditLogItemDTO,
} from './types';

/**
 * Creates or retrieves the singleton SystemSetting document.
 */
export async function getSystemSettings(): Promise<ISystemSettingsDTO> {
  await connectDB();
  let setting = await SystemSetting.findById('default');
  if (!setting) {
    setting = await SystemSetting.create({
      _id: 'default',
      emergencyCirculationLock: false,
      circulationLockReason: '',
      lockedBy: '',
      overdueGraceDays: 0,
      allowMultipleLoansOverride: false,
      maintenanceMode: false,
      announcementBanner: '',
    });
  }

  return {
    emergencyCirculationLock: setting.emergencyCirculationLock,
    circulationLockReason: setting.circulationLockReason || '',
    lockedBy: setting.lockedBy || '',
    lockedAt: setting.lockedAt ? setting.lockedAt.toISOString() : null,
    overdueGraceDays: setting.overdueGraceDays || 0,
    allowMultipleLoansOverride: setting.allowMultipleLoansOverride || false,
    maintenanceMode: setting.maintenanceMode || false,
    announcementBanner: setting.announcementBanner || '',
    lastPromotionYear: setting.lastPromotionYear,
    lastPromotionDate: setting.lastPromotionDate ? setting.lastPromotionDate.toISOString() : null,
    updatedAt: setting.updatedAt.toISOString(),
  };
}

/**
 * Logs an administrative or critical security action into the AuditLog collection.
 */
export async function logAuditEvent(params: {
  action: string;
  performedBy: string;
  performedByRole: string;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await connectDB();
    await AuditLog.create({
      action: params.action,
      performedBy: params.performedBy,
      performedByRole: params.performedByRole,
      targetEntity: params.targetEntity,
      targetId: params.targetId || '',
      details: params.details || {},
      ipAddress: params.ipAddress || '',
    });
  } catch (error) {
    // Non-blocking log failure warning
    console.error('[AUDIT_LOG_ERROR]', error);
  }
}

/**
 * Toggles global emergency circulation lock.
 */
export async function toggleCirculationLock(params: {
  lock: boolean;
  reason?: string;
  staffUsername: string;
  staffRole: string;
}): Promise<ISystemSettingsDTO> {
  await connectDB();
  const setting = await SystemSetting.findByIdAndUpdate(
    'default',
    {
      emergencyCirculationLock: params.lock,
      circulationLockReason: params.reason || (params.lock ? 'Emergency circulation pause enabled.' : ''),
      lockedBy: params.lock ? params.staffUsername : '',
      lockedAt: params.lock ? new Date() : null,
      updatedBy: params.staffUsername,
    },
    { new: true, upsert: true }
  );

  await logAuditEvent({
    action: 'CIRCULATION_LOCK_TOGGLED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'SystemSetting',
    targetId: 'default',
    details: {
      emergencyCirculationLock: params.lock,
      reason: params.reason,
    },
  });

  return {
    emergencyCirculationLock: setting.emergencyCirculationLock,
    circulationLockReason: setting.circulationLockReason || '',
    lockedBy: setting.lockedBy || '',
    lockedAt: setting.lockedAt ? setting.lockedAt.toISOString() : null,
    overdueGraceDays: setting.overdueGraceDays || 0,
    allowMultipleLoansOverride: setting.allowMultipleLoansOverride || false,
    maintenanceMode: setting.maintenanceMode || false,
    announcementBanner: setting.announcementBanner || '',
    lastPromotionYear: setting.lastPromotionYear,
    lastPromotionDate: setting.lastPromotionDate ? setting.lastPromotionDate.toISOString() : null,
    updatedAt: setting.updatedAt.toISOString(),
  };
}

/**
 * Gathers live, real-time database counts across all core entities.
 */
export async function getSystemStats(): Promise<ISystemStats> {
  await connectDB();

  const [
    books,
    patrons,
    totalLoans,
    activeLoans,
    returnedLoans,
    overdueLoans,
    attendanceCount,
    cohortsCount,
    articlesCount,
    staffCount,
    pendingRequisitions,
    openTasks,
    upcomingEvents,
  ] = await Promise.all([
    Cataloging.countDocuments(),
    Patron.countDocuments({ isDeleted: { $ne: true } }),
    Library.countDocuments({ bookBarcode: { $exists: true } }),
    Library.countDocuments({ status: 'borrowed' }),
    Library.countDocuments({ status: 'returned' }),
    Library.countDocuments({ status: 'overdue' }),
    Attendance.countDocuments(),
    Cohort.countDocuments(),
    TranscommArticle.countDocuments(),
    User.countDocuments({ active: true }),
    Requisition.countDocuments({ status: 'pending' }),
    Task.countDocuments({ status: { $in: ['todo', 'inProgress'] } }),
    Event.countDocuments(),
  ]);

  return {
    books,
    patrons,
    totalLoans,
    activeLoans,
    returnedLoans,
    overdueLoans,
    attendanceCount,
    cohortsCount,
    articlesCount,
    staffCount,
    pendingRequisitions,
    openTasks,
    upcomingEvents,
  };
}

/**
 * Retrieves the 360-degree complete historical dataset for a patron across all foundation collections:
 * Patron profile, all circulation loans (active, overdue, returned), attendance history, competition entries,
 * book summaries/reviews, cohort memberships, and aggregated statistical telemetry.
 */
export async function getPatron360Data(queryInput: string): Promise<{
  patron: Record<string, unknown>;
  loans: Record<string, unknown>[];
  attendance: Record<string, unknown>[];
  competitions: Record<string, unknown>[];
  summaries: Record<string, unknown>[];
  cohorts: Record<string, unknown>[];
  stats: {
    totalLoansCount: number;
    activeLoansCount: number;
    overdueLoansCount: number;
    returnedLoansCount: number;
    attendanceCount: number;
    competitionsCount: number;
    summariesCount: number;
    points: number;
  };
}> {
  await connectDB();
  const clean = queryInput.trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(clean);

  let patronDoc = await Patron.findOne({
    $or: [
      { barcode: clean },
      { barcode: new RegExp(`^${clean}$`, 'i') },
      ...(isObjectId ? [{ _id: clean }] : []),
    ],
  }).lean();

  if (!patronDoc) {
    patronDoc = await Patron.findOne({
      $or: [
        { firstname: new RegExp(`^${clean}$`, 'i') },
        { surname: new RegExp(`^${clean}$`, 'i') },
        { phoneNumber: clean },
      ],
    }).lean();
  }

  if (!patronDoc) {
    throw new Error(`Patron with identifier "${clean}" was not found.`);
  }

  const barcode = patronDoc.barcode;

  const [loans, attendance, competitions, summaries, cohorts] = await Promise.all([
    Library.find({ patronBarcode: barcode }).sort({ checkoutDate: -1, createdAt: -1 }).lean(),
    Attendance.find({ patronBarcode: barcode }).sort({ classDate: -1, createdAt: -1 }).lean(),
    Competition.find({ patronBarcode: barcode }).sort({ createdAt: -1 }).lean(),
    BookSummary.find({ patronBarcode: barcode }).sort({ submissionDate: -1, createdAt: -1 }).lean(),
    Cohort.find({ barcode }).lean(),
  ]);

  const activeLoansCount = loans.filter((l) => l.status === 'borrowed').length;
  const overdueLoansCount = loans.filter((l) => l.status === 'overdue').length;
  const returnedLoansCount = loans.filter((l) => l.status === 'returned').length;

  return {
    patron: patronDoc as unknown as Record<string, unknown>,
    loans: loans as unknown as Record<string, unknown>[],
    attendance: attendance as unknown as Record<string, unknown>[],
    competitions: competitions as unknown as Record<string, unknown>[],
    summaries: summaries as unknown as Record<string, unknown>[],
    cohorts: cohorts as unknown as Record<string, unknown>[],
    stats: {
      totalLoansCount: loans.length,
      activeLoansCount,
      overdueLoansCount,
      returnedLoansCount,
      attendanceCount: attendance.length,
      competitionsCount: competitions.length,
      summariesCount: summaries.length,
      points: patronDoc.points || 0,
    },
  };
}

/**
 * Executes an administrative override on a patron's complete circulation, attendance, competition, or profile record.
 */
export async function executePatronOverride(params: {
  override: IPatronOverrideRequest;
  staffUsername: string;
  staffRole: string;
}): Promise<{
  success: boolean;
  message: string;
  patronBarcode: string;
  patron?: Record<string, unknown>;
  activeLoans?: Record<string, unknown>[];
  patron360?: Record<string, unknown>;
}> {
  await connectDB();
  const cleanInput = params.override.patronBarcode.trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(cleanInput);

  let patron = await Patron.findOne({
    $or: [
      { barcode: cleanInput },
      { barcode: new RegExp(`^${cleanInput}$`, 'i') },
      ...(isObjectId ? [{ _id: cleanInput }] : []),
    ],
  });

  if (!patron) {
    patron = await Patron.findOne({
      $or: [
        { firstname: new RegExp(`^${cleanInput}$`, 'i') },
        { surname: new RegExp(`^${cleanInput}$`, 'i') },
        { phoneNumber: cleanInput },
      ],
    });
  }

  if (!patron) {
    throw new Error(`Patron with identifier "${cleanInput}" was not found.`);
  }

  const cleanBarcode = patron.barcode;
  let actionMessage = '';

  if (params.override.action === 'clear_borrow_lock') {
    patron.hasBorrowedBook = false;
    patron.lastBorrowedItem = undefined;
    await patron.save();
    actionMessage = `Active borrow lock cleared for patron ${patron.firstname} ${patron.surname}.`;
  } else if (params.override.action === 'waive_overdues') {
    await Library.updateMany(
      { patronBarcode: cleanBarcode, status: 'overdue' },
      { status: 'returned', returnDate: new Date() }
    );
    patron.hasBorrowedBook = false;
    patron.lastBorrowedItem = undefined;
    await patron.save();
    actionMessage = `All overdues waived and closed for patron ${patron.firstname} ${patron.surname}.`;
  } else if (params.override.action === 'force_return') {
    const loanQuery: Record<string, unknown> = { patronBarcode: cleanBarcode, status: { $in: ['borrowed', 'overdue'] } };
    if (params.override.loanId && mongoose.Types.ObjectId.isValid(params.override.loanId)) {
      loanQuery._id = params.override.loanId;
    } else if (params.override.monographBarcode) {
      loanQuery.bookBarcode = params.override.monographBarcode.trim();
    }

    const targetLoan = await Library.findOne(loanQuery);
    if (targetLoan) {
      targetLoan.status = 'returned';
      targetLoan.returnDate = new Date();
      await targetLoan.save();

      if (targetLoan.bookBarcode) {
        const book = await Cataloging.findOne({ barcode: targetLoan.bookBarcode });
        if (book) {
          book.copiesAvailable = Math.min(book.copiesTotal || 1, (book.copiesAvailable || 0) + 1);
          if (book.copiesAvailable > 0) {
            book.isCheckedOut = false;
          }
          await book.save();
        }
      }
      actionMessage = `Loan for "${targetLoan.bookTitle || targetLoan.bookBarcode}" successfully force checked-in / returned.`;
    } else {
      actionMessage = `No active loan matched for force return. Resetting patron borrow status.`;
    }

    const remainingActive = await Library.countDocuments({
      patronBarcode: cleanBarcode,
      status: { $in: ['borrowed', 'overdue'] },
    });
    if (remainingActive === 0) {
      patron.hasBorrowedBook = false;
      patron.lastBorrowedItem = undefined;
      await patron.save();
    }
  } else if (params.override.action === 'force_checkout' || params.override.action === 'grant_loan_override') {
    if (!params.override.monographBarcode) {
      patron.hasBorrowedBook = false;
      await patron.save();
      actionMessage = `Executive loan override granted for patron ${patron.firstname} ${patron.surname}.`;
    } else {
      const monoBarcode = params.override.monographBarcode.trim();
      const book = await Cataloging.findOne({ barcode: monoBarcode });
      if (!book) {
        throw new Error(`Monograph with barcode "${monoBarcode}" not found.`);
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);

      await Library.create({
        patronId: patron._id,
        patronBarcode: patron.barcode,
        bookId: book._id,
        bookBarcode: book.barcode,
        bookTitle: book.title?.mainTitle || 'Unknown Monograph',
        issueDate: new Date(),
        dueDate,
        status: 'borrowed',
        renewalsCount: 0,
      });

      book.copiesAvailable = Math.max(0, (book.copiesAvailable || 1) - 1);
      if (book.copiesAvailable === 0) {
        book.isCheckedOut = true;
      }
      book.lastBorrowedBy = {
        patronId: patron._id,
        patronBarcode: patron.barcode,
        patronName: `${patron.firstname} ${patron.surname}`,
        checkedOutAt: new Date(),
        dueDate,
      };
      await book.save();

      patron.hasBorrowedBook = true;
      patron.lastBorrowedItem = {
        itemId: book._id,
        itemBarcode: book.barcode,
        itemTitle: book.title?.mainTitle,
        checkoutDate: new Date(),
        dueDate,
      };
      await patron.save();

      actionMessage = `Monograph "${book.title?.mainTitle || book.barcode}" force checked out to ${patron.firstname} ${patron.surname}.`;
    }
  } else if (params.override.action === 'toggle_active_status') {
    patron.active = !patron.active;
    await patron.save();
    actionMessage = `Patron status updated to ${patron.active ? 'ACTIVE' : 'INACTIVE'} for ${patron.firstname} ${patron.surname}.`;
  } else if (params.override.action === 'adjust_points') {
    const delta = Number(params.override.pointsDelta || 0);
    patron.points = Math.max(0, (patron.points || 0) + delta);
    await patron.save();
    actionMessage = `Adjusted points for ${patron.firstname} ${patron.surname} by ${delta > 0 ? '+' : ''}${delta}. New total: ${patron.points} points.`;
  } else if (params.override.action === 'update_profile') {
    const updates = params.override.updates || {};
    if (updates.firstname) patron.firstname = String(updates.firstname).trim();
    if (updates.surname) patron.surname = String(updates.surname).trim();
    if (updates.middlename !== undefined) patron.middlename = String(updates.middlename || '').trim() || undefined;
    if (updates.phoneNumber !== undefined) patron.phoneNumber = String(updates.phoneNumber || '').trim() || undefined;
    if (updates.email !== undefined) patron.email = String(updates.email || '').trim() || undefined;
    if (updates.gender) patron.gender = updates.gender as Gender;
    if (updates.patronType) patron.patronType = updates.patronType as PatronType;
    if (updates.points !== undefined) patron.points = Math.max(0, Number(updates.points));

    if (updates.studentSchoolInfo && typeof updates.studentSchoolInfo === 'object') {
      patron.studentSchoolInfo = {
        ...patron.studentSchoolInfo,
        ...(updates.studentSchoolInfo as Record<string, unknown>),
      };
    }
    if (updates.parentInfo && typeof updates.parentInfo === 'object') {
      patron.parentInfo = {
        ...patron.parentInfo,
        ...(updates.parentInfo as Record<string, unknown>),
      };
    }

    await patron.save();
    actionMessage = `Patron profile details successfully updated for ${patron.firstname} ${patron.surname}.`;
  } else if (params.override.action === 'delete_loan') {
    if (!params.override.loanId) {
      throw new Error('Loan ID is required to delete a circulation record.');
    }
    const deletedLoan = await Library.findByIdAndDelete(params.override.loanId);
    if (deletedLoan && deletedLoan.status !== 'returned' && deletedLoan.bookBarcode) {
      const book = await Cataloging.findOne({ barcode: deletedLoan.bookBarcode });
      if (book) {
        book.copiesAvailable = Math.min(book.copiesTotal || 1, (book.copiesAvailable || 0) + 1);
        if (book.copiesAvailable > 0) book.isCheckedOut = false;
        await book.save();
      }
    }
    const remainingActive = await Library.countDocuments({
      patronBarcode: cleanBarcode,
      status: { $in: ['borrowed', 'overdue'] },
    });
    if (remainingActive === 0) {
      patron.hasBorrowedBook = false;
      patron.lastBorrowedItem = undefined;
      await patron.save();
    }
    actionMessage = `Circulation loan record deleted permanently.`;
  } else if (params.override.action === 'edit_loan') {
    if (!params.override.loanId) {
      throw new Error('Loan ID is required to edit a circulation record.');
    }
    const updates = params.override.updates || {};
    const loanDoc = await Library.findById(params.override.loanId);
    if (!loanDoc) throw new Error('Loan record not found.');

    if (updates.dueDate) loanDoc.dueDate = new Date(updates.dueDate as string);
    if (updates.status) {
      loanDoc.status = updates.status as LoanStatus;
      if (updates.status === 'returned') {
        loanDoc.returnDate = new Date();
      }
    }
    await loanDoc.save();

    const remainingActive = await Library.countDocuments({
      patronBarcode: cleanBarcode,
      status: { $in: ['borrowed', 'overdue'] },
    });
    if (remainingActive === 0) {
      patron.hasBorrowedBook = false;
      patron.lastBorrowedItem = undefined;
      await patron.save();
    }
    actionMessage = `Circulation loan record updated successfully.`;
  } else if (params.override.action === 'add_attendance') {
    const entry = params.override.newEntry || {};
    const pointsAwarded = Number(entry.points || 1);
    await Attendance.create({
      patronId: patron._id,
      patronBarcode: cleanBarcode,
      patronName: `${patron.firstname} ${patron.surname}`,
      classType: (entry.classType as ClassType) || 'library',
      className: String(entry.className || 'General Library Attendance'),
      classDate: entry.classDate ? new Date(entry.classDate as string) : new Date(),
      attendanceTime: new Date(),
      markedBy: params.staffUsername,
      points: pointsAwarded,
      notes: (entry.notes as string) || 'Executive manual attendance entry',
      library: patron.library || 'Main Library',
    });
    patron.points = (patron.points || 0) + pointsAwarded;
    await patron.save();
    actionMessage = `Manual attendance entry created (+${pointsAwarded} points credited to patron).`;
  } else if (params.override.action === 'delete_attendance') {
    if (!params.override.attendanceId) {
      throw new Error('Attendance ID is required to delete an attendance entry.');
    }
    const att = await Attendance.findByIdAndDelete(params.override.attendanceId);
    if (att?.points) {
      patron.points = Math.max(0, (patron.points || 0) - att.points);
      await patron.save();
    }
    actionMessage = `Attendance record deleted permanently (points adjusted).`;
  } else if (params.override.action === 'edit_competition') {
    if (!params.override.competitionId) {
      throw new Error('Competition ID is required.');
    }
    const compUpdates = params.override.updates || {};
    await Competition.findByIdAndUpdate(params.override.competitionId, { $set: compUpdates });
    actionMessage = `Reading competition record updated successfully.`;
  } else if (params.override.action === 'delete_competition') {
    if (!params.override.competitionId) {
      throw new Error('Competition ID is required to delete a competition entry.');
    }
    await Competition.findByIdAndDelete(params.override.competitionId);
    actionMessage = `Reading competition record deleted permanently.`;
  } else if (params.override.action === 'edit_summary') {
    if (!params.override.summaryId) {
      throw new Error('Book summary ID is required.');
    }
    const sumUpdates = params.override.updates || {};
    await BookSummary.findByIdAndUpdate(params.override.summaryId, { $set: sumUpdates });
    actionMessage = `Book summary record updated successfully.`;
  } else if (params.override.action === 'delete_summary') {
    if (!params.override.summaryId) {
      throw new Error('Summary ID is required to delete a summary record.');
    }
    await BookSummary.findByIdAndDelete(params.override.summaryId);
    actionMessage = `Book summary record deleted permanently.`;
  } else if (params.override.action === 'delete_patron') {
    patron.isDeleted = !patron.isDeleted;
    await patron.save();
    actionMessage = `Patron record ${patron.isDeleted ? 'marked as DELETED' : 'RESTORED'}.`;
  }

  await logAuditEvent({
    action: 'PATRON_OVERRIDE_GRANTED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Patron',
    targetId: String(patron._id),
    details: {
      patronBarcode: cleanBarcode,
      patronName: `${patron.firstname} ${patron.surname}`,
      action: params.override.action,
      reason: params.override.reason,
      loanId: params.override.loanId,
      monographBarcode: params.override.monographBarcode,
      attendanceId: params.override.attendanceId,
      competitionId: params.override.competitionId,
      summaryId: params.override.summaryId,
    },
  });

  await recordDailyAction({
    actionType: 'patron_update',
    actionTitle: `Administrative patron executive action (${params.override.action}) for ${patron.firstname} ${patron.surname} (${cleanBarcode})`,
    performedBy: params.staffUsername,
    performedByName: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Patron',
    targetId: String(patron._id),
  });

  const fullData = await getPatron360Data(cleanBarcode);

  return {
    success: true,
    message: actionMessage || `Administrative action successfully executed for ${patron.firstname} ${patron.surname}.`,
    patronBarcode: cleanBarcode,
    patron: fullData.patron,
    activeLoans: fullData.loans.filter((l) => l.status === 'borrowed' || l.status === 'overdue'),
    patron360: fullData as unknown as Record<string, unknown>,
  };
}

/**
 * Requisitions querying & management.
 */
export async function listRequisitions(options: {
  status?: string;
  limit?: number;
}): Promise<IRequisitionItemDTO[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (options.status && options.status !== 'all') {
    query.status = options.status;
  }

  const items = await Requisition.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .lean();

  return items.map((r) => ({
    id: String(r._id),
    item: r.item,
    description: r.description,
    rationale: r.rationale,
    quantity: r.quantity,
    price: r.price,
    estimatedCost: r.estimatedCost,
    status: r.status,
    createdBy: r.createdBy,
    comments: (r.comments || []).map((c) => ({
      comment: c.comment,
      commenter: c.commenter,
      targetUser: c.targetUser,
      read: c.read,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
    })),
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
  }));
}

export async function updateRequisitionStatus(params: {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'done' | 'received';
  comment?: string;
  price?: number;
  staffUsername: string;
  staffRole: string;
}): Promise<IRequisitionItemDTO> {
  await connectDB();
  const reqItem = await Requisition.findById(params.id);
  if (!reqItem) {
    throw new Error('Requisition item not found');
  }

  reqItem.status = params.status;
  if (typeof params.price === 'number') {
    reqItem.price = params.price;
  }

  if (params.comment && params.comment.trim()) {
    reqItem.comments.push({
      comment: params.comment.trim(),
      commenter: params.staffUsername,
      targetUser: reqItem.createdBy,
      read: false,
      createdAt: new Date(),
    });
  }

  await reqItem.save();

  await logAuditEvent({
    action: 'REQUISITION_STATUS_UPDATED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Requisition',
    targetId: params.id,
    details: {
      item: reqItem.item,
      newStatus: params.status,
      price: params.price,
      comment: params.comment,
    },
  });

  return {
    id: String(reqItem._id),
    item: reqItem.item,
    description: reqItem.description,
    rationale: reqItem.rationale,
    quantity: reqItem.quantity,
    price: reqItem.price,
    estimatedCost: reqItem.estimatedCost,
    status: reqItem.status,
    createdBy: reqItem.createdBy,
    comments: reqItem.comments.map((c) => ({
      comment: c.comment,
      commenter: c.commenter,
      targetUser: c.targetUser,
      read: c.read,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
    })),
    createdAt: reqItem.createdAt.toISOString(),
    updatedAt: reqItem.updatedAt.toISOString(),
  };
}

/**
 * Operational Tasks management.
 */
export async function listTasks(options: {
  status?: string;
  limit?: number;
  currentUserUsername?: string;
  currentUserRole?: string;
} = {}): Promise<ITaskItemDTO[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (options.status && options.status !== 'all') {
    query.status = options.status;
  }

  const rawTasks = await Task.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .lean();

  if (!options.currentUserUsername) {
    return rawTasks.map((t) => mapTaskToDTO(t));
  }

  const currentUsername = options.currentUserUsername.toLowerCase();
  const currentUserRole = (options.currentUserRole || '').toLowerCase();

  // Load user role lookup map to evaluate legacy documents without role tags
  const allUsers = await User.find({}, 'username role').lean();
  const userRoleMap = new Map<string, string>();
  for (const u of allUsers) {
    if (u.username) {
      userRoleMap.set(u.username.toLowerCase(), (u.role || '').toLowerCase());
    }
  }

  const filteredTasks = rawTasks.filter((t) => {
    const assignedByUsername = (t.assignedBy?.username || '').toLowerCase();
    const assignedToUsername = (t.assignedTo?.username || '').toLowerCase();

    const isAssignee = assignedToUsername === currentUsername;
    const isAssigner = assignedByUsername === currentUsername;

    // 1. Broadcast / All Team Members task
    if (t.targetGroup === 'all' || assignedToUsername === 'group:all') {
      return true;
    }

    // 2. Self-assigned private task
    const isSelf =
      t.isSelfAssigned === true ||
      (assignedByUsername && assignedToUsername && assignedByUsername === assignedToUsername);

    if (isSelf) {
      // Strictly private: visible ONLY to the person who created it for themselves
      return isAssignee || isAssigner;
    }

    // 3. User is direct assignee or assigner
    if (isAssignee || isAssigner) {
      return true;
    }

    // 4. Role group assignment matching user role
    if (
      t.targetGroup === currentUserRole ||
      assignedToUsername === `group:${currentUserRole}`
    ) {
      return true;
    }

    // Resolve roles for assigner and assignee
    const assignerRole =
      (t.assignedByRole || userRoleMap.get(assignedByUsername) || '').toLowerCase();
    const assigneeRole =
      (t.assignedToRole ||
        (assignedToUsername.startsWith('group:')
          ? assignedToUsername.replace('group:', '')
          : userRoleMap.get(assignedToUsername) || '')).toLowerCase();

    const isLeadershipAssigner = ['ima', 'country_manager', 'admin'].includes(assignerRole);
    const isLeadershipAssignee = ['ima', 'country_manager', 'admin'].includes(assigneeRole);

    // 5. Leadership 1-on-1 confidential task (e.g. IMA -> Country Manager, IMA -> Admin, Country Manager -> Admin)
    if (isLeadershipAssigner && isLeadershipAssignee) {
      // Strictly confidential: visible ONLY to assigner and assignee
      return false;
    }

    // 6. General operational tasks (assigned to general staff or general departments)
    // Visible to all staff members
    return true;
  });

  return filteredTasks.map((t) => mapTaskToDTO(t));
}

function mapTaskToDTO(
  t: Partial<import('@/models/Task').ITask> & {
    _id: unknown;
    assignedBy?: { name?: string; username?: string };
    assignedTo?: { name?: string; username?: string };
  }
): ITaskItemDTO {
  const assignedByUsername = (t.assignedBy?.username || '').toLowerCase();
  const assignedToUsername = (t.assignedTo?.username || '').toLowerCase();
  const isSelfAssigned =
    t.isSelfAssigned === true ||
    (assignedByUsername && assignedToUsername && assignedByUsername === assignedToUsername);

  return {
    id: String(t._id),
    title: t.title || '',
    description: t.description,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    assignedBy: {
      name: t.assignedBy?.name || 'Admin',
      username: t.assignedBy?.username || 'admin',
    },
    assignedTo: {
      name: t.assignedTo?.name || 'Staff',
      username: t.assignedTo?.username || 'staff',
    },
    targetGroup: t.targetGroup || (assignedToUsername.startsWith('group:') ? assignedToUsername.replace('group:', '') : undefined),
    isSelfAssigned: Boolean(isSelfAssigned),
    status: (t.status as 'todo' | 'inProgress' | 'completed' | 'archived') || 'todo',
    priority: (t.priority as 'low' | 'medium' | 'high') || 'medium',
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function createTask(params: {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  assignedToUsername: string;
  assignedToName: string;
  staffUsername: string;
  staffName: string;
  staffRole: string;
}): Promise<ITaskItemDTO> {
  await connectDB();

  // 1. Check if broadcasting to "All Team Members"
  if (params.assignedToUsername === 'group:all') {
    const task = await Task.create({
      title: params.title.trim(),
      description: params.description?.trim(),
      dueDate: params.dueDate,
      priority: params.priority,
      status: 'todo',
      targetGroup: 'all',
      assignedByRole: params.staffRole,
      assignedToRole: 'all',
      isSelfAssigned: false,
      assignedBy: {
        name: params.staffName,
        username: params.staffUsername,
      },
      assignedTo: {
        name: 'All Team Members',
        username: 'group:all',
      },
      comments: [],
      likes: [],
    });

    // Broadcast notifications to all active staff members
    const activeStaff = await User.find({ active: true }, 'username').lean();
    await Promise.all(
      activeStaff
        .filter((s) => s.username.toLowerCase() !== params.staffUsername.toLowerCase())
        .map((member) =>
          Notification.create({
            recipientUsername: member.username.toLowerCase(),
            senderUsername: params.staffUsername.toLowerCase(),
            type: 'task_assigned',
            title: 'New Team-Wide Task',
            message: `@${params.staffUsername} assigned a team-wide task: "${params.title}" (Priority: ${params.priority})`,
            link: '/dashboard/tasks',
            read: false,
          })
        )
    );

    await logAuditEvent({
      action: 'TASK_BROADCAST_CREATED',
      performedBy: params.staffUsername,
      performedByRole: params.staffRole,
      targetEntity: 'Task',
      targetId: String(task._id),
      details: {
        title: params.title,
        group: 'all',
        broadcastRecipientsCount: activeStaff.length - 1,
      },
    });

    return mapTaskToDTO(task);
  }

  // 2. Check if assigning to a role group (e.g. "group:librarian", "group:ict")
  if (params.assignedToUsername.startsWith('group:')) {
    const targetRole = params.assignedToUsername.replace('group:', '') as import('@/models/User').UserRole;
    const task = await Task.create({
      title: params.title.trim(),
      description: params.description?.trim(),
      dueDate: params.dueDate,
      priority: params.priority,
      status: 'todo',
      targetGroup: targetRole,
      assignedByRole: params.staffRole,
      assignedToRole: targetRole,
      isSelfAssigned: false,
      assignedBy: {
        name: params.staffName,
        username: params.staffUsername,
      },
      assignedTo: {
        name: `${targetRole.replace('_', ' ').toUpperCase()} Team`,
        username: params.assignedToUsername,
      },
      comments: [],
      likes: [],
    });

    const groupMembers = await User.find({ role: targetRole, active: true }, 'username').lean();
    await Promise.all(
      groupMembers
        .filter((m) => m.username.toLowerCase() !== params.staffUsername.toLowerCase())
        .map((member) =>
          Notification.create({
            recipientUsername: member.username.toLowerCase(),
            senderUsername: params.staffUsername.toLowerCase(),
            type: 'task_assigned',
            title: 'New Team Task Assigned',
            message: `@${params.staffUsername} assigned your team a task: "${params.title}" (Priority: ${params.priority})`,
            link: '/dashboard/tasks',
            read: false,
          })
        )
    );

    await logAuditEvent({
      action: 'TASK_GROUP_CREATED',
      performedBy: params.staffUsername,
      performedByRole: params.staffRole,
      targetEntity: 'Task',
      targetId: String(task._id),
      details: {
        title: params.title,
        groupRole: targetRole,
        membersCount: groupMembers.length,
      },
    });

    return mapTaskToDTO(task);
  }

  // 3. Individual task assignment
  const isSelf = params.staffUsername.toLowerCase() === params.assignedToUsername.toLowerCase();
  let targetUserRole = params.staffRole;
  if (!isSelf) {
    const targetUserDoc = await User.findOne({ username: params.assignedToUsername.toLowerCase() }, 'role').lean();
    targetUserRole = targetUserDoc?.role || 'staff';
  }

  const task = await Task.create({
    title: params.title.trim(),
    description: params.description?.trim(),
    dueDate: params.dueDate,
    priority: params.priority,
    status: 'todo',
    assignedByRole: params.staffRole,
    assignedToRole: targetUserRole,
    isSelfAssigned: isSelf,
    assignedBy: {
      name: params.staffName,
      username: params.staffUsername,
    },
    assignedTo: {
      name: params.assignedToName,
      username: params.assignedToUsername,
    },
    comments: [],
    likes: [],
  });

  // Dispatch in-app notification to the assignee if not self
  if (!isSelf) {
    await Notification.create({
      recipientUsername: params.assignedToUsername.toLowerCase(),
      senderUsername: params.staffUsername.toLowerCase(),
      type: 'task_assigned',
      title: 'New Operational Task Assigned',
      message: `@${params.staffUsername} assigned you a task: "${params.title}" (Priority: ${params.priority})`,
      link: '/dashboard/tasks',
      read: false,
    });
  }

  await logAuditEvent({
    action: isSelf ? 'TASK_SELF_CREATED' : 'TASK_CREATED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Task',
    targetId: String(task._id),
    details: {
      title: task.title,
      priority: task.priority,
      assignedTo: task.assignedTo.username,
      isSelfAssigned: isSelf,
    },
  });

  return mapTaskToDTO(task);
}

export async function updateTaskStatus(params: {
  id: string;
  status: 'todo' | 'inProgress' | 'completed' | 'archived';
  staffUsername: string;
  staffRole: string;
}): Promise<ITaskItemDTO> {
  await connectDB();
  const task = await Task.findById(params.id);
  if (!task) {
    throw new Error('Task not found');
  }

  const oldStatus = task.status;
  task.status = params.status;
  await task.save();

  // Notify the assigner whenever the task status is changed by someone else (e.g. assignee)
  if (
    params.status !== oldStatus &&
    task.assignedBy?.username &&
    task.assignedBy.username.toLowerCase() !== params.staffUsername.toLowerCase()
  ) {
    const statusLabels: Record<string, string> = {
      todo: 'To Do',
      inProgress: 'In Progress',
      completed: 'Completed',
      archived: 'Archived',
    };
    const targetLabel = statusLabels[params.status] || params.status;
    const oldLabel = statusLabels[oldStatus] || oldStatus;

    let notifTitle = `Task Moved to ${targetLabel}`;
    let notifMessage = `@${params.staffUsername} moved task "${task.title}" to ${targetLabel}.`;

    if (params.status === 'completed') {
      notifTitle = 'Task Completed';
      notifMessage = `@${params.staffUsername} marked task "${task.title}" as Completed.`;
    } else if (params.status === 'todo') {
      notifTitle = 'Task Moved Back to To Do';
      notifMessage = `@${params.staffUsername} moved task "${task.title}" back from ${oldLabel} to To Do.`;
    } else if (params.status === 'inProgress') {
      notifTitle = 'Task In Progress';
      notifMessage = `@${params.staffUsername} moved task "${task.title}" from ${oldLabel} to In Progress.`;
    }

    await Notification.create({
      recipientUsername: task.assignedBy.username.toLowerCase(),
      senderUsername: params.staffUsername.toLowerCase(),
      type: 'task_updated',
      title: notifTitle,
      message: notifMessage,
      link: '/dashboard/tasks',
      read: false,
    });
  }

  await logAuditEvent({
    action: 'TASK_UPDATED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Task',
    targetId: params.id,
    details: {
      title: task.title,
      oldStatus,
      newStatus: params.status,
    },
  });

  return mapTaskToDTO(task);
}

export async function updateTaskDetails(params: {
  id: string;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'inProgress' | 'completed' | 'archived';
  dueDate?: Date | null;
  assignedToUsername?: string;
  assignedToName?: string;
  staffUsername: string;
  staffRole: string;
}): Promise<ITaskItemDTO> {
  await connectDB();
  const task = await Task.findById(params.id);
  if (!task) {
    throw new Error('Task not found');
  }

  const oldStatus = task.status;
  if (params.title !== undefined) task.title = params.title.trim();
  if (params.description !== undefined) task.description = params.description.trim();
  if (params.priority !== undefined) task.priority = params.priority;
  if (params.status !== undefined) task.status = params.status;
  if (params.dueDate !== undefined) task.dueDate = params.dueDate || undefined;
  if (params.assignedToUsername && params.assignedToName) {
    const oldAssignee = task.assignedTo.username;
    task.assignedTo = {
      username: params.assignedToUsername.trim(),
      name: params.assignedToName.trim(),
    };

    if (oldAssignee.toLowerCase() !== params.assignedToUsername.toLowerCase()) {
      await Notification.create({
        recipientUsername: params.assignedToUsername.toLowerCase(),
        senderUsername: params.staffUsername.toLowerCase(),
        type: 'task_assigned',
        title: 'Task Re-assigned to You',
        message: `@${params.staffUsername} re-assigned task "${task.title}" to you.`,
        link: '/dashboard/tasks',
        read: false,
      });
    }
  }

  // Notify the assigner if status was changed during details edit
  if (
    params.status !== undefined &&
    params.status !== oldStatus &&
    task.assignedBy?.username &&
    task.assignedBy.username.toLowerCase() !== params.staffUsername.toLowerCase()
  ) {
    const statusLabels: Record<string, string> = {
      todo: 'To Do',
      inProgress: 'In Progress',
      completed: 'Completed',
      archived: 'Archived',
    };
    const targetLabel = statusLabels[params.status] || params.status;
    const oldLabel = statusLabels[oldStatus] || oldStatus;

    let notifTitle = `Task Moved to ${targetLabel}`;
    let notifMessage = `@${params.staffUsername} moved task "${task.title}" to ${targetLabel}.`;

    if (params.status === 'completed') {
      notifTitle = 'Task Completed';
      notifMessage = `@${params.staffUsername} marked task "${task.title}" as Completed.`;
    } else if (params.status === 'todo') {
      notifTitle = 'Task Moved Back to To Do';
      notifMessage = `@${params.staffUsername} moved task "${task.title}" back from ${oldLabel} to To Do.`;
    } else if (params.status === 'inProgress') {
      notifTitle = 'Task In Progress';
      notifMessage = `@${params.staffUsername} moved task "${task.title}" from ${oldLabel} to In Progress.`;
    }

    await Notification.create({
      recipientUsername: task.assignedBy.username.toLowerCase(),
      senderUsername: params.staffUsername.toLowerCase(),
      type: 'task_updated',
      title: notifTitle,
      message: notifMessage,
      link: '/dashboard/tasks',
      read: false,
    });
  }

  await task.save();

  await logAuditEvent({
    action: 'TASK_EDITED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Task',
    targetId: params.id,
    details: {
      title: task.title,
      priority: task.priority,
      assignedTo: task.assignedTo.username,
    },
  });

  return mapTaskToDTO(task);
}


/**
 * Foundation Events management.
 */
export async function listEvents(options: {
  academicYear?: number;
  limit?: number;
}): Promise<IEventItemDTO[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (options.academicYear) {
    query.academicYear = options.academicYear;
  }

  const events = await Event.find(query)
    .sort({ eventDate: 1 })
    .limit(options.limit || 100)
    .lean();

  return events.map((e) => ({
    id: String(e._id),
    eventName: e.eventName,
    title: e.title || e.eventName,
    attendee: e.attendee,
    eventDate: e.eventDate ? new Date(e.eventDate).toISOString() : new Date().toISOString(),
    academicYear: e.academicYear || (e.eventDate ? new Date(e.eventDate).getFullYear() : undefined),
    category: (e.category as IEventItemDTO['category']) || 'general',
    eventDetail: e.eventDetail,
    description: e.description,
    participants: e.participants,
    focalPerson: e.focalPerson,
    remarks: e.remarks,
    location: e.location || 'DZF Learning Center',
    targetAudience: e.targetAudience || 'All Patrons',
    arrivalTime: e.arrivalTime || '09:00 AM',
    alertsSent: e.alertsSent || { oneMonth: false, twoWeeks: false, oneWeek: false },
    createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : undefined,
  }));
}

export async function createEvent(params: {
  eventName: string;
  title?: string;
  eventDate: Date;
  academicYear?: number;
  category?: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
  location?: string;
  targetAudience?: string;
  arrivalTime?: string;
  description?: string;
  participants?: string;
  focalPerson?: string;
  remarks?: string;
  staffUsername: string;
  staffRole: string;
}): Promise<IEventItemDTO> {
  await connectDB();
  const academicYear = params.academicYear || new Date(params.eventDate).getFullYear();
  const event = await Event.create({
    eventName: params.eventName.trim(),
    title: params.title?.trim() || params.eventName.trim(),
    eventDate: params.eventDate,
    academicYear,
    category: params.category || 'general',
    location: params.location?.trim() || 'DZF Learning Center',
    targetAudience: params.targetAudience?.trim() || 'All Patrons',
    arrivalTime: params.arrivalTime?.trim() || '09:00 AM',
    description: params.description?.trim(),
    participants: params.participants?.trim(),
    focalPerson: params.focalPerson?.trim(),
    remarks: params.remarks?.trim(),
  });

  await logAuditEvent({
    action: 'EVENT_CREATED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Event',
    targetId: String(event._id),
    details: {
      eventName: event.eventName,
      eventDate: event.eventDate,
      academicYear,
    },
  });

  return {
    id: String(event._id),
    eventName: event.eventName,
    title: event.title,
    eventDate: event.eventDate.toISOString(),
    academicYear: event.academicYear,
    category: event.category,
    location: event.location,
    targetAudience: event.targetAudience,
    arrivalTime: event.arrivalTime,
    description: event.description,
    participants: event.participants,
    focalPerson: event.focalPerson,
    remarks: event.remarks,
    alertsSent: event.alertsSent,
    createdAt: event.createdAt.toISOString(),
  };
}

export async function updateEventDetails(params: {
  id: string;
  eventName?: string;
  title?: string;
  eventDate?: Date;
  academicYear?: number;
  category?: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
  location?: string;
  targetAudience?: string;
  arrivalTime?: string;
  description?: string;
  participants?: string;
  focalPerson?: string;
  remarks?: string;
  staffUsername: string;
  staffRole: string;
}): Promise<IEventItemDTO> {
  await connectDB();
  const event = await Event.findById(params.id);
  if (!event) {
    throw new Error('Event not found');
  }

  if (params.eventName !== undefined) event.eventName = params.eventName.trim();
  if (params.title !== undefined) event.title = params.title.trim();
  if (params.eventDate !== undefined) {
    event.eventDate = params.eventDate;
    event.academicYear = params.academicYear || new Date(params.eventDate).getFullYear();
  } else if (params.academicYear !== undefined) {
    event.academicYear = params.academicYear;
  }
  if (params.category !== undefined) event.category = params.category;
  if (params.location !== undefined) event.location = params.location.trim();
  if (params.targetAudience !== undefined) event.targetAudience = params.targetAudience.trim();
  if (params.arrivalTime !== undefined) event.arrivalTime = params.arrivalTime.trim();
  if (params.description !== undefined) event.description = params.description.trim();
  if (params.participants !== undefined) event.participants = params.participants.trim();
  if (params.focalPerson !== undefined) event.focalPerson = params.focalPerson.trim();
  if (params.remarks !== undefined) event.remarks = params.remarks.trim();

  await event.save();

  await logAuditEvent({
    action: 'EVENT_UPDATED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Event',
    targetId: params.id,
    details: {
      eventName: event.eventName,
      eventDate: event.eventDate,
    },
  });

  return {
    id: String(event._id),
    eventName: event.eventName,
    title: event.title,
    eventDate: event.eventDate.toISOString(),
    academicYear: event.academicYear,
    category: event.category,
    location: event.location,
    targetAudience: event.targetAudience,
    arrivalTime: event.arrivalTime,
    description: event.description,
    participants: event.participants,
    focalPerson: event.focalPerson,
    remarks: event.remarks,
    alertsSent: event.alertsSent,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export async function createEventsBatch(params: {
  events: Array<{
    eventName: string;
    title?: string;
    eventDate: Date;
    academicYear?: number;
    category?: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
    location?: string;
    targetAudience?: string;
    arrivalTime?: string;
    description?: string;
    participants?: string;
    focalPerson?: string;
    remarks?: string;
  }>;
  staffUsername: string;
  staffRole: string;
}): Promise<{ count: number; events: IEventItemDTO[] }> {
  await connectDB();
  if (!params.events || params.events.length === 0) {
    return { count: 0, events: [] };
  }

  const docsToInsert = params.events.map((e) => ({
    eventName: e.eventName.trim(),
    title: e.title?.trim() || e.eventName.trim(),
    eventDate: e.eventDate,
    academicYear: e.academicYear || new Date(e.eventDate).getFullYear(),
    category: e.category || 'general',
    location: e.location?.trim() || 'DZF Learning Center',
    targetAudience: e.targetAudience?.trim() || 'All Patrons',
    arrivalTime: e.arrivalTime?.trim() || '09:00 AM',
    description: e.description?.trim(),
    participants: e.participants?.trim(),
    focalPerson: e.focalPerson?.trim(),
    remarks: e.remarks?.trim(),
    alertsSent: { oneMonth: false, twoWeeks: false, oneWeek: false },
  }));

  const inserted = await Event.insertMany(docsToInsert);

  await logAuditEvent({
    action: 'EVENTS_BATCH_IMPORTED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Event',
    details: {
      count: inserted.length,
      sampleTitles: inserted.slice(0, 3).map((doc) => doc.title),
    },
  });

  const resultDTOs = inserted.map((doc) => ({
    id: String(doc._id),
    eventName: doc.eventName,
    title: doc.title,
    eventDate: doc.eventDate.toISOString(),
    academicYear: doc.academicYear,
    category: doc.category as IEventItemDTO['category'],
    location: doc.location,
    targetAudience: doc.targetAudience,
    arrivalTime: doc.arrivalTime,
    description: doc.description,
    participants: doc.participants,
    focalPerson: doc.focalPerson,
    remarks: doc.remarks,
    alertsSent: doc.alertsSent,
    createdAt: doc.createdAt.toISOString(),
  }));

  return { count: resultDTOs.length, events: resultDTOs };
}

/**
 * Audit logs query with pagination.
 */
export async function queryAuditLogs(options: {
  action?: string;
  performedBy?: string;
  targetEntity?: string;
  limit?: number;
  page?: number;
}): Promise<{ logs: IAuditLogItemDTO[]; total: number; page: number; totalPages: number }> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (options.action) query.action = options.action;
  if (options.performedBy) query.performedBy = options.performedBy;
  if (options.targetEntity) query.targetEntity = options.targetEntity;

  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 25));
  const skip = (page - 1) * limit;

  const [total, docs] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const logs: IAuditLogItemDTO[] = docs.map((d) => ({
    id: String(d._id),
    action: d.action,
    performedBy: d.performedBy,
    performedByRole: d.performedByRole,
    targetEntity: d.targetEntity,
    targetId: d.targetId,
    details: d.details as Record<string, unknown> | undefined,
    ipAddress: d.ipAddress,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
  }));

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
