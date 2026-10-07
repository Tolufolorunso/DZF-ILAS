import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole =
  | 'ima'
  | 'country_manager'
  | 'admin'
  | 'asst_admin'
  | 'ict'
  | 'librarian'
  | 'intern'
  | 'cohort_lead'
  | 'transcomm_author'
  | 'facility';

export interface IUserImage {
  secure_url?: string;
  public_id?: string;
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  name: string;
  password: string;
  phone: string;
  active: boolean;
  role: UserRole;
  dateOfBirth?: Date;
  birthMonth?: number;
  birthDay?: number;
  userImg?: IUserImage;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Staff full name is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    phone: {
      type: String,
      default: '0800000000',
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    role: {
      type: String,
      enum: [
        'ima',
        'country_manager',
        'admin',
        'asst_admin',
        'ict',
        'librarian',
        'intern',
        'cohort_lead',
        'transcomm_author',
        'facility',
      ],
      default: 'librarian',
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    birthMonth: {
      type: Number,
      min: 1,
      max: 12,
    },
    birthDay: {
      type: Number,
      min: 1,
      max: 31,
    },
    userImg: {
      secure_url: { type: String },
      public_id: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for staff lookup and RBAC queries
UserSchema.index({ role: 1, active: 1 });

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
