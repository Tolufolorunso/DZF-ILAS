import { DailyActionType } from '@/models/DailyAction';

export interface IDailyActionDTO {
  id: string;
  actionType: DailyActionType;
  actionTitle: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  targetEntity: string;
  targetId: string;
  isReversible: boolean;
  isUndone: boolean;
  undoneAt?: string;
  undoneBy?: string;
  dayTimestamp: string;
  createdAt: string;
  isCutoffExpired: boolean;
}

export interface RecordDailyActionParams {
  actionType: DailyActionType;
  actionTitle: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  targetEntity: string;
  targetId: string;
  reversiblePayload?: Record<string, unknown>;
  isReversible?: boolean;
}

export interface DailyActionsQueryOptions {
  date?: string; // 'YYYY-MM-DD'
  staff?: string; // username filter
  actionType?: string;
  currentUserRole: string;
  limit?: number;
  skip?: number;
}

export interface DailyActionUndoResult {
  success: boolean;
  message: string;
  actionId: string;
  actionType: DailyActionType;
  targetEntity: string;
  targetId: string;
}
