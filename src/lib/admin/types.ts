export interface ISystemStats {
  books: number;
  patrons: number;
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  attendanceCount: number;
  cohortsCount: number;
  articlesCount: number;
  staffCount: number;
  pendingRequisitions: number;
  openTasks: number;
  upcomingEvents: number;
}

export interface ISystemSettingsDTO {
  emergencyCirculationLock: boolean;
  circulationLockReason: string;
  lockedBy: string;
  lockedAt?: string | null;
  overdueGraceDays: number;
  allowMultipleLoansOverride: boolean;
  maintenanceMode: boolean;
  announcementBanner: string;
  updatedAt: string;
}

export type PatronOverrideAction =
  | 'clear_borrow_lock'
  | 'waive_overdues'
  | 'grant_loan_override';

export interface IPatronOverrideRequest {
  patronBarcode: string;
  action: PatronOverrideAction;
  reason: string;
}

export interface IRequisitionReviewRequest {
  status: 'pending' | 'approved' | 'rejected' | 'done' | 'received';
  comment?: string;
  price?: number;
}

export interface IRequisitionItemDTO {
  id: string;
  item: string;
  description?: string;
  rationale: string;
  quantity: number;
  price?: number;
  estimatedCost?: number;
  status: 'pending' | 'approved' | 'rejected' | 'done' | 'received';
  createdBy: string;
  comments: Array<{
    comment: string;
    commenter: string;
    targetUser: string;
    read: boolean;
    createdAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ITaskItemDTO {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  assignedBy: { name: string; username: string };
  assignedTo: { name: string; username: string };
  status: 'todo' | 'inProgress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface IEventItemDTO {
  id: string;
  eventName: string;
  title?: string;
  attendee?: string;
  eventDate: string;
  academicYear?: number;
  category?: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
  eventDetail?: string;
  description?: string;
  location?: string;
  targetAudience?: string;
  arrivalTime?: string;
  participants?: string;
  focalPerson?: string;
  remarks?: string;
  alertsSent?: {
    oneMonth?: boolean;
    twoWeeks?: boolean;
    oneWeek?: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface IAuditLogItemDTO {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}
