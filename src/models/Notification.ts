import mongoose, { Document, Model, Schema } from 'mongoose';

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'calendar_milestone'
  | 'account_pending'
  | 'system';

export interface INotification {
  _id: mongoose.Types.ObjectId;
  recipientUsername: string;
  senderUsername: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends Omit<INotification, '_id'>, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientUsername: {
      type: String,
      required: [true, 'Recipient username is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    senderUsername: {
      type: String,
      required: [true, 'Sender username is required'],
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ['task_assigned', 'task_updated', 'calendar_milestone', 'account_pending', 'system'],
      default: 'system',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's unread notifications fast
NotificationSchema.index({ recipientUsername: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default Notification;
