import mongoose, { Document, Model, Schema } from 'mongoose';

export type RequisitionStatus =
  | 'pending'
  | 'approved'
  | 'done'
  | 'received'
  | 'rejected';

export interface IRequisitionComment {
  comment: string;
  commenter: string;
  targetUser: string;
  read: boolean;
  createdAt?: Date;
}

export interface IRequisition {
  _id: mongoose.Types.ObjectId;
  item: string;
  description?: string;
  rationale: string;
  quantity: number;
  price?: number;
  estimatedCost?: number;
  comments: IRequisitionComment[];
  createdBy: string;
  status: RequisitionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRequisitionDocument
  extends Omit<IRequisition, '_id'>,
    Document {}

const RequisitionCommentSchema = new Schema<IRequisitionComment>(
  {
    comment: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
    commenter: {
      type: String,
      required: [true, 'Commenter identity is required'],
      trim: true,
    },
    targetUser: {
      type: String,
      required: [true, 'Target user is required'],
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const RequisitionSchema = new Schema<IRequisitionDocument>(
  {
    item: {
      type: String,
      required: [true, 'Requisition item name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    rationale: {
      type: String,
      required: [true, 'Justification / rationale is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    estimatedCost: {
      type: Number,
      min: [0, 'Estimated cost cannot be negative'],
    },
    comments: {
      type: [RequisitionCommentSchema],
      default: [],
    },
    createdBy: {
      type: String,
      required: [true, 'Creator identifier is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'done', 'received', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Backward-compatibility support for legacy 'quautity' typo
RequisitionSchema.pre(
  'validate',
  function handleLegacyTypo(this: IRequisitionDocument) {
    const raw = this as unknown as Record<string, unknown>;
    if (this.quantity === undefined && raw.quautity !== undefined) {
      this.quantity = Number(raw.quautity) || 1;
    }
  }
);

// Query indexes for financial and approval workflows
RequisitionSchema.index({ status: 1, createdAt: -1 });
RequisitionSchema.index({ createdBy: 1, status: 1 });

export const Requisition: Model<IRequisitionDocument> =
  mongoose.models.Requisition ||
  mongoose.model<IRequisitionDocument>('Requisition', RequisitionSchema);

export default Requisition;
