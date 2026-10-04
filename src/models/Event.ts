import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEvent {
  _id: mongoose.Types.ObjectId;
  eventName: string;
  title?: string;
  attendee?: string;
  eventDate: Date;
  eventDetail?: string;
  description?: string;
  location?: string;
  targetAudience?: string;
  arrivalTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventDocument extends Omit<IEvent, '_id'>, Document {}

const EventSchema = new Schema<IEventDocument>(
  {
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    attendee: {
      type: String,
      trim: true,
      lowercase: true,
    },
    eventDate: {
      type: Date,
      default: Date.now,
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
    },
    targetAudience: {
      type: String,
      trim: true,
    },
    arrivalTime: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Synchronize title and eventName if only one is provided
EventSchema.pre('validate', function syncTitles(this: IEventDocument) {
  if (!this.title && this.eventName) {
    this.title = this.eventName;
  } else if (!this.eventName && this.title) {
    this.eventName = this.title.toLowerCase();
  }
});

// Indexes for event calendar queries
EventSchema.index({ eventDate: 1, eventName: 1 });

export const Event: Model<IEventDocument> =
  mongoose.models.Event || mongoose.model<IEventDocument>('Event', EventSchema);

export default Event;
