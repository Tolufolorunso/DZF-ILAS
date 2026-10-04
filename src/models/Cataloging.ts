import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBookTitle {
  mainTitle: string;
  subtitle?: string;
}

export interface IBookAuthor {
  mainAuthor: string;
  additionalAuthors?: string[];
}

export interface IPublicationInfo {
  publisher: string;
  place: string;
  year: number;
}

export interface ILoanHistoryEntry {
  checkedOutBy: mongoose.Types.ObjectId;
  checkedOutAt: Date;
  dueDate: Date;
  returnedAt?: Date | null;
  fullname?: string;
  contactNumber?: string;
  barcode?: string;
}

export interface ICataloging {
  _id: mongoose.Types.ObjectId;
  title: IBookTitle;
  author: IBookAuthor;
  publicationInfo: IPublicationInfo;
  ISBN?: string;
  classification: string;
  controlNumber: string;
  indexTermGenre: string[];
  informationSummary?: string;
  language: string;
  physicalDescription?: string;
  barcode: string;
  holdingsInformation?: number;
  image_url?: string;
  isCheckedOut: boolean;
  checkedOutBy?: mongoose.Types.ObjectId | null;
  checkedOutAt?: Date | null;
  copiesTotal: number;
  copiesAvailable: number;
  shelfLocation?: string;
  lastBorrowedBy?: {
    patronId?: mongoose.Types.ObjectId;
    patronBarcode?: string;
    patronName?: string;
    checkedOutAt?: Date;
    dueDate?: Date;
    returnedAt?: Date;
  };
  checkedOutHistory: ILoanHistoryEntry[];
  patronsCheckedOutHistory: ILoanHistoryEntry[];
  library: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICatalogingDocument extends Omit<ICataloging, '_id'>, Document {}

const LoanHistoryEntrySchema = new Schema<ILoanHistoryEntry>(
  {
    checkedOutBy: {
      type: Schema.Types.ObjectId,
      ref: 'Patron',
      required: true,
    },
    checkedOutAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    fullname: String,
    contactNumber: String,
    barcode: String,
  },
  { _id: true }
);

const CatalogingSchema = new Schema<ICatalogingDocument>(
  {
    title: {
      mainTitle: {
        type: String,
        required: [true, 'Main title is required'],
        trim: true,
        index: true,
      },
      subtitle: {
        type: String,
        trim: true,
      },
    },
    author: {
      mainAuthor: {
        type: String,
        required: [true, 'Main author is required'],
        trim: true,
        index: true,
      },
      additionalAuthors: {
        type: [String],
        default: [],
      },
    },
    publicationInfo: {
      publisher: {
        type: String,
        required: true,
      },
      place: {
        type: String,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
    },
    ISBN: {
      type: String,
      default: '',
      trim: true,
    },
    classification: {
      type: String,
      required: [true, 'Dewey Decimal classification is required'],
      trim: true,
      index: true,
    },
    controlNumber: {
      type: String,
      required: [true, 'Accession control number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    indexTermGenre: {
      type: [String],
      default: [],
    },
    informationSummary: String,
    language: {
      type: String,
      required: true,
      default: 'english',
    },
    physicalDescription: String,
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      unique: true,
      trim: true,
      index: true,
    },
    holdingsInformation: {
      type: Number,
      default: 1,
    },
    copiesTotal: {
      type: Number,
      default: 1,
    },
    copiesAvailable: {
      type: Number,
      default: 1,
    },
    shelfLocation: String,
    image_url: String,
    isCheckedOut: {
      type: Boolean,
      default: false,
      index: true,
    },
    checkedOutBy: {
      type: Schema.Types.ObjectId,
      ref: 'Patron',
      default: null,
      index: true,
    },
    checkedOutAt: {
      type: Date,
      default: null,
    },
    lastBorrowedBy: {
      patronId: {
        type: Schema.Types.ObjectId,
        ref: 'Patron',
      },
      patronBarcode: String,
      patronName: String,
      checkedOutAt: Date,
      dueDate: Date,
      returnedAt: Date,
    },
    checkedOutHistory: [LoanHistoryEntrySchema],
    patronsCheckedOutHistory: [LoanHistoryEntrySchema],
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

// Unique & query compound indexes
CatalogingSchema.index({ isCheckedOut: 1, checkedOutBy: 1 });
CatalogingSchema.index({ classification: 1, isCheckedOut: 1 });
CatalogingSchema.index({ 'title.mainTitle': 1, 'author.mainAuthor': 1 });

export const Cataloging: Model<ICatalogingDocument> =
  mongoose.models.Cataloging || mongoose.model<ICatalogingDocument>('Cataloging', CatalogingSchema);

export default Cataloging;
