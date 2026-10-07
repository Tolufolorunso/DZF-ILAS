import mongoose, { Document, Model, Schema } from 'mongoose';

export type DailyActionType =
  | 'attendance_scan'
  | 'book_checkout'
  | 'book_return'
  | 'book_create'
  | 'book_update'
  | 'book_delete'
  | 'patron_create'
  | 'patron_update'
  | 'patron_delete'
  | 'cohort_action'
  | 'competition_entry'
  | 'task_create'
  | 'task_status_change';

export interface IDailyAction {
  _id: mongoose.Types.ObjectId;
  actionType: DailyActionType;
  actionTitle: string;
  performedBy: string; // username
  performedByName: string; // display name
  performedByRole: string; // e.g. 'librarian', 'ict', 'admin', 'country_manager', 'ima'
  targetEntity: string; // e.g. 'Attendance', 'Library', 'Cataloging', 'Patron', 'Cohort', 'Competition', 'Task'
  targetId: string;
  reversiblePayload?: Record<string, unknown>;
  isReversible: boolean;
  isUndone: boolean;
  undoneAt?: Date;
  undoneBy?: string; // admin username
  dayTimestamp: string; // 'YYYY-MM-DD' in WAT (Africa/Lagos, UTC+1)
  createdAt: Date;
  updatedAt: Date;
}

export interface IDailyActionDocument extends Omit<IDailyAction, '_id'>, Document {}

const DailyActionSchema = new Schema<IDailyActionDocument>(
  {
    actionType: {
      type: String,
      required: true,
      index: true,
    },
    actionTitle: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    performedByName: {
      type: String,
      required: true,
      trim: true,
    },
    performedByRole: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetEntity: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
    },
    reversiblePayload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isReversible: {
      type: Boolean,
      default: false,
    },
    isUndone: {
      type: Boolean,
      default: false,
      index: true,
    },
    undoneAt: {
      type: Date,
    },
    undoneBy: {
      type: String,
      trim: true,
    },
    dayTimestamp: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

DailyActionSchema.index({ dayTimestamp: 1, createdAt: -1 });
DailyActionSchema.index({ performedByRole: 1, dayTimestamp: 1 });
DailyActionSchema.index({ performedBy: 1, dayTimestamp: 1 });

export const DailyAction: Model<IDailyActionDocument> =
  mongoose.models.DailyAction ||
  mongoose.model<IDailyActionDocument>('DailyAction', DailyActionSchema);

export default DailyAction;
