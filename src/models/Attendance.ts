import mongoose, { Document, Model, Schema } from 'mongoose';

export type ClassType =
  | 'library'
  | 'cohort'
  | 'literacy'
  | 'reading_club'
  | 'book_discussion'
  | 'workshop'
  | 'other';

export interface IAttendance {
  _id: mongoose.Types.ObjectId;
  patronId: mongoose.Types.ObjectId;
  patronBarcode: string;
  patronName: string;
  classType: ClassType;
  className: string;
  classDate: Date;
  attendanceTime: Date;
  markedBy: string;
  points: number;
  notes?: string;
  library: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceDocument
  extends Omit<IAttendance, '_id'>,
    Document {}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    patronId: {
      type: Schema.Types.ObjectId,
      ref: 'Patron',
      required: [true, 'Patron reference ID is required'],
      index: true,
    },
    patronBarcode: {
      type: String,
      required: [true, 'Patron barcode is required'],
      trim: true,
      index: true,
    },
    patronName: {
      type: String,
      required: [true, 'Patron name is required'],
      trim: true,
    },
    classType: {
      type: String,
      enum: [
        'library',
        'cohort',
        'literacy',
        'reading_club',
        'book_discussion',
        'workshop',
        'other',
      ],
      default: 'literacy',
      index: true,
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      index: true,
    },
    classDate: {
      type: Date,
      required: [true, 'Class date is required'],
      index: true,
    },
    attendanceTime: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: String,
      required: [true, 'Staff member who marked attendance is required'],
      trim: true,
    },
    points: {
      type: Number,
      default: 20, // Aligned with API implementation (20 pts awarded per session)
    },
    notes: {
      type: String,
      trim: true,
    },
    library: {
      type: String,
      required: true,
      default: 'AAoJ',
    },
  },
  {
    timestamps: true,
  }
);

// Normalize classDate to start-of-day UTC to eliminate timezone collision bugs
AttendanceSchema.pre('validate', function normalizeDate(this: IAttendanceDocument) {
  if (this.classDate) {
    const d = new Date(this.classDate);
    if (!isNaN(d.getTime())) {
      this.classDate = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      );
    }
  }
});

// Compound unique index ensuring only one attendance record per patron per class per calendar date
AttendanceSchema.index(
  { patronBarcode: 1, className: 1, classDate: 1 },
  { unique: true }
);

// Performance query indexes for cohort logs and patron history
AttendanceSchema.index({ patronBarcode: 1, classDate: 1 });
AttendanceSchema.index({ patronId: 1, classDate: 1 });
AttendanceSchema.index({ classType: 1, classDate: 1 });

export const Attendance: Model<IAttendanceDocument> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendanceDocument>('Attendance', AttendanceSchema);

export default Attendance;
