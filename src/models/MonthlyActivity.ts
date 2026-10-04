import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMonthlyActivity {
  _id: mongoose.Types.ObjectId;
  patronId: mongoose.Types.ObjectId;
  patronBarcode: string;
  patronName: string;
  year: number;
  month: number;
  monthYear: string;
  booksCheckedOut: number;
  booksReturned: number;
  classesAttended: number;
  summariesSubmitted: number;
  summariesApproved: number;
  totalPoints: number;
  pointsFromBooks: number;
  pointsFromAttendance: number;
  pointsFromSummaries: number;
  activityScore: number;
  rank: number;
  isActive: boolean;
  library: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMonthlyActivityDocument
  extends Omit<IMonthlyActivity, '_id'>,
    Document {}

const MonthlyActivitySchema = new Schema<IMonthlyActivityDocument>(
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
    year: {
      type: Number,
      required: [true, 'Year is required'],
      index: true,
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
      index: true,
    },
    monthYear: {
      type: String,
      trim: true,
      index: true,
    },
    booksCheckedOut: {
      type: Number,
      default: 0,
    },
    booksReturned: {
      type: Number,
      default: 0,
    },
    classesAttended: {
      type: Number,
      default: 0,
    },
    summariesSubmitted: {
      type: Number,
      default: 0,
    },
    summariesApproved: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    pointsFromBooks: {
      type: Number,
      default: 0,
    },
    pointsFromAttendance: {
      type: Number,
      default: 0,
    },
    pointsFromSummaries: {
      type: Number,
      default: 0,
    },
    activityScore: {
      type: Number,
      default: 0,
      index: true,
    },
    rank: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
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

// Guarantee consistent monthYear string calculation (e.g. '2026-03')
MonthlyActivitySchema.pre('validate', function computeMonthYear(this: IMonthlyActivityDocument) {
  if (!this.monthYear && this.year && this.month) {
    const formattedMonth = String(this.month).padStart(2, '0');
    this.monthYear = `${this.year}-${formattedMonth}`;
  }
});

// Compound unique index ensuring exactly one aggregate record per patron per month
MonthlyActivitySchema.index({ patronId: 1, monthYear: 1 }, { unique: true });
MonthlyActivitySchema.index({ patronId: 1, year: 1, month: 1 });

// Query indexes for leaderboard generation and monthly analytics
MonthlyActivitySchema.index({ year: 1, month: 1, activityScore: -1 });
MonthlyActivitySchema.index({ year: 1, month: 1, isActive: 1 });

export const MonthlyActivity: Model<IMonthlyActivityDocument> =
  mongoose.models.MonthlyActivity ||
  mongoose.model<IMonthlyActivityDocument>(
    'MonthlyActivity',
    MonthlyActivitySchema
  );

export default MonthlyActivity;
