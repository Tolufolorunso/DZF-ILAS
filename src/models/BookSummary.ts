import mongoose, { Document, Model, Schema } from 'mongoose';

export type BookSummaryStatus = 'pending' | 'approved' | 'rejected';

export interface IBookSummary {
  _id: mongoose.Types.ObjectId;
  patronId: mongoose.Types.ObjectId;
  patronBarcode: string;
  patronName: string;
  bookId: mongoose.Types.ObjectId;
  bookTitle: string;
  bookBarcode: string;
  summary: string;
  summaryText?: string;
  keyLearnings?: string;
  rating: number;
  submissionDate: Date;
  reviewedBy?: mongoose.Types.ObjectId | string;
  reviewDate?: Date;
  reviewedAt?: Date;
  status: BookSummaryStatus;
  points: number;
  pointsAwarded?: number;
  feedback?: string;
  reviewFeedback?: string;
  library: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookSummaryDocument
  extends Omit<IBookSummary, '_id'>,
    Document {}

const BookSummarySchema = new Schema<IBookSummaryDocument>(
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
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Cataloging',
      required: [true, 'Catalog book reference ID is required'],
      index: true,
    },
    bookTitle: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    bookBarcode: {
      type: String,
      required: [true, 'Book barcode is required'],
      trim: true,
      index: true,
    },
    summary: {
      type: String,
      required: [true, 'Summary content is required'],
      default: `This book summary record was created by library staff to acknowledge the patron's reading activity and award points for their engagement with library materials. The patron has successfully completed reading this book and demonstrated their commitment to literacy and learning.`,
      minlength: [100, 'Summary must be at least 100 characters long'],
    },
    summaryText: {
      type: String,
      trim: true,
    },
    keyLearnings: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
      default: 5,
      required: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.Mixed, // Supports ObjectId ref or reviewer name string
    },
    reviewDate: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      trim: true,
    },
    reviewFeedback: {
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

// Compound unique index ensuring one summary per patron per book
BookSummarySchema.index({ patronBarcode: 1, bookBarcode: 1 }, { unique: true });

// Query indexes for patron submission history and moderation workflows
BookSummarySchema.index({ patronBarcode: 1, submissionDate: 1 });
BookSummarySchema.index({ status: 1, submissionDate: 1 });

export const BookSummary: Model<IBookSummaryDocument> =
  mongoose.models.BookSummary ||
  mongoose.model<IBookSummaryDocument>('BookSummary', BookSummarySchema);

export default BookSummary;
