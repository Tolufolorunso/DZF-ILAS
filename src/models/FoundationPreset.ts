import mongoose, { Document, Model, Schema } from 'mongoose';

export type PresetCategory = 'annual_event' | 'school' | 'cohort_track' | 'grade_band';

export interface IFoundationPreset {
  _id: mongoose.Types.ObjectId;
  category: PresetCategory;
  name: string;
  slug: string;
  targetMonth?: number; // 1 - 12 (Jan - Dec)
  monthLabel?: string; // e.g. 'January', 'February'
  targetAudience?: string;
  description?: string;
  competitionType?: 'reading' | 'writing' | 'speaking' | 'essay' | 'spelling' | 'listening' | 'other';
  defaultPoints?: number;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFoundationPresetDocument
  extends Omit<IFoundationPreset, '_id'>,
    Document {}

const FoundationPresetSchema = new Schema<IFoundationPresetDocument>(
  {
    category: {
      type: String,
      enum: ['annual_event', 'school', 'cohort_track', 'grade_band'],
      required: [true, 'Preset category is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Preset name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Preset slug is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    targetMonth: {
      type: Number,
      min: 1,
      max: 12,
      index: true,
    },
    monthLabel: {
      type: String,
      trim: true,
    },
    targetAudience: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    competitionType: {
      type: String,
      enum: ['reading', 'writing', 'speaking', 'essay', 'spelling', 'listening', 'other'],
    },
    defaultPoints: {
      type: Number,
      default: 5,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

FoundationPresetSchema.index({ category: 1, targetMonth: 1 });
FoundationPresetSchema.index({ category: 1, slug: 1 }, { unique: true });

export const FoundationPreset: Model<IFoundationPresetDocument> =
  mongoose.models.FoundationPreset ||
  mongoose.model<IFoundationPresetDocument>('FoundationPreset', FoundationPresetSchema);

export default FoundationPreset;
