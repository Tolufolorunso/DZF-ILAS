import mongoose, { Document, Model, Schema } from 'mongoose';

export type TaskStatus = 'todo' | 'inProgress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface ITaskUserRef {
  name: string;
  username: string;
}

export interface ITaskCommentUserRef extends ITaskUserRef {
  role?: string;
}

export interface ITaskComment {
  _id?: mongoose.Types.ObjectId | string;
  commenter: ITaskCommentUserRef;
  commentDate: Date;
  commentText: string;
}

export interface ITaskLike {
  name: string;
  username: string;
}

export interface ITask {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate?: Date;
  assignedBy: ITaskUserRef;
  assignedTo: ITaskUserRef;
  targetGroup?: string;
  assignedByRole?: string;
  assignedToRole?: string;
  isSelfAssigned?: boolean;
  isPrivate?: boolean;
  archivedAt?: Date;
  inProgressAt?: Date;
  lastTodoRemindedAt?: Date;
  lastInProgressRemindedAt?: Date;
  status: TaskStatus;
  priority: TaskPriority;
  comments: ITaskComment[];
  likes: ITaskLike[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskDocument extends Omit<ITask, '_id'>, Document {}

const TaskUserRefSchema = new Schema<ITaskUserRef>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const TaskCommentUserRefSchema = new Schema<ITaskCommentUserRef>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const TaskCommentSchema = new Schema<ITaskComment>(
  {
    commenter: {
      type: TaskCommentUserRefSchema,
      required: true,
    },
    commentDate: {
      type: Date,
      default: Date.now,
    },
    commentText: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
  },
  { _id: true }
);

const TaskLikeSchema = new Schema<ITaskLike>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    assignedBy: {
      type: TaskUserRefSchema,
      required: true,
    },
    assignedTo: {
      type: TaskUserRefSchema,
      required: true,
    },
    targetGroup: {
      type: String,
      trim: true,
      index: true,
    },
    assignedByRole: {
      type: String,
      trim: true,
    },
    assignedToRole: {
      type: String,
      trim: true,
    },
    isSelfAssigned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      index: true,
    },
    inProgressAt: {
      type: Date,
    },
    lastTodoRemindedAt: {
      type: Date,
    },
    lastInProgressRemindedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['todo', 'inProgress', 'completed', 'archived'],
      default: 'todo', // Corrected from legacy 'To Do' enum mismatch
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    comments: {
      type: [TaskCommentSchema],
      default: [],
    },
    likes: {
      type: [TaskLikeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for staff dashboard task lists and due date sorting
TaskSchema.index({ 'assignedTo.username': 1, status: 1 });
TaskSchema.index({ 'assignedBy.username': 1, status: 1 });
TaskSchema.index({ targetGroup: 1, status: 1 });
TaskSchema.index({ isSelfAssigned: 1, 'assignedTo.username': 1 });
TaskSchema.index({ status: 1, priority: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });
// Auto-expire archived tasks after 30 days (2,592,000 seconds)
TaskSchema.index(
  { archivedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { archivedAt: { $exists: true, $ne: null } } }
);

export const Task: Model<ITaskDocument> =
  mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);

export default Task;
