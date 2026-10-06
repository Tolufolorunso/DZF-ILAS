import mongoose, { Document, Model, Schema } from 'mongoose';

export type TranscommCategory =
  | 'drnicer-values'
  | 'leadership-basics'
  | 'communication'
  | 'teamwork'
  | 'problem-solving'
  | 'confidence'
  | 'inspiration';

export type DRNICERValue =
  | 'Discipline'
  | 'Respect'
  | 'Nobility'
  | 'Integrity'
  | 'Compassion'
  | 'Excellence'
  | 'Responsibility';

export interface ITranscommArticle {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  category: TranscommCategory;
  drnicerValue?: DRNICERValue;
  readTime?: string;
  excerpt: string;
  content: string;
  tags: string[];
  author: string;
  isActive: boolean;
  viewCount: number;
  library: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITranscommArticleDocument
  extends Omit<ITranscommArticle, '_id'>,
    Document {}

const TranscommArticleSchema = new Schema<ITranscommArticleDocument>(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Article URL slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Article category is required'],
      enum: [
        'drnicer-values',
        'leadership-basics',
        'communication',
        'teamwork',
        'problem-solving',
        'confidence',
        'inspiration',
      ],
      index: true,
    },
    drnicerValue: {
      type: String,
      enum: [
        'Discipline',
        'Respect',
        'Nobility',
        'Integrity',
        'Compassion',
        'Excellence',
        'Responsibility',
      ],
      index: true,
    },
    readTime: {
      type: String,
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Article content is required'],
      minlength: [200, 'Article content must be at least 200 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    library: {
      type: String,
      required: true,
      default: 'AAoJ',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate URL slug from title if not explicitly supplied
TranscommArticleSchema.pre(
  'validate',
  function generateSlug(this: ITranscommArticleDocument) {
    if (!this.slug && this.title) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
  }
);

// Performance and full-text search indexes
TranscommArticleSchema.index({ category: 1, isActive: 1 });
TranscommArticleSchema.index({ drnicerValue: 1, isActive: 1 });
TranscommArticleSchema.index({ createdAt: -1 });
TranscommArticleSchema.index({
  title: 'text',
  excerpt: 'text',
  content: 'text',
});

export const TranscommArticle: Model<ITranscommArticleDocument> =
  mongoose.models.TranscommArticle ||
  mongoose.model<ITranscommArticleDocument>(
    'TranscommArticle',
    TranscommArticleSchema
  );

export default TranscommArticle;
