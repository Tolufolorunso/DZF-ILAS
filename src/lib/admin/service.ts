import { connectDB } from '@/lib/db';
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
} from '@/models';
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
 * Executes an administrative override on a patron's circulation record.
 */
export async function executePatronOverride(params: {
  override: IPatronOverrideRequest;
  staffUsername: string;
  staffRole: string;
}): Promise<{ success: boolean; message: string; patronBarcode: string }> {
  await connectDB();
  const cleanBarcode = params.override.patronBarcode.trim();

  const patron = await Patron.findOne({ barcode: cleanBarcode, isDeleted: { $ne: true } });
  if (!patron) {
    throw new Error(`Patron with barcode "${cleanBarcode}" was not found.`);
  }

  if (params.override.action === 'clear_borrow_lock') {
    patron.hasBorrowedBook = false;
    patron.lastBorrowedItem = undefined;
    await patron.save();
  } else if (params.override.action === 'waive_overdues') {
    // Waive open overdue status on existing loans
    await Library.updateMany(
      { patronBarcode: cleanBarcode, status: 'overdue' },
      { status: 'returned', returnDate: new Date() }
    );
    patron.hasBorrowedBook = false;
    patron.lastBorrowedItem = undefined;
    await patron.save();
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
    },
  });

  return {
    success: true,
    message: `Administrative override (${params.override.action}) successfully applied for patron ${patron.firstname} ${patron.surname}.`,
    patronBarcode: cleanBarcode,
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
}): Promise<ITaskItemDTO[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (options.status && options.status !== 'all') {
    query.status = options.status;
  }

  const tasks = await Task.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .lean();

  return tasks.map((t) => ({
    id: String(t._id),
    title: t.title,
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
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
  }));
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
  const task = await Task.create({
    title: params.title.trim(),
    description: params.description?.trim(),
    dueDate: params.dueDate,
    priority: params.priority,
    status: 'todo',
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

  await logAuditEvent({
    action: 'TASK_CREATED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Task',
    targetId: String(task._id),
    details: {
      title: task.title,
      priority: task.priority,
      assignedTo: task.assignedTo.username,
    },
  });

  return {
    id: String(task._id),
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    assignedBy: task.assignedBy,
    assignedTo: task.assignedTo,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
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

  task.status = params.status;
  await task.save();

  await logAuditEvent({
    action: 'TASK_UPDATED',
    performedBy: params.staffUsername,
    performedByRole: params.staffRole,
    targetEntity: 'Task',
    targetId: params.id,
    details: {
      title: task.title,
      newStatus: params.status,
    },
  });

  return {
    id: String(task._id),
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    assignedBy: task.assignedBy,
    assignedTo: task.assignedTo,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

/**
 * Foundation Events management.
 */
export async function listEvents(options: { limit?: number }): Promise<IEventItemDTO[]> {
  await connectDB();
  const events = await Event.find()
    .sort({ eventDate: 1 })
    .limit(options.limit || 50)
    .lean();

  return events.map((e) => ({
    id: String(e._id),
    eventName: e.eventName,
    title: e.title || e.eventName,
    attendee: e.attendee,
    eventDate: e.eventDate ? new Date(e.eventDate).toISOString() : new Date().toISOString(),
    eventDetail: e.eventDetail,
    description: e.description,
    location: e.location,
    targetAudience: e.targetAudience,
    arrivalTime: e.arrivalTime,
    createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
  }));
}

export async function createEvent(params: {
  eventName: string;
  title?: string;
  eventDate: Date;
  location?: string;
  targetAudience?: string;
  arrivalTime?: string;
  description?: string;
  staffUsername: string;
  staffRole: string;
}): Promise<IEventItemDTO> {
  await connectDB();
  const event = await Event.create({
    eventName: params.eventName.trim(),
    title: params.title?.trim() || params.eventName.trim(),
    eventDate: params.eventDate,
    location: params.location?.trim() || 'DZF Learning Center',
    targetAudience: params.targetAudience?.trim() || 'All Patrons',
    arrivalTime: params.arrivalTime?.trim() || '09:00 AM',
    description: params.description?.trim(),
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
    },
  });

  return {
    id: String(event._id),
    eventName: event.eventName,
    title: event.title,
    eventDate: event.eventDate.toISOString(),
    location: event.location,
    targetAudience: event.targetAudience,
    arrivalTime: event.arrivalTime,
    description: event.description,
    createdAt: event.createdAt.toISOString(),
  };
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
