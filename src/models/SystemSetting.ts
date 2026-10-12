import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBroadcastBanner {
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  isActive: boolean;
  link?: string;
  pushToDesktop?: boolean;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface ISystemSetting {
  _id: string; // Singleton key 'default'
  emergencyCirculationLock: boolean;
  circulationLockReason?: string;
  lockedBy?: string;
  lockedAt?: Date;
  overdueGraceDays: number;
  allowMultipleLoansOverride: boolean;
  maintenanceMode: boolean;
  announcementBanner?: string;
  broadcastBanner?: IBroadcastBanner;
  lastPromotionYear?: number;
  lastPromotionDate?: Date;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISystemSettingDocument extends Document<string> {
  _id: string;
  emergencyCirculationLock: boolean;
  circulationLockReason?: string;
  lockedBy?: string;
  lockedAt?: Date;
  overdueGraceDays: number;
  allowMultipleLoansOverride: boolean;
  maintenanceMode: boolean;
  announcementBanner?: string;
  broadcastBanner?: IBroadcastBanner;
  lastPromotionYear?: number;
  lastPromotionDate?: Date;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSettingDocument>(
  {
    _id: {
      type: String,
      default: 'default',
    },
    emergencyCirculationLock: {
      type: Boolean,
      default: false,
    },
    circulationLockReason: {
      type: String,
      default: '',
      trim: true,
    },
    lockedBy: {
      type: String,
      default: '',
      trim: true,
    },
    lockedAt: {
      type: Date,
    },
    overdueGraceDays: {
      type: Number,
      default: 0,
    },
    allowMultipleLoansOverride: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    announcementBanner: {
      type: String,
      default: '',
      trim: true,
    },
    broadcastBanner: {
      message: { type: String, default: '', trim: true },
      severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'success'],
        default: 'info',
      },
      isActive: { type: Boolean, default: false },
      link: { type: String, default: '', trim: true },
      pushToDesktop: { type: Boolean, default: false },
      updatedAt: { type: Date },
      updatedBy: { type: String, default: 'admin' },
    },
    lastPromotionYear: {
      type: Number,
    },
    lastPromotionDate: {
      type: Date,
    },
    updatedBy: {
      type: String,
      default: 'system',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting: Model<ISystemSettingDocument> =
  (mongoose.models && (mongoose.models.SystemSetting as Model<ISystemSettingDocument>)) ||
  mongoose.model<ISystemSettingDocument>('SystemSetting', SystemSettingSchema);

export default SystemSetting;
