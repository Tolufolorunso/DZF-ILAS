import mongoose, { Document, Model, Schema } from 'mongoose';

export type HoldStatus = 'waiting' | 'ready' | 'fulfilled' | 'cancelled';

export interface IHold {
  _id: mongoose.Types.ObjectId;
  patronId: mongoose.Types.ObjectId;
  patronBarcode: string;
  patronName: string;
  bookId: mongoose.Types.ObjectId;
  bookBarcode: string;
  bookTitle: string;
  status: HoldStatus;
  notifiedAt?: Date;
  expiresAt?: Date;
  fulfilledAt?: Date;
  placedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHoldDocument extends Omit<IHold, '_id'>, Document {}

const HoldSchema = new Schema<IHoldDocument>(
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
      required: [true, 'Book reference ID is required'],
      index: true,
    },
    bookBarcode: {
      type: String,
      required: [true, 'Book barcode is required'],
      trim: true,
      index: true,
    },
    bookTitle: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'ready', 'fulfilled', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    notifiedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    fulfilledAt: {
      type: Date,
    },
    placedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast hold queue lookups
HoldSchema.index({ bookBarcode: 1, status: 1 });
HoldSchema.index({ patronBarcode: 1, status: 1 });
HoldSchema.index({ status: 1, createdAt: 1 });

export const Hold: Model<IHoldDocument> =
  mongoose.models.Hold ||
  mongoose.model<IHoldDocument>('Hold', HoldSchema);

export default Hold;
