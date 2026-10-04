import mongoose, { Document, Model, Schema } from 'mongoose';

export type PatronType = 'student' | 'teacher' | 'staff' | 'guest';
export type Gender = 'male' | 'female';

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ISchoolInfo {
  schoolName?: string;
  schoolAddress?: string;
  headOfSchool?: string;
  currentClass?: string;
  schoolEmail?: string;
  schoolPhoneNumber?: string;
}

export interface IEmployerInfo {
  employerName?: string;
  schoolName?: string;
  schoolAddress?: string;
  headOfSchool?: string;
  schoolEmail?: string;
  schoolPhoneNumber?: string;
}

export interface IParentInfo {
  parentName?: string;
  parentAddress?: string;
  parentPhoneNumber?: string;
  relationshipToPatron?: string;
  parentEmail?: string;
}

export interface ICloudinaryImage {
  secure_url?: string;
  public_id?: string;
}

export interface IPatron {
  _id: mongoose.Types.ObjectId;
  firstname: string;
  surname: string;
  middlename?: string;
  email?: string;
  phoneNumber?: string;
  gender?: Gender;
  address?: IAddress;
  dateOfBirth?: Date;
  patronType: PatronType;
  barcode: string;
  registeredDate: Date;
  library: string;
  active: boolean;
  isDeleted: boolean;
  patronExpiryDate?: Date;
  isPatronExpiry?: boolean;
  studentSchoolInfo?: ISchoolInfo;
  employerInfo?: IEmployerInfo;
  parentInfo?: IParentInfo;
  image_url?: ICloudinaryImage;
  messagePreferences: string[];
  registeredBy: string;
  hasBorrowedBook: boolean;
  points: number;
  lastBorrowedItem?: {
    itemId?: mongoose.Types.ObjectId;
    itemTitle?: string;
    itemSubTitle?: string;
    itemBarcode?: string;
    checkoutDate?: Date;
    dueDate?: Date;
    returnedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatronDocument extends Omit<IPatron, '_id'>, Document {}

const PatronSchema = new Schema<IPatronDocument>(
  {
    firstname: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    surname: {
      type: String,
      required: [true, 'Surname is required'],
      trim: true,
    },
    middlename: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
    },
    dateOfBirth: Date,
    patronType: {
      type: String,
      enum: ['student', 'teacher', 'staff', 'guest'],
      default: 'student',
      required: true,
      index: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      unique: true,
      trim: true,
      index: true,
    },
    registeredDate: {
      type: Date,
      default: Date.now,
    },
    library: {
      type: String,
      required: true,
      default: 'AAoJ',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    patronExpiryDate: Date,
    isPatronExpiry: {
      type: Boolean,
      default: false,
    },
    employerInfo: {
      employerName: String,
      schoolName: String,
      schoolAddress: String,
      headOfSchool: String,
      schoolEmail: String,
      schoolPhoneNumber: String,
    },
    studentSchoolInfo: {
      schoolName: String,
      schoolAddress: String,
      headOfSchool: String,
      currentClass: String,
      schoolEmail: String,
      schoolPhoneNumber: String,
    },
    parentInfo: {
      parentName: String,
      parentAddress: String,
      parentPhoneNumber: String,
      relationshipToPatron: String,
      parentEmail: String,
    },
    image_url: {
      secure_url: String,
      public_id: String,
    },
    messagePreferences: {
      type: [String],
      default: ['email'],
    },
    registeredBy: {
      type: String,
      required: true,
      default: 'Admin',
    },
    hasBorrowedBook: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
      index: true,
    },
    lastBorrowedItem: {
      itemId: {
        type: Schema.Types.ObjectId,
        ref: 'Cataloging',
      },
      itemTitle: String,
      itemSubTitle: String,
      itemBarcode: String,
      checkoutDate: Date,
      dueDate: Date,
      returnedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes
PatronSchema.index({ active: 1, isDeleted: 1 });
PatronSchema.index({ patronType: 1, isDeleted: 1 });
PatronSchema.index({ points: -1, active: 1 });
PatronSchema.index({ firstname: 1, surname: 1 });

export const Patron: Model<IPatronDocument> =
  mongoose.models.Patron || mongoose.model<IPatronDocument>('Patron', PatronSchema);

export default Patron;
