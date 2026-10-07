import mongoose, { Document, Model, Schema } from 'mongoose';

export type EventCategory = 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';

export interface IEventAlertsSent {
  oneMonth?: boolean;
  twoWeeks?: boolean;
  oneWeek?: boolean;
}

export interface IEvent {
  _id: mongoose.Types.ObjectId;
  eventName: string;
  title?: string;
  attendee?: string;
  eventDate: Date;
  academicYear?: number;
  category?: EventCategory;
  eventDetail?: string;
  description?: string;
  location?: string;
  targetAudience?: string;
  arrivalTime?: string;
  alertsSent?: IEventAlertsSent;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventDocument extends Omit<IEvent, '_id'>, Document {}

const AlertsSentSchema = new Schema<IEventAlertsSent>(
  {
    oneMonth: { type: Boolean, default: false },
    twoWeeks: { type: Boolean, default: false },
    oneWeek: { type: Boolean, default: false },
  },
  { _id: false }
);

const EventSchema = new Schema<IEventDocument>(
  {
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    attendee: {
      type: String,
      trim: true,
    },
    eventDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    academicYear: {
      type: Number,
      index: true,
    },
    category: {
      type: String,
      enum: ['assembly', 'workshop', 'competition', 'holiday', 'meeting', 'general'],
      default: 'general',
      index: true,
    },
    eventDetail: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'DZF Learning Center',
    },
    targetAudience: {
      type: String,
      trim: true,
      default: 'All Students & Staff',
    },
    arrivalTime: {
      type: String,
      trim: true,
      default: '09:00 AM',
    },
    alertsSent: {
      type: AlertsSentSchema,
      default: () => ({ oneMonth: false, twoWeeks: false, oneWeek: false }),
    },
  },
  {
    timestamps: true,
  }
);

// Synchronize title, eventName, and academicYear
EventSchema.pre('validate', function syncTitles(this: IEventDocument) {
  if (!this.title && this.eventName) {
    this.title = this.eventName;
  } else if (!this.eventName && this.title) {
    this.eventName = this.title;
  }
  if (this.eventDate && !this.academicYear) {
    this.academicYear = new Date(this.eventDate).getFullYear();
  }
});

// Compound indexes for event calendar queries
EventSchema.index({ eventDate: 1, eventName: 1 });
EventSchema.index({ academicYear: 1, eventDate: 1 });

export const Event: Model<IEventDocument> =
  mongoose.models.Event || mongoose.model<IEventDocument>('Event', EventSchema);

export default Event;
