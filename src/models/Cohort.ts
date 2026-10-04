import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICohortAttendanceRecord {
  date?: Date;
  week?: number;
  attended: boolean;
}

export interface ICohort {
  _id: mongoose.Types.ObjectId;
  barcode: string;
  firstname: string;
  surname: string;
  middlename?: string;
  schoolClass?: string;
  receivedCertificate: boolean;
  active: boolean;
  isRemoved: boolean;
  cohortType: string;
  removedAt?: Date;
  attendance: ICohortAttendanceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICohortDocument extends Omit<ICohort, '_id'>, Document {}

const CohortAttendanceSchema = new Schema<ICohortAttendanceRecord>(
  {
    date: { type: Date },
    week: { type: Number },
    attended: { type: Boolean, default: false },
  },
  { _id: false }
);

const CohortSchema = new Schema<ICohortDocument>(
  {
    barcode: {
      type: String,
      required: [true, 'Student barcode is required'],
      trim: true,
      index: true,
    },
    firstname: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    surname: {
      type: String,
      required: [true, 'Surname is required'],
      trim: true,
    },
    middlename: {
      type: String,
      trim: true,
    },
    schoolClass: {
      type: String,
      trim: true,
      default: '',
    },
    receivedCertificate: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    isRemoved: {
      type: Boolean,
      default: false,
      index: true,
    },
    cohortType: {
      type: String,
      required: [true, 'Cohort group type identifier is required'],
      trim: true,
      index: true,
    },
    removedAt: {
      type: Date,
    },
    attendance: {
      type: [CohortAttendanceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for cohort roster queries and unique membership per cohort
CohortSchema.index({ cohortType: 1, active: 1 });
CohortSchema.index({ cohortType: 1, isRemoved: 1 });
CohortSchema.index({ barcode: 1, active: 1 });
CohortSchema.index({ barcode: 1, cohortType: 1 }, { unique: true });

export const Cohort: Model<ICohortDocument> =
  mongoose.models.Cohort ||
  mongoose.model<ICohortDocument>('Cohort', CohortSchema);

export default Cohort;
