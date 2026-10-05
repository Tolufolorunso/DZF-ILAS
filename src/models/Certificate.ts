import mongoose, { Document, Model, Schema } from 'mongoose';

export type CertificateTemplateType =
  | 'digital_literacy'
  | 'reading_competition'
  | 'library_merit'
  | 'custom';

export interface ISignatory {
  name: string;
  title: string;
  signatureSvg?: string;
}

export interface ICertificate {
  _id: mongoose.Types.ObjectId;
  certificateCode: string; // e.g. 'DZF-CERT-2026-0001'
  templateType: CertificateTemplateType;
  title: string;
  recipientName: string;
  recipientBarcode?: string;
  recipientCohort?: string;
  recipientCategory?: string;
  awardDescription: string;
  issueDate: Date;
  primarySignatory: ISignatory;
  secondarySignatory: ISignatory;
  goldSealText?: string;
  isRevoked: boolean;
  issuedBy: string;
  library: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICertificateDocument
  extends Omit<ICertificate, '_id'>,
    Document {}

const SignatorySchema = new Schema<ISignatory>(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    signatureSvg: { type: String, trim: true },
  },
  { _id: false }
);

const CertificateSchema = new Schema<ICertificateDocument>(
  {
    certificateCode: {
      type: String,
      required: [true, 'Certificate code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    templateType: {
      type: String,
      enum: ['digital_literacy', 'reading_competition', 'library_merit', 'custom'],
      default: 'digital_literacy',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Award title is required'],
      trim: true,
      default: 'Certificate of Completion',
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
      index: true,
    },
    recipientBarcode: {
      type: String,
      trim: true,
      index: true,
    },
    recipientCohort: {
      type: String,
      trim: true,
    },
    recipientCategory: {
      type: String,
      trim: true,
    },
    awardDescription: {
      type: String,
      required: [true, 'Award description citation is required'],
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    primarySignatory: {
      type: SignatorySchema,
      required: true,
      default: () => ({
        name: 'Dr. T. Folorunso',
        title: 'Director, Dzuels Educational Foundation',
      }),
    },
    secondarySignatory: {
      type: SignatorySchema,
      required: true,
      default: () => ({
        name: 'Academy Lead',
        title: 'Lead Instructor / Head Librarian',
      }),
    },
    goldSealText: {
      type: String,
      trim: true,
      default: 'DZUELS EDUCATIONAL FOUNDATION • OFFICIAL SEAL • 2026',
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    issuedBy: {
      type: String,
      required: [true, 'Issued by staff username/name is required'],
      trim: true,
    },
    library: {
      type: String,
      default: 'Dzuels Educational Foundation',
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries by template and issue date
CertificateSchema.index({ templateType: 1, issueDate: -1 });

export const Certificate: Model<ICertificateDocument> =
  (mongoose.models.Certificate as unknown as Model<ICertificateDocument>) ||
  mongoose.model<ICertificateDocument>('Certificate', CertificateSchema);

export default Certificate;
