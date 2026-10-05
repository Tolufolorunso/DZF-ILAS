import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { BookSummary, Patron, Cataloging, MonthlyActivity } from '@/models';
import type { IBookSummaryDocument, BookSummaryStatus } from '@/models/BookSummary';
import type { IPatronDocument } from '@/models/Patron';
import type { ICatalogingDocument } from '@/models/Cataloging';
import { getBookTitleString } from '@/lib/circulation/loan';

interface LeanPatronSummary {
  _id: unknown;
  barcode?: string;
  image_url?: { secure_url?: string };
  studentSchoolInfo?: { currentClass?: string };
}

interface LeanBookSummary {
  _id: unknown;
  barcode?: string;
  image_url?: string;
  author?: { mainAuthor?: string } | string;
  classification?: string;
}

export function getBookAuthorString(book: unknown): string {
  if (!book) return 'Unknown Author';
  const b = book as { author?: string | { mainAuthor?: string } };
  if (typeof b.author === 'string') return b.author;
  if (b.author && typeof b.author === 'object' && b.author.mainAuthor) return b.author.mainAuthor;
  return 'Unknown Author';
}

export function getBookCoverUrl(book: unknown): string | undefined {
  if (!book) return undefined;
  const b = book as { image_url?: string; cover_image?: { secure_url?: string } };
  if (typeof b.image_url === 'string' && b.image_url.trim()) return b.image_url;
  if (b.cover_image && typeof b.cover_image.secure_url === 'string') return b.cover_image.secure_url;
  return undefined;
}

export interface SummarySubmissionInput {
  patronBarcode: string;
  bookBarcode: string;
  summary: string;
  rating: number;
  keyLearnings?: string;
}

export interface SummaryReviewInput {
  action: 'approved' | 'rejected';
  points?: number; // 2 to 10 points
  feedback?: string;
  reviewer: {
    id?: string;
    name: string;
  };
}

export interface SummaryItemDTO {
  id: string;
  patronId: string;
  patronBarcode: string;
  patronName: string;
  patronPhoto?: string;
  patronClass?: string;
  bookId: string;
  bookBarcode: string;
  bookTitle: string;
  bookCover?: string;
  bookAuthor?: string;
  summary: string;
  keyLearnings?: string;
  rating: number;
  status: BookSummaryStatus;
  points: number;
  feedback?: string;
  reviewedBy?: string;
  reviewDate?: string;
  submissionDate: string;
}

export interface SummaryStatsDTO {
  totalSummaries: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalPointsAwarded: number;
}

/**
 * Validates submission parameters before saving.
 */
export async function validateSummarySubmission(
  patronBarcode: string,
  bookBarcode: string,
  summary: string,
  rating: number
): Promise<{
  valid: boolean;
  error?: string;
  patron?: IPatronDocument;
  book?: ICatalogingDocument;
}> {
  await connectDB();

  const cleanPatronBarcode = patronBarcode.trim();
  const cleanBookBarcode = bookBarcode.trim();
  const cleanSummary = summary.trim();

  if (!cleanPatronBarcode) {
    return { valid: false, error: 'Patron barcode is required.' };
  }
  if (!cleanBookBarcode) {
    return { valid: false, error: 'Book barcode is required.' };
  }
  if (!cleanSummary || cleanSummary.length < 100) {
    return {
      valid: false,
      error: `Summary content must be at least 100 characters long (currently ${cleanSummary.length} characters).`,
    };
  }
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return { valid: false, error: 'Rating must be an integer between 1 and 5 stars.' };
  }

  // 1. Verify patron exists and is active
  const patron = await Patron.findOne({
    barcode: cleanPatronBarcode,
    isDeleted: { $ne: true },
  });

  if (!patron) {
    return { valid: false, error: `Patron with barcode "${cleanPatronBarcode}" was not found.` };
  }
  if (!patron.active) {
    return { valid: false, error: `Patron "${patron.firstname} ${patron.surname}" is inactive.` };
  }

  // 2. Verify book exists
  const book = await Cataloging.findOne({
    barcode: cleanBookBarcode,
    isDeleted: { $ne: true },
  });

  if (!book) {
    return { valid: false, error: `Book with barcode "${cleanBookBarcode}" was not found in catalog.` };
  }

  // 3. Check for existing summary for this patron and book
  const existing = await BookSummary.findOne({
    patronBarcode: cleanPatronBarcode,
    bookBarcode: cleanBookBarcode,
  });

  if (existing) {
    return {
      valid: false,
      error: `Patron "${patron.firstname} ${patron.surname}" has already submitted a summary for "${getBookTitleString(book)}" (${existing.status.toUpperCase()}).`,
    };
  }

  return { valid: true, patron, book };
}

/**
 * Submits a new book summary into the moderation queue.
 */
export async function submitBookSummary(
  input: SummarySubmissionInput
): Promise<{ success: boolean; error?: string; summary?: IBookSummaryDocument }> {
  await connectDB();

  const validation = await validateSummarySubmission(
    input.patronBarcode,
    input.bookBarcode,
    input.summary,
    input.rating
  );

  if (!validation.valid || !validation.patron || !validation.book) {
    return { success: false, error: validation.error || 'Validation failed.' };
  }

  const { patron, book } = validation;
  const bookTitle = getBookTitleString(book);
  const now = new Date();

  // Create BookSummary document
  const summaryDoc = new BookSummary({
    patronId: patron._id,
    patronBarcode: patron.barcode,
    patronName: `${patron.firstname} ${patron.surname}`.trim(),
    bookId: book._id,
    bookTitle,
    bookBarcode: book.barcode,
    summary: input.summary.trim(),
    summaryText: input.summary.trim(),
    keyLearnings: input.keyLearnings ? input.keyLearnings.trim() : undefined,
    rating: input.rating,
    submissionDate: now,
    status: 'pending',
    points: 0,
    pointsAwarded: 0,
    library: patron.library || 'AAoJ',
  });

  await summaryDoc.save();

  // Update MonthlyActivity: increment summariesSubmitted
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const formattedMonth = String(currentMonth).padStart(2, '0');
  const monthYear = `${currentYear}-${formattedMonth}`;

  try {
    await MonthlyActivity.findOneAndUpdate(
      { patronId: patron._id, monthYear },
      {
        $setOnInsert: {
          patronBarcode: patron.barcode,
          patronName: `${patron.firstname} ${patron.surname}`.trim(),
          year: currentYear,
          month: currentMonth,
          monthYear,
          library: patron.library || 'AAoJ',
          isActive: true,
        },
        $inc: {
          summariesSubmitted: 1,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    console.warn('Could not update MonthlyActivity for summary submission:', err);
  }

  return { success: true, summary: summaryDoc };
}

/**
 * Reviews (approves or rejects) a submitted book summary.
 * If approved: awards points (+2 to +10) to Patron and updates MonthlyActivity.
 * If rejected: sets status to rejected with mandatory feedback.
 */
export async function reviewBookSummary(
  summaryId: string,
  input: SummaryReviewInput
): Promise<{ success: boolean; error?: string; summary?: IBookSummaryDocument }> {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(summaryId)) {
    return { success: false, error: 'Invalid summary ID format.' };
  }

  const summaryDoc = await BookSummary.findById(summaryId);
  if (!summaryDoc) {
    return { success: false, error: 'Summary record not found.' };
  }

  if (summaryDoc.status !== 'pending') {
    return {
      success: false,
      error: `This summary has already been ${summaryDoc.status.toUpperCase()} and cannot be re-moderated.`,
    };
  }

  const now = new Date();
  const reviewerName = input.reviewer.name || 'Library Staff';

  if (input.action === 'approved') {
    const points = Number(input.points);
    if (isNaN(points) || points < 2 || points > 10 || !Number.isInteger(points)) {
      return {
        success: false,
        error: 'Approved points must be an integer between 2 and 10 points.',
      };
    }

    // 1. Update summary document
    summaryDoc.status = 'approved';
    summaryDoc.points = points;
    summaryDoc.pointsAwarded = points;
    summaryDoc.feedback = input.feedback?.trim() || '';
    summaryDoc.reviewFeedback = input.feedback?.trim() || '';
    summaryDoc.reviewedBy = reviewerName;
    summaryDoc.reviewDate = now;
    summaryDoc.reviewedAt = now;

    await summaryDoc.save();

    // 2. Atomically award points to Patron
    await Patron.findByIdAndUpdate(summaryDoc.patronId, {
      $inc: { points },
    });

    // 3. Atomically update MonthlyActivity for patron
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const formattedMonth = String(currentMonth).padStart(2, '0');
    const monthYear = `${currentYear}-${formattedMonth}`;

    try {
      await MonthlyActivity.findOneAndUpdate(
        { patronId: summaryDoc.patronId, monthYear },
        {
          $setOnInsert: {
            patronBarcode: summaryDoc.patronBarcode,
            patronName: summaryDoc.patronName,
            year: currentYear,
            month: currentMonth,
            monthYear,
            library: summaryDoc.library || 'AAoJ',
            isActive: true,
          },
          $inc: {
            summariesApproved: 1,
            pointsFromSummaries: points,
            totalPoints: points,
            activityScore: points,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (err) {
      console.warn('Could not update MonthlyActivity for summary approval:', err);
    }

    return { success: true, summary: summaryDoc };
  } else if (input.action === 'rejected') {
    const feedback = input.feedback?.trim();
    if (!feedback) {
      return {
        success: false,
        error: 'Constructive feedback is required when rejecting a book summary.',
      };
    }

    // Update summary document to rejected
    summaryDoc.status = 'rejected';
    summaryDoc.points = 0;
    summaryDoc.pointsAwarded = 0;
    summaryDoc.feedback = feedback;
    summaryDoc.reviewFeedback = feedback;
    summaryDoc.reviewedBy = reviewerName;
    summaryDoc.reviewDate = now;
    summaryDoc.reviewedAt = now;

    await summaryDoc.save();

    return { success: true, summary: summaryDoc };
  } else {
    return { success: false, error: 'Invalid moderation action. Must be "approved" or "rejected".' };
  }
}

/**
 * Returns pending summaries queue for librarians with populated patron photo and book cover.
 */
export async function getPendingSummariesQueue(): Promise<SummaryItemDTO[]> {
  await connectDB();

  const rawSummaries = await BookSummary.find({ status: 'pending' })
    .sort({ submissionDate: 1 }) // FIFO: oldest submissions first
    .lean();

  if (!rawSummaries.length) return [];

  // Populate Patron and Cataloging metadata
  const patronIds = rawSummaries.map((s) => s.patronId);
  const bookIds = rawSummaries.map((s) => s.bookId);

  const [patrons, books] = await Promise.all([
    Patron.find({ _id: { $in: patronIds } }, 'image_url studentSchoolInfo barcode').lean<LeanPatronSummary[]>(),
    Cataloging.find({ _id: { $in: bookIds } }, 'image_url author classification barcode').lean<LeanBookSummary[]>(),
  ]);

  const patronMap = new Map<string, LeanPatronSummary>(patrons.map((p) => [String(p._id), p]));
  const bookMap = new Map<string, LeanBookSummary>(books.map((b) => [String(b._id), b]));

  return rawSummaries.map((s) => {
    const p = patronMap.get(String(s.patronId));
    const b = bookMap.get(String(s.bookId));

    return {
      id: String(s._id),
      patronId: String(s.patronId),
      patronBarcode: s.patronBarcode,
      patronName: s.patronName,
      patronPhoto: p?.image_url?.secure_url,
      patronClass: p?.studentSchoolInfo?.currentClass,
      bookId: String(s.bookId),
      bookBarcode: s.bookBarcode,
      bookTitle: s.bookTitle,
      bookCover: getBookCoverUrl(b),
      bookAuthor: getBookAuthorString(b),
      summary: s.summary,
      keyLearnings: s.keyLearnings,
      rating: s.rating || 5,
      status: s.status,
      points: s.points || 0,
      feedback: s.feedback,
      reviewedBy: s.reviewedBy ? String(s.reviewedBy) : undefined,
      reviewDate: s.reviewDate ? s.reviewDate.toISOString() : undefined,
      submissionDate: s.submissionDate ? s.submissionDate.toISOString() : new Date().toISOString(),
    };
  });
}

/**
 * Returns filterable, paginated list of summaries.
 */
export async function getSummariesList(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  summaries: SummaryItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  await connectDB();

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (params.status && params.status !== 'all') {
    query.status = params.status;
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    query.$or = [
      { patronName: { $regex: q, $options: 'i' } },
      { patronBarcode: { $regex: q, $options: 'i' } },
      { bookTitle: { $regex: q, $options: 'i' } },
      { bookBarcode: { $regex: q, $options: 'i' } },
      { summary: { $regex: q, $options: 'i' } },
    ];
  }

  const [total, rawSummaries] = await Promise.all([
    BookSummary.countDocuments(query),
    BookSummary.find(query).sort({ submissionDate: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const patronIds = rawSummaries.map((s) => s.patronId);
  const bookIds = rawSummaries.map((s) => s.bookId);

  const [patrons, books] = await Promise.all([
    Patron.find({ _id: { $in: patronIds } }, 'image_url studentSchoolInfo').lean<LeanPatronSummary[]>(),
    Cataloging.find({ _id: { $in: bookIds } }, 'image_url author').lean<LeanBookSummary[]>(),
  ]);

  const patronMap = new Map<string, LeanPatronSummary>(patrons.map((p) => [String(p._id), p]));
  const bookMap = new Map<string, LeanBookSummary>(books.map((b) => [String(b._id), b]));

  const summaries: SummaryItemDTO[] = rawSummaries.map((s) => {
    const p = patronMap.get(String(s.patronId));
    const b = bookMap.get(String(s.bookId));

    return {
      id: String(s._id),
      patronId: String(s.patronId),
      patronBarcode: s.patronBarcode,
      patronName: s.patronName,
      patronPhoto: p?.image_url?.secure_url,
      patronClass: p?.studentSchoolInfo?.currentClass,
      bookId: String(s.bookId),
      bookBarcode: s.bookBarcode,
      bookTitle: s.bookTitle,
      bookCover: getBookCoverUrl(b),
      bookAuthor: getBookAuthorString(b),
      summary: s.summary,
      keyLearnings: s.keyLearnings,
      rating: s.rating || 5,
      status: s.status,
      points: s.points || 0,
      feedback: s.feedback,
      reviewedBy: s.reviewedBy ? String(s.reviewedBy) : undefined,
      reviewDate: s.reviewDate ? s.reviewDate.toISOString() : undefined,
      submissionDate: s.submissionDate ? s.submissionDate.toISOString() : new Date().toISOString(),
    };
  });

  return {
    summaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Returns summary metrics and point totals.
 */
export async function getSummaryStats(): Promise<SummaryStatsDTO> {
  await connectDB();

  const [counts, pointsAgg] = await Promise.all([
    BookSummary.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    BookSummary.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' },
        },
      },
    ]),
  ]);

  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  for (const c of counts) {
    if (c._id === 'pending') pendingCount = c.count;
    else if (c._id === 'approved') approvedCount = c.count;
    else if (c._id === 'rejected') rejectedCount = c.count;
  }

  const totalPointsAwarded = pointsAgg.length > 0 ? pointsAgg[0].totalPoints || 0 : 0;
  const totalSummaries = pendingCount + approvedCount + rejectedCount;

  return {
    totalSummaries,
    pendingCount,
    approvedCount,
    rejectedCount,
    totalPointsAwarded,
  };
}

/**
 * Retrieves a single summary record with full details by ID.
 */
export async function getSummaryById(id: string): Promise<SummaryItemDTO | null> {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const s = await BookSummary.findById(id).lean();
  if (!s) return null;

  const [p, b] = await Promise.all([
    Patron.findById(s.patronId, 'image_url studentSchoolInfo points').lean(),
    Cataloging.findById(s.bookId, 'image_url author classification informationSummary').lean(),
  ]);

  return {
    id: String(s._id),
    patronId: String(s.patronId),
    patronBarcode: s.patronBarcode,
    patronName: s.patronName,
    patronPhoto: p?.image_url?.secure_url,
    patronClass: p?.studentSchoolInfo?.currentClass,
    bookId: String(s.bookId),
    bookBarcode: s.bookBarcode,
    bookTitle: s.bookTitle,
    bookCover: getBookCoverUrl(b),
    bookAuthor: getBookAuthorString(b),
    summary: s.summary,
    keyLearnings: s.keyLearnings,
    rating: s.rating || 5,
    status: s.status,
    points: s.points || 0,
    feedback: s.feedback,
    reviewedBy: s.reviewedBy ? String(s.reviewedBy) : undefined,
    reviewDate: s.reviewDate ? s.reviewDate.toISOString() : undefined,
    submissionDate: s.submissionDate ? s.submissionDate.toISOString() : new Date().toISOString(),
  };
}
