import mongoose, { Document, Model, Schema } from 'mongoose';

export type AuditAction =
  | 'CIRCULATION_LOCK_TOGGLED'
  | 'PATRON_OVERRIDE_GRANTED'
  | 'REQUISITION_CREATED'
  | 'REQUISITION_STATUS_UPDATED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'EVENT_CREATED'
  | 'EVENT_DELETED'
  | 'ADMIN_OVERRIDE'
  | 'SYSTEM_SETTING_UPDATED';

export interface IAuditLog {
  _id: mongoose.Types.ObjectId;
  action: AuditAction | string;
  performedBy: string;
  performedByRole: string;
  targetEntity: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLogDocument extends Omit<IAuditLog, '_id'>, Document {}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: {
      type: String,
      required: [true, 'Action identifier is required'],
      trim: true,
      index: true,
    },
    performedBy: {
      type: String,
      required: [true, 'Actor username is required'],
      trim: true,
      index: true,
    },
    performedByRole: {
      type: String,
      required: true,
      default: 'admin',
      trim: true,
    },
    targetEntity: {
      type: String,
      required: [true, 'Target entity is required'],
      trim: true,
      index: true,
    },
    targetId: {
      type: String,
      trim: true,
      default: '',
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for reverse-chronological activity lookups
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetEntity: 1, createdAt: -1 });
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLogDocument> =
  (mongoose.models && (mongoose.models.AuditLog as Model<IAuditLogDocument>)) ||
  mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

export default AuditLog;
