import mongoose, { Document, Model, Schema } from 'mongoose';

export type LoanStatus = 'borrowed' | 'returned' | 'overdue' | 'lost';

export interface ILibraryAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ILibraryCompetitionResults {
  reading?: {
    isPublished?: boolean;
    publishedAt?: Date;
    publishedBy?: string;
  };
}

export interface ILibraryCompetitionDetails {
  isActive?: boolean;
  title?: string;
  results?: ILibraryCompetitionResults;
}

export interface ILibrary {
  _id: mongoose.Types.ObjectId;
  // Circulation Loan transaction fields
  patronId?: mongoose.Types.ObjectId;
  patronBarcode?: string;
  bookId?: mongoose.Types.ObjectId;
  bookBarcode?: string;
  bookTitle?: string;
  issueDate?: Date;
  dueDate?: Date;
  returnDate?: Date;
  renewalsCount?: number;
  status?: LoanStatus;
  issuedBy?: mongoose.Types.ObjectId;
  receivedBy?: mongoose.Types.ObjectId;
  // Institutional configuration & library settings fields (profile compatibility)
  libraryName?: string;
  address?: ILibraryAddress;
  competitionDetails?: ILibraryCompetitionDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILibraryDocument extends Omit<ILibrary, '_id'>, Document {}

const LibrarySchema = new Schema<ILibraryDocument>(
  {
    // Circulation Loan fields
    patronId: {
      type: Schema.Types.ObjectId,
      ref: 'Patron',
      index: true,
    },
    patronBarcode: {
      type: String,
      trim: true,
      index: true,
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
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    returnDate: {
      type: Date,
    },
    renewalsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue', 'lost'],
      default: 'borrowed',
      index: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    // Institutional library profile & settings fields (replaces legacy Library.js)
    libraryName: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    competitionDetails: {
      isActive: { type: Boolean, default: false },
      title: { type: String, trim: true },
      results: {
        reading: {
          isPublished: { type: Boolean, default: false },
          publishedAt: { type: Date },
          publishedBy: { type: String, default: '', trim: true },
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Performance compound indexes for circulation management and reporting
LibrarySchema.index({ patronId: 1, status: 1 });
LibrarySchema.index({ bookId: 1, status: 1 });
LibrarySchema.index({ dueDate: 1, status: 1 });
LibrarySchema.index({ patronBarcode: 1, status: 1 });
LibrarySchema.index({ bookBarcode: 1, status: 1 });

export const Library: Model<ILibraryDocument> =
  mongoose.models.Library ||
  mongoose.model<ILibraryDocument>('Library', LibrarySchema);

export default Library;
