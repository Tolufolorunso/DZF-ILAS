import mongoose, { Document, Model, Schema } from 'mongoose';

export type InventoryCondition = 'new' | 'good' | 'fair' | 'poor' | 'damaged';
export type InventoryStatus = 'available' | 'checked_out' | 'maintenance' | 'lost';

export interface IInventoryImage {
  secure_url?: string;
  public_id?: string;
}

export interface IInventory {
  _id: mongoose.Types.ObjectId;
  name: string;
  dept: string;
  quantity: number;
  barcode: string;
  itemBarcode?: string;
  bookId?: mongoose.Types.ObjectId;
  condition?: InventoryCondition;
  status?: InventoryStatus;
  acquisitionDate?: Date;
  addedBy?: string;
  image?: IInventoryImage;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryDocument extends Omit<IInventory, '_id'>, Document {}

const InventorySchema = new Schema<IInventoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Inventory item name is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    dept: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      unique: true,
      trim: true,
      index: true,
    },
    itemBarcode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Cataloging',
      index: true,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor', 'damaged'],
      default: 'good',
      index: true,
    },
    status: {
      type: String,
      enum: ['available', 'checked_out', 'maintenance', 'lost'],
      default: 'available',
      index: true,
    },
    acquisitionDate: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: String,
      trim: true,
    },
    image: {
      secure_url: { type: String },
      public_id: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for departmental and status inventory searches
InventorySchema.index({ dept: 1, status: 1 });
InventorySchema.index({ condition: 1, status: 1 });

export const Inventory: Model<IInventoryDocument> =
  mongoose.models.Inventory ||
  mongoose.model<IInventoryDocument>('Inventory', InventorySchema);

export default Inventory;
