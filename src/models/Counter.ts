import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICounter {
  _id: string; // The sequence key, e.g. 'patron_barcode', 'catalog_control', etc.
  seq: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICounterDocument extends Document<string> {
  _id: string;
  seq: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICounterModel extends Model<ICounterDocument> {
  getNextSequence(
    sequenceName: string,
    prefix?: string,
    padLength?: number
  ): Promise<string>;
}

const CounterSchema = new Schema<ICounterDocument, ICounterModel>(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Atomically increments the named sequence and returns a formatted, zero-padded identifier.
 * Completely eliminates race conditions and duplicate ID collisions from countDocuments().
 *
 * @param sequenceName - Unique identifier for the counter (e.g. 'patron_barcode', 'requisition')
 * @param prefix - Optional prefix to prepend to the sequence (e.g. 'AAoJ-2026-')
 * @param padLength - Number of digits to pad (defaults to 4)
 * @returns Formatted sequence string, e.g. 'AAoJ-2026-0001'
 */
CounterSchema.statics.getNextSequence = async function (
  sequenceName: string,
  prefix: string = '',
  padLength: number = 4
): Promise<string> {
  const record = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const formattedSeq = String(record.seq).padStart(padLength, '0');
  return prefix ? `${prefix}${formattedSeq}` : formattedSeq;
};

export const Counter: ICounterModel =
  (mongoose.models.Counter as unknown as ICounterModel) ||
  mongoose.model<ICounterDocument, ICounterModel>('Counter', CounterSchema);

export default Counter;
