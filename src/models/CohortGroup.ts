import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICohortGroup {
  _id: mongoose.Types.ObjectId;
  cohortType: string;
  displayName: string;
  description: string;
  active: boolean;
  order: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICohortGroupDocument
  extends Omit<ICohortGroup, '_id'>,
    Document {}

const CohortGroupSchema = new Schema<ICohortGroupDocument>(
  {
    cohortType: {
      type: String,
      required: [true, 'Cohort group key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 100,
    },
    createdBy: {
      type: String,
      trim: true,
      default: '',
    },
    updatedBy: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-populate displayName if not provided
CohortGroupSchema.pre('validate', function setDisplayName(this: ICohortGroupDocument) {
  if (!this.displayName && this.cohortType) {
    this.displayName = this.cohortType;
  }
});

// Index for ordered active cohort listings
CohortGroupSchema.index({ active: 1, order: 1, cohortType: 1 });

export const CohortGroup: Model<ICohortGroupDocument> =
  mongoose.models.CohortGroup ||
  mongoose.model<ICohortGroupDocument>('CohortGroup', CohortGroupSchema);

export default CohortGroup;
