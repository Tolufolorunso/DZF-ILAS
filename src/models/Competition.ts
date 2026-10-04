import mongoose, { Document, Model, Schema } from 'mongoose';

export type CompetitionType =
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'essay'
  | 'spelling'
  | 'listening'
  | 'other';

export type CompetitionStatus = 'checked_out' | 'checked_in';

export interface ICompetition {
  _id: mongoose.Types.ObjectId;
  competitionType: CompetitionType;
  title: string;
  category?: string; // Academic category: P1-3, P4-6, JSS1-3, SS1-3
  sessionKey: string;
  patronId: mongoose.Types.ObjectId;
  patronBarcode: string;
  patronName: string;
  bookId?: mongoose.Types.ObjectId;
  bookBarcode?: string;
  bookTitle: string;
  bookTitleKey?: string;
  checkoutDate: Date;
  checkedOutBy?: string;
  status: CompetitionStatus;
  checkinDate?: Date;
  summary?: string;
  grade?: number | null;
  feedback?: string;
  teacherVerified: boolean;
  teacherVerifiedBy?: string;
  gradedBy?: string;
  library: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompetitionDocument
  extends Omit<ICompetition, '_id'>,
    Document {}

const CompetitionSchema = new Schema<ICompetitionDocument>(
  {
    competitionType: {
      type: String,
      enum: [
        'reading',
        'writing',
        'speaking',
        'essay',
        'spelling',
        'listening',
        'other',
      ],
      default: 'reading',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Reading Competition',
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    sessionKey: {
      type: String,
      required: [true, 'Session key is required'],
      trim: true,
      index: true,
    },
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
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Cataloging',
      index: true,
    },
    bookBarcode: {
      type: String,
      trim: true,
      index: true,
    },
    bookTitle: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    bookTitleKey: {
      type: String,
      trim: true,
    },
    checkoutDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    checkedOutBy: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['checked_out', 'checked_in'],
      default: 'checked_out',
      required: true,
      index: true,
    },
    checkinDate: {
      type: Date,
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    grade: {
      type: Number,
      min: [0, 'Minimum grade is 0'],
      max: [100, 'Maximum grade is 100'],
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    teacherVerified: {
      type: Boolean,
      default: false,
    },
    teacherVerifiedBy: {
      type: String,
      trim: true,
      default: '',
    },
    gradedBy: {
      type: String,
      trim: true,
      default: '',
    },
    library: {
      type: String,
      default: 'AAoJ',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique indexes with partialFilterExpression for collision-free competition entries
CompetitionSchema.index(
  { competitionType: 1, sessionKey: 1, patronBarcode: 1, bookBarcode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sessionKey: { $exists: true },
      patronBarcode: { $exists: true },
      bookBarcode: { $exists: true },
    },
  }
);

CompetitionSchema.index(
  { competitionType: 1, sessionKey: 1, patronBarcode: 1, bookTitleKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sessionKey: { $exists: true },
      patronBarcode: { $exists: true },
      bookTitleKey: { $exists: true },
    },
  }
);

CompetitionSchema.index({ competitionType: 1, sessionKey: 1, status: 1 });
CompetitionSchema.index({ competitionType: 1, sessionKey: 1, patronBarcode: 1 });

export const Competition: Model<ICompetitionDocument> =
  mongoose.models.Competition ||
  mongoose.model<ICompetitionDocument>('Competition', CompetitionSchema);

export default Competition;
