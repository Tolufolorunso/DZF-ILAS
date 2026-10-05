import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Competition, ICompetition } from '@/models/Competition';
import { Library } from '@/models/Library';
import { Patron } from '@/models/Patron';
import { Cataloging } from '@/models/Cataloging';
import {
  CompetitionCategoryCode,
  COMPETITION_CATEGORIES,
  ICompetitionLeaderboardEntry,
  ICompetitionPodiumEntry,
  ICompetitionResultData,
  ICompetitionSessionInfo,
  ICreateCompetitionCheckoutInput,
  IProcessCompetitionCheckinInput,
  IUpdateCompetitionEntryInput,
  ICompetitionEntryItem,
} from './types';

/**
 * Standard default competition session key and title
 */
export const DEFAULT_SESSION_KEY = 'reading-competition-2026';
export const DEFAULT_SESSION_TITLE = 'Reading Competition 2026';

/**
 * Automatically map student class levels to competition categories:
 * - Senior Secondary: SS1 – SS3 -> 'SS1-3'
 * - Junior Secondary: JSS1 – JSS3 -> 'JSS1-3'
 * - Upper Primary: Primary 4 – Primary 6 / Basic 4 - 6 -> 'P4-6'
 * - Lower Primary: Primary 1 – Primary 3 / Basic 1 - 3 -> 'P1-3'
 */
export function resolveCompetitionCategory(
  currentClass?: string
): CompetitionCategoryCode | null {
  if (!currentClass || typeof currentClass !== 'string') {
    return null;
  }

  const raw = currentClass.trim().toLowerCase();

  // Senior Secondary: SS1 - SS3, SSS1 - SSS3, Senior Secondary
  if (
    /\b(ss|sss)\s*[1-3]\b/i.test(raw) ||
    raw.includes('senior') ||
    raw === 'ss1' ||
    raw === 'ss2' ||
    raw === 'ss3' ||
    raw === 'sss1' ||
    raw === 'sss2' ||
    raw === 'sss3'
  ) {
    return 'SS1-3';
  }

  // Junior Secondary: JSS1 - JSS3, Junior Secondary
  if (
    /\b(jss)\s*[1-3]\b/i.test(raw) ||
    raw.includes('junior') ||
    raw === 'jss1' ||
    raw === 'jss2' ||
    raw === 'jss3'
  ) {
    return 'JSS1-3';
  }

  // Upper Primary: Primary 4, 5, 6; Basic 4, 5, 6; P4, P5, P6
  if (
    /\b(primary|basic|pri|p)\s*[4-6]\b/i.test(raw) ||
    raw === 'primary 4' ||
    raw === 'primary 5' ||
    raw === 'primary 6' ||
    raw === 'basic 4' ||
    raw === 'basic 5' ||
    raw === 'basic 6' ||
    raw === 'p4' ||
    raw === 'p5' ||
    raw === 'p6'
  ) {
    return 'P4-6';
  }

  // Lower Primary: Primary 1, 2, 3; Basic 1, 2, 3; P1, P2, P3; Nursery
  if (
    /\b(primary|basic|pri|p)\s*[1-3]\b/i.test(raw) ||
    raw.includes('nursery') ||
    raw.includes('kindergarten') ||
    raw === 'primary 1' ||
    raw === 'primary 2' ||
    raw === 'primary 3' ||
    raw === 'basic 1' ||
    raw === 'basic 2' ||
    raw === 'basic 3' ||
    raw === 'p1' ||
    raw === 'p2' ||
    raw === 'p3'
  ) {
    return 'P1-3';
  }

  return null;
}

/**
 * Calculate the exact start and end of a calendar day in the Africa/Lagos timezone (UTC+1).
 * Nigeria does not use Daylight Saving Time.
 */
export function getLagosDayBounds(date: Date = new Date()): {
  start: Date;
  end: Date;
  dateStr: string;
} {
  // Extract YYYY-MM-DD in Africa/Lagos
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const dateStr = formatter.format(date); // e.g. "2026-10-05"

  // Lagos is UTC+1 year-round
  const start = new Date(`${dateStr}T00:00:00.000+01:00`);
  const end = new Date(`${dateStr}T23:59:59.999+01:00`);

  return { start, end, dateStr };
}

/**
 * Check whether a patron has exceeded the daily limit of 2 check-ins today in Africa/Lagos timezone.
 */
export async function checkDailyCheckinCap(
  patronBarcode: string,
  sessionKey: string,
  checkDate: Date = new Date()
): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  dateStr: string;
}> {
  await connectDB();
  const { start, end, dateStr } = getLagosDayBounds(checkDate);

  const currentCount = await Competition.countDocuments({
    patronBarcode: patronBarcode.trim(),
    sessionKey: sessionKey.trim(),
    status: 'checked_in',
    checkinDate: { $gte: start, $lte: end },
  });

  const maxAllowed = 2;
  const allowed = currentCount < maxAllowed;

  return {
    allowed,
    currentCount,
    maxAllowed,
    dateStr,
  };
}

/**
 * Retrieve metadata and status for the active competition session.
 */
export async function getActiveSession(): Promise<ICompetitionSessionInfo> {
  await connectDB();

  // Find library document with competition settings
  const lib = await Library.findOne({
    $or: [
      { 'competitionDetails.isActive': true },
      { 'competitionDetails.title': { $exists: true } },
      { libraryName: { $exists: true } },
    ],
  }).sort({ updatedAt: -1 });

  let sessionKey = DEFAULT_SESSION_KEY;
  let title = DEFAULT_SESSION_TITLE;
  let isActive = false;
  let isPublished = false;
  let publishedAt: string | null = null;
  let publishedBy = '';

  if (lib?.competitionDetails) {
    if (lib.competitionDetails.title) {
      title = lib.competitionDetails.title;
      sessionKey =
        title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
        DEFAULT_SESSION_KEY;
    }
    isActive = Boolean(lib.competitionDetails.isActive);

    const readingRes = lib.competitionDetails.results?.reading;
    if (readingRes) {
      isPublished = Boolean(readingRes.isPublished);
      publishedAt = readingRes.publishedAt
        ? readingRes.publishedAt.toISOString()
        : null;
      publishedBy = readingRes.publishedBy || '';
    }
  }

  // Count total entries and distinct participants
  const [totalEntries, distinctPatrons] = await Promise.all([
    Competition.countDocuments({ sessionKey }),
    Competition.distinct('patronBarcode', { sessionKey }),
  ]);

  return {
    sessionKey,
    title,
    isActive,
    isPublished,
    publishedAt,
    publishedBy,
    totalEntries,
    totalParticipants: distinctPatrons.length,
  };
}

/**
 * Update competition session settings, activation status, or publication gate.
 */
export async function updateSessionSettings(input: {
  isActive?: boolean;
  isPublished?: boolean;
  sessionKey?: string;
  title?: string;
  staffName?: string;
}): Promise<ICompetitionSessionInfo> {
  await connectDB();

  let lib = await Library.findOne({
    $or: [
      { 'competitionDetails.isActive': { $exists: true } },
      { libraryName: { $exists: true } },
    ],
  });

  if (!lib) {
    lib = await Library.create({
      libraryName: 'AAoJ Library',
      competitionDetails: {
        isActive: input.isActive ?? true,
        title: input.title || DEFAULT_SESSION_TITLE,
        results: {
          reading: {
            isPublished: input.isPublished ?? false,
            publishedAt: input.isPublished ? new Date() : undefined,
            publishedBy: input.staffName || '',
          },
        },
      },
    });
  } else {
    if (!lib.competitionDetails) {
      lib.competitionDetails = {};
    }

    if (input.isActive !== undefined) {
      lib.competitionDetails.isActive = input.isActive;
    }

    if (input.title) {
      lib.competitionDetails.title = input.title;
    }

    if (input.isPublished !== undefined) {
      if (!lib.competitionDetails.results) {
        lib.competitionDetails.results = {};
      }
      if (!lib.competitionDetails.results.reading) {
        lib.competitionDetails.results.reading = {};
      }

      lib.competitionDetails.results.reading.isPublished = input.isPublished;
      if (input.isPublished) {
        lib.competitionDetails.results.reading.publishedAt = new Date();
        lib.competitionDetails.results.reading.publishedBy = input.staffName || '';
      }
    }

    await lib.save();
  }

  return getActiveSession();
}

/**
 * Create a competition checkout transaction for a patron.
 */
export async function createCompetitionCheckout(
  input: ICreateCompetitionCheckoutInput
): Promise<ICompetition> {
  await connectDB();

  const patronBarcode = input.patronBarcode.trim();
  const patron = await Patron.findOne({ barcode: patronBarcode });
  if (!patron) {
    throw new Error(`Patron with barcode "${patronBarcode}" not found.`);
  }

  const activeSession = await getActiveSession();
  const sessionKey = (input.sessionKey || activeSession.sessionKey).trim();
  const sessionTitle = activeSession.title;

  let bookTitle = input.bookTitle?.trim() || '';
  let bookId: mongoose.Types.ObjectId | undefined;
  const bookBarcode = input.bookBarcode?.trim();

  if (bookBarcode) {
    const catalogItem = await Cataloging.findOne({ barcode: bookBarcode });
    if (catalogItem) {
      bookId = catalogItem._id;
      if (!bookTitle) {
        bookTitle = catalogItem.title?.mainTitle || '';
      }
    }
  }

  if (!bookTitle) {
    throw new Error('Book title or catalog barcode is required for checkout.');
  }

  // Determine category: specified or auto-detected from student school info
  let category = input.category?.trim();
  if (!category && patron.studentSchoolInfo?.currentClass) {
    const resolved = resolveCompetitionCategory(
      patron.studentSchoolInfo.currentClass
    );
    if (resolved) {
      category = resolved;
    }
  }

  const patronName = `${patron.surname}, ${patron.firstname}`.trim();
  const bookTitleKey = bookTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const checkoutDoc = await Competition.create({
    competitionType: 'reading',
    title: sessionTitle,
    sessionKey,
    category,
    patronId: patron._id,
    patronBarcode,
    patronName,
    bookId,
    bookBarcode,
    bookTitle,
    bookTitleKey,
    checkoutDate: new Date(),
    checkedOutBy: input.checkedOutBy || 'Staff',
    status: 'checked_out',
    library: patron.library || 'AAoJ',
  });

  return checkoutDoc;
}

/**
 * Process a competition book evaluation/check-in.
 * Validates the 2-book daily cap in Africa/Lagos timezone, sets the grade (0-100),
 * summary, feedback notes, and teacher verification.
 */
export async function processCompetitionCheckin(
  input: IProcessCompetitionCheckinInput
): Promise<ICompetition> {
  await connectDB();

  // Validate grade
  if (
    input.grade === undefined ||
    input.grade === null ||
    Number.isNaN(Number(input.grade)) ||
    Number(input.grade) < 0 ||
    Number(input.grade) > 100
  ) {
    throw new Error('Grade must be a valid number between 0 and 100.');
  }

  const grade = Number(input.grade);
  const now = new Date();

  // If entryId was provided, update existing checkout record
  if (input.entryId) {
    const existing = await Competition.findById(input.entryId);
    if (!existing) {
      throw new Error(`Competition entry with ID "${input.entryId}" not found.`);
    }

    // Check daily cap only if it wasn't already checked_in today
    if (existing.status !== 'checked_in') {
      const capCheck = await checkDailyCheckinCap(
        existing.patronBarcode,
        existing.sessionKey,
        now
      );
      if (!capCheck.allowed) {
        throw new Error(
          `Daily reading cap reached: Patron "${existing.patronName}" already has ${capCheck.currentCount} book check-in(s) today (${capCheck.dateStr}) in Lagos time. Maximum allowed is 2.`
        );
      }
    }

    existing.status = 'checked_in';
    existing.checkinDate = now;
    existing.grade = grade;
    existing.summary = input.summary?.trim() || existing.summary || '';
    existing.feedback = input.feedback?.trim() || existing.feedback || '';
    existing.teacherVerified = Boolean(input.teacherVerified);
    existing.teacherVerifiedBy = input.teacherVerified
      ? input.teacherVerifiedBy?.trim() || input.gradedBy || 'Teacher'
      : '';
    existing.gradedBy = input.gradedBy || 'Staff Judge';
    if (input.category) {
      existing.category = input.category.trim();
    }

    await existing.save();
    return existing;
  }

  // Direct check-in without prior checkout record
  if (!input.patronBarcode) {
    throw new Error('Patron barcode is required for competition evaluation.');
  }

  const patronBarcode = input.patronBarcode.trim();
  const patron = await Patron.findOne({ barcode: patronBarcode });
  if (!patron) {
    throw new Error(`Patron with barcode "${patronBarcode}" not found.`);
  }

  const activeSession = await getActiveSession();
  const sessionKey = (input.sessionKey || activeSession.sessionKey).trim();
  const sessionTitle = activeSession.title;

  // Enforce Lagos 2-book daily cap
  const capCheck = await checkDailyCheckinCap(patronBarcode, sessionKey, now);
  if (!capCheck.allowed) {
    throw new Error(
      `Daily reading cap reached: Patron "${patron.firstname} ${patron.surname}" already has ${capCheck.currentCount} book check-in(s) today (${capCheck.dateStr}) in Lagos time. Maximum allowed is 2.`
    );
  }

  let bookTitle = input.bookTitle?.trim() || '';
  let bookId: mongoose.Types.ObjectId | undefined;
  const bookBarcode = input.bookBarcode?.trim();

  if (bookBarcode) {
    const catalogItem = await Cataloging.findOne({ barcode: bookBarcode });
    if (catalogItem) {
      bookId = catalogItem._id;
      if (!bookTitle) {
        bookTitle = catalogItem.title?.mainTitle || '';
      }
    }
  }

  if (!bookTitle) {
    throw new Error('Book title or catalog barcode is required.');
  }

  let category = input.category?.trim();
  if (!category && patron.studentSchoolInfo?.currentClass) {
    const resolved = resolveCompetitionCategory(
      patron.studentSchoolInfo.currentClass
    );
    if (resolved) {
      category = resolved;
    }
  }

  const patronName = `${patron.surname}, ${patron.firstname}`.trim();
  const bookTitleKey = bookTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newEntry = await Competition.create({
    competitionType: 'reading',
    title: sessionTitle,
    sessionKey,
    category,
    patronId: patron._id,
    patronBarcode,
    patronName,
    bookId,
    bookBarcode,
    bookTitle,
    bookTitleKey,
    checkoutDate: now,
    checkedOutBy: input.gradedBy || 'Judge Desk',
    status: 'checked_in',
    checkinDate: now,
    grade,
    summary: input.summary?.trim() || '',
    feedback: input.feedback?.trim() || '',
    teacherVerified: Boolean(input.teacherVerified),
    teacherVerifiedBy: input.teacherVerified
      ? input.teacherVerifiedBy?.trim() || input.gradedBy || 'Teacher'
      : '',
    gradedBy: input.gradedBy || 'Staff Judge',
    library: patron.library || 'AAoJ',
  });

  return newEntry;
}

/**
 * Update fields on an existing competition evaluation record.
 */
export async function updateCompetitionEntry(
  id: string,
  input: IUpdateCompetitionEntryInput
): Promise<ICompetition> {
  await connectDB();

  const entry = await Competition.findById(id);
  if (!entry) {
    throw new Error(`Competition entry with ID "${id}" not found.`);
  }

  if (input.grade !== undefined) {
    const grade = Number(input.grade);
    if (Number.isNaN(grade) || grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100.');
    }
    entry.grade = grade;
  }

  if (input.summary !== undefined) {
    entry.summary = input.summary.trim();
  }

  if (input.feedback !== undefined) {
    entry.feedback = input.feedback.trim();
  }

  if (input.category !== undefined) {
    entry.category = input.category.trim();
  }

  if (input.teacherVerified !== undefined) {
    entry.teacherVerified = Boolean(input.teacherVerified);
    if (entry.teacherVerified) {
      entry.teacherVerifiedBy =
        input.teacherVerifiedBy?.trim() ||
        entry.teacherVerifiedBy ||
        input.gradedBy ||
        'Teacher';
    } else {
      entry.teacherVerifiedBy = '';
    }
  }

  if (input.gradedBy) {
    entry.gradedBy = input.gradedBy;
  }

  await entry.save();
  return entry;
}

/**
 * Retrieve competition results and leaderboard for the public broadcast view or staff review.
 * Aggregates all checked-in records, performs multi-tier sorting:
 * 1st: booksRead DESC
 * 2nd: averageGrade DESC
 * 3rd: teacherVerifiedCount DESC
 * 4th: totalGradePoints DESC
 * 5th: patronName ASC
 */
export async function getCompetitionResults(
  sessionKeyInput?: string,
  categoryFilter: string = 'ALL'
): Promise<ICompetitionResultData> {
  await connectDB();

  const sessionInfo = await getActiveSession();
  const sessionKey = (sessionKeyInput || sessionInfo.sessionKey).trim();

  // Find all checked-in records for this session
  const entries = await Competition.find({
    sessionKey,
    status: 'checked_in',
  }).sort({ checkinDate: -1 });

  // Map to group by patronBarcode
  const patronMap = new Map<
    string,
    {
      patronId: string;
      patronBarcode: string;
      patronName: string;
      category: CompetitionCategoryCode | 'Unassigned';
      grades: number[];
      verifiedCount: number;
      recentBooks: {
        title: string;
        grade: number | null;
        teacherVerified: boolean;
        checkinDate?: Date;
      }[];
    }
  >();

  for (const entry of entries) {
    const barcode = entry.patronBarcode;
    if (!patronMap.has(barcode)) {
      patronMap.set(barcode, {
        patronId: entry.patronId?.toString() || '',
        patronBarcode: barcode,
        patronName: entry.patronName,
        category: (entry.category as CompetitionCategoryCode) || 'Unassigned',
        grades: [],
        verifiedCount: 0,
        recentBooks: [],
      });
    }

    const item = patronMap.get(barcode)!;

    // If entry has a category and patron is currently unassigned, adopt entry's category
    if (
      entry.category &&
      (!item.category || item.category === 'Unassigned')
    ) {
      item.category = entry.category as CompetitionCategoryCode;
    }

    if (entry.grade !== null && entry.grade !== undefined) {
      item.grades.push(entry.grade);
    }
    if (entry.teacherVerified) {
      item.verifiedCount += 1;
    }
    if (item.recentBooks.length < 5) {
      item.recentBooks.push({
        title: entry.bookTitle,
        grade: entry.grade ?? null,
        teacherVerified: Boolean(entry.teacherVerified),
        checkinDate: entry.checkinDate,
      });
    }
  }

  // Count category breakdowns
  const categoryCountMap: Record<CompetitionCategoryCode, number> = {
    'SS1-3': 0,
    'JSS1-3': 0,
    'P4-6': 0,
    'P1-3': 0,
  };

  for (const patron of patronMap.values()) {
    if (patron.category in categoryCountMap) {
      categoryCountMap[patron.category as CompetitionCategoryCode] += 1;
    }
  }

  const categories = COMPETITION_CATEGORIES.map((cat) => ({
    code: cat.code,
    label: `${cat.label} (${cat.sublabel})`,
    count: categoryCountMap[cat.code] || 0,
  }));

  // Build raw list
  const rawList: ICompetitionLeaderboardEntry[] = [];
  let totalBooksEvaluated = 0;
  let totalGradeSum = 0;
  let totalGradeCount = 0;
  let totalVerifiedBooks = 0;

  for (const item of patronMap.values()) {
    const booksRead = item.grades.length;
    const totalGradePoints = item.grades.reduce((sum, g) => sum + g, 0);
    const averageGrade =
      booksRead > 0
        ? Math.round((totalGradePoints / booksRead) * 10) / 10
        : 0;

    totalBooksEvaluated += booksRead;
    totalGradeSum += totalGradePoints;
    totalGradeCount += booksRead;
    totalVerifiedBooks += item.verifiedCount;

    rawList.push({
      rank: 0, // Assigned after sorting
      patronId: item.patronId,
      patronBarcode: item.patronBarcode,
      patronName: item.patronName,
      category: item.category,
      booksRead,
      averageGrade,
      teacherVerifiedCount: item.verifiedCount,
      totalGradePoints,
      recentBooks: item.recentBooks,
    });
  }

  // Filter by category if requested
  const filteredList =
    categoryFilter && categoryFilter !== 'ALL'
      ? rawList.filter((item) => item.category === categoryFilter)
      : rawList;

  // Multi-tier sort
  filteredList.sort((a, b) => {
    // 1st: Books read DESC
    if (b.booksRead !== a.booksRead) {
      return b.booksRead - a.booksRead;
    }
    // 2nd: Average grade DESC
    if (b.averageGrade !== a.averageGrade) {
      return b.averageGrade - a.averageGrade;
    }
    // 3rd: Teacher verified count DESC
    if (b.teacherVerifiedCount !== a.teacherVerifiedCount) {
      return b.teacherVerifiedCount - a.teacherVerifiedCount;
    }
    // 4th: Total grade points DESC
    if (b.totalGradePoints !== a.totalGradePoints) {
      return b.totalGradePoints - a.totalGradePoints;
    }
    // 5th: Patron name ASC
    return a.patronName.localeCompare(b.patronName);
  });

  // Assign ranks
  let currentRank = 1;
  const leaderboard: ICompetitionLeaderboardEntry[] = filteredList.map(
    (item, index) => {
      if (index > 0) {
        const prev = filteredList[index - 1];
        if (
          item.booksRead === prev.booksRead &&
          item.averageGrade === prev.averageGrade &&
          item.teacherVerifiedCount === prev.teacherVerifiedCount &&
          item.totalGradePoints === prev.totalGradePoints
        ) {
          // Tie
        } else {
          currentRank = index + 1;
        }
      } else {
        currentRank = 1;
      }

      return {
        ...item,
        rank: currentRank,
      };
    }
  );

  // Extract top 3 podium entries
  const podium: ICompetitionPodiumEntry[] = [];
  for (let i = 0; i < Math.min(3, leaderboard.length); i++) {
    const entry = leaderboard[i];
    podium.push({
      rank: (i + 1) as 1 | 2 | 3,
      patronId: entry.patronId,
      patronBarcode: entry.patronBarcode,
      patronName: entry.patronName,
      category: entry.category,
      booksRead: entry.booksRead,
      averageGrade: entry.averageGrade,
      teacherVerifiedCount: entry.teacherVerifiedCount,
    });
  }

  // Overall stats
  const overallAverageGrade =
    totalGradeCount > 0
      ? Math.round((totalGradeSum / totalGradeCount) * 10) / 10
      : 0;

  const verifiedRate =
    totalBooksEvaluated > 0
      ? Math.round((totalVerifiedBooks / totalBooksEvaluated) * 1000) / 10
      : 0;

  return {
    sessionKey,
    sessionTitle: sessionInfo.title,
    isPublished: sessionInfo.isPublished,
    publishedAt: sessionInfo.publishedAt,
    publishedBy: sessionInfo.publishedBy,
    selectedCategory: categoryFilter,
    categories,
    leaderboard,
    podium,
    stats: {
      totalParticipants: patronMap.size,
      totalBooksEvaluated,
      overallAverageGrade,
      verifiedRate,
    },
  };
}

/**
 * List competition entries with filtering and pagination for the staff ledger table.
 */
export async function listCompetitionEntries(query: {
  sessionKey?: string;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();

  const activeSession = await getActiveSession();
  const sessionKey = (query.sessionKey || activeSession.sessionKey).trim();
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { sessionKey };

  if (query.category && query.category !== 'ALL') {
    filter.category = query.category;
  }

  if (query.status && query.status !== 'ALL') {
    filter.status = query.status;
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    filter.$or = [
      { patronName: { $regex: term, $options: 'i' } },
      { patronBarcode: { $regex: term, $options: 'i' } },
      { bookTitle: { $regex: term, $options: 'i' } },
      { bookBarcode: { $regex: term, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Competition.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Competition.countDocuments(filter),
  ]);

  const serializedItems: ICompetitionEntryItem[] = (
    items as unknown as Array<Record<string, unknown>>
  ).map((doc) => ({
    _id: doc._id ? String(doc._id) : '',
    sessionKey: (doc.sessionKey as string) || sessionKey,
    category: doc.category as string | undefined,
    patronId: doc.patronId ? String(doc.patronId) : undefined,
    patronBarcode: String(doc.patronBarcode || ''),
    patronName: String(doc.patronName || ''),
    bookBarcode: doc.bookBarcode as string | undefined,
    bookTitle: String(doc.bookTitle || ''),
    checkoutDate: doc.checkoutDate
      ? new Date(doc.checkoutDate as string | number | Date).toISOString()
      : new Date().toISOString(),
    checkinDate: doc.checkinDate
      ? new Date(doc.checkinDate as string | number | Date).toISOString()
      : undefined,
    status: (doc.status as string) || 'checked_out',
    grade: typeof doc.grade === 'number' ? doc.grade : null,
    summary: doc.summary as string | undefined,
    feedback: doc.feedback as string | undefined,
    teacherVerified: Boolean(doc.teacherVerified),
    teacherVerifiedBy: doc.teacherVerifiedBy as string | undefined,
    gradedBy: doc.gradedBy as string | undefined,
    checkedOutBy: doc.checkedOutBy as string | undefined,
  }));

  return {
    items: serializedItems,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
