import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { MonthlyActivity } from '@/models/MonthlyActivity';
import { Patron, IPatronDocument } from '@/models/Patron';

/**
 * DZF Foundation Activity Score Calculation Formula
 * Based on Section 2.7 of SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md:
 * Score = (CheckedOut * 10) + (Returned * 15) + (Classes * 20) + (SummariesApproved * 25) + (TotalPoints * 1)
 */
export function computeActivityScore(activity: {
  booksCheckedOut?: number;
  booksReturned?: number;
  classesAttended?: number;
  summariesApproved?: number;
  totalPoints?: number;
}): number {
  const checkedOut = Math.max(0, activity.booksCheckedOut || 0);
  const returned = Math.max(0, activity.booksReturned || 0);
  const classes = Math.max(0, activity.classesAttended || 0);
  const summaries = Math.max(0, activity.summariesApproved || 0);
  const points = Math.max(0, activity.totalPoints || 0);

  return (
    checkedOut * 10 +
    returned * 15 +
    classes * 20 +
    summaries * 25 +
    points * 1
  );
}

function getPatronClass(patron: unknown): string {
  if (!patron || typeof patron !== 'object') return '';
  const p = patron as Record<string, unknown>;
  const schoolInfo = p.studentSchoolInfo as Record<string, unknown> | undefined;
  return (schoolInfo?.currentClass as string) || (p.class as string) || '';
}

function getPatronPhone(patron: unknown): string {
  if (!patron || typeof patron !== 'object') return '';
  const p = patron as Record<string, unknown>;
  return (p.phoneNumber as string) || (p.phone as string) || '';
}

export type RankTier = 'champion' | 'runner_up' | 'third_place' | 'top10' | 'standard';

export interface LeaderboardPatronEntry {
  _id: string;
  patronId: string;
  patronBarcode: string;
  patronName: string;
  patronType: string;
  class?: string;
  gender?: string;
  imageUrl?: string;
  year: number;
  month: number;
  monthYear: string;
  booksCheckedOut: number;
  booksReturned: number;
  classesAttended: number;
  summariesSubmitted: number;
  summariesApproved: number;
  totalPoints: number;
  pointsFromBooks: number;
  pointsFromAttendance: number;
  pointsFromSummaries: number;
  activityScore: number;
  rank: number;
  rankTier: RankTier;
  isActive: boolean;
}

export function getRankTier(rank: number): RankTier {
  if (rank === 1) return 'champion';
  if (rank === 2) return 'runner_up';
  if (rank === 3) return 'third_place';
  if (rank <= 10) return 'top10';
  return 'standard';
}

export interface MonthlyLeaderboardOptions {
  year?: number;
  month?: number;
  patronType?: string;
  classLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MonthlyLeaderboardResult {
  year: number;
  month: number;
  monthYear: string;
  top3: LeaderboardPatronEntry[];
  leaderboard: LeaderboardPatronEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    topReader: {
      name: string;
      barcode: string;
      score: number;
      rankTier: RankTier;
    } | null;
    activePatronsCount: number;
    totalPointsAwarded: number;
    totalBooksCirculated: number;
    totalSummariesApproved: number;
    totalClassesAttended: number;
  };
}

/**
 * Retrieve monthly leaderboard records without mutating the database (strictly read-only).
 */
export async function getMonthlyLeaderboard(
  options: MonthlyLeaderboardOptions = {}
): Promise<MonthlyLeaderboardResult> {
  await connectDB();

  const now = new Date();
  const year = options.year || now.getFullYear();
  const month = options.month || now.getMonth() + 1;
  const monthYear = `${year}-${String(month).padStart(2, '0')}`;
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const skip = (page - 1) * limit;

  // Build filter for MonthlyActivity
  const activityFilter: Record<string, unknown> = {
    year,
    month,
    isActive: true,
  };

  // If search query is provided
  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    activityFilter.$or = [
      { patronName: { $regex: s, $options: 'i' } },
      { patronBarcode: { $regex: s, $options: 'i' } },
    ];
  }

  // 1. Fetch all active patrons for this month sorted by activityScore & totalPoints
  // We populate patron details to filter by patronType or classLevel if requested
  const allMonthlyDocs = await MonthlyActivity.find(activityFilter)
    .sort({ activityScore: -1, totalPoints: -1, patronBarcode: 1 })
    .populate<{ patronId: IPatronDocument }>({
      path: 'patronId',
      select: 'firstname surname barcode patronType studentSchoolInfo class gender image_url points active phoneNumber phone',
    })
    .lean();

  // Filter in memory for populated patron attributes if requested
  const filteredDocs = allMonthlyDocs.filter((doc) => {
    const patron = doc.patronId;
    if (!patron) return false;
    if (options.patronType && options.patronType !== 'all') {
      if (patron.patronType !== options.patronType) return false;
    }
    if (options.classLevel && options.classLevel !== 'all') {
      if (getPatronClass(patron) !== options.classLevel) return false;
    }
    return true;
  });

  // Calculate dynamic display ranks
  let currentRank = 1;
  const rankedDocs: LeaderboardPatronEntry[] = filteredDocs.map((doc, idx) => {
    const patron = doc.patronId;
    if (idx > 0) {
      const prev = filteredDocs[idx - 1];
      if (
        doc.activityScore === prev.activityScore &&
        doc.totalPoints === prev.totalPoints
      ) {
        // Tied rank
      } else {
        currentRank = idx + 1;
      }
    } else {
      currentRank = 1;
    }

    const assignedRank = doc.rank && doc.rank > 0 ? doc.rank : currentRank;
    const tier = getRankTier(assignedRank);

    return {
      _id: doc._id.toString(),
      patronId: patron?._id ? patron._id.toString() : doc.patronId?.toString() || '',
      patronBarcode: doc.patronBarcode || patron?.barcode || '',
      patronName: doc.patronName || `${patron?.firstname || ''} ${patron?.surname || ''}`.trim(),
      patronType: patron?.patronType || 'student',
      class: getPatronClass(patron),
      gender: patron?.gender || '',
      imageUrl: patron?.image_url?.secure_url || '',
      year: doc.year,
      month: doc.month,
      monthYear: doc.monthYear || monthYear,
      booksCheckedOut: doc.booksCheckedOut || 0,
      booksReturned: doc.booksReturned || 0,
      classesAttended: doc.classesAttended || 0,
      summariesSubmitted: doc.summariesSubmitted || 0,
      summariesApproved: doc.summariesApproved || 0,
      totalPoints: doc.totalPoints || 0,
      pointsFromBooks: doc.pointsFromBooks || 0,
      pointsFromAttendance: doc.pointsFromAttendance || 0,
      pointsFromSummaries: doc.pointsFromSummaries || 0,
      activityScore: doc.activityScore || 0,
      rank: assignedRank,
      rankTier: tier,
      isActive: doc.isActive,
    };
  });

  const total = rankedDocs.length;
  const totalPages = Math.ceil(total / limit) || 1;

  // Extract Top 3 for the podium
  const top3 = rankedDocs.slice(0, 3);

  // Paginated list
  const leaderboard = rankedDocs.slice(skip, skip + limit);

  // Aggregate stats across all ranked docs
  const totalPointsAwarded = rankedDocs.reduce((acc, d) => acc + d.totalPoints, 0);
  const totalBooksCirculated = rankedDocs.reduce((acc, d) => acc + d.booksCheckedOut, 0);
  const totalSummariesApproved = rankedDocs.reduce((acc, d) => acc + d.summariesApproved, 0);
  const totalClassesAttended = rankedDocs.reduce((acc, d) => acc + d.classesAttended, 0);

  const topReader =
    top3.length > 0
      ? {
          name: top3[0].patronName,
          barcode: top3[0].patronBarcode,
          score: top3[0].activityScore,
          rankTier: top3[0].rankTier,
        }
      : null;

  return {
    year,
    month,
    monthYear,
    top3,
    leaderboard,
    total,
    page,
    limit,
    totalPages,
    stats: {
      topReader,
      activePatronsCount: total,
      totalPointsAwarded,
      totalBooksCirculated,
      totalSummariesApproved,
      totalClassesAttended,
    },
  };
}

/**
 * Batch recalculate and re-rank all MonthlyActivity documents for a given month.
 * Strictly an explicit staff/admin operation, never run during GET requests.
 */
export async function recalculateMonthlyRanks(
  year: number,
  month: number
): Promise<{ count: number; topScore: number; monthYear: string }> {
  await connectDB();

  const monthYear = `${year}-${String(month).padStart(2, '0')}`;

  // 1. Fetch all monthly activities for this month
  const records = await MonthlyActivity.find({ year, month });
  if (records.length === 0) {
    return { count: 0, topScore: 0, monthYear };
  }

  // 2. Compute canonical activityScore for each record
  const computedList = records.map((rec) => {
    const score = computeActivityScore({
      booksCheckedOut: rec.booksCheckedOut,
      booksReturned: rec.booksReturned,
      classesAttended: rec.classesAttended,
      summariesApproved: rec.summariesApproved,
      totalPoints: rec.totalPoints,
    });
    return {
      _id: rec._id,
      activityScore: score,
      totalPoints: rec.totalPoints || 0,
      barcode: rec.patronBarcode || '',
    };
  });

  // 3. Sort by activityScore DESC, totalPoints DESC, barcode ASC
  computedList.sort((a, b) => {
    if (b.activityScore !== a.activityScore) {
      return b.activityScore - a.activityScore;
    }
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.barcode.localeCompare(b.barcode);
  });

  // 4. Assign sequential competition ranks
  let currentRank = 1;
  const bulkOps = computedList.map((item, idx) => {
    if (idx > 0) {
      const prev = computedList[idx - 1];
      if (
        item.activityScore === prev.activityScore &&
        item.totalPoints === prev.totalPoints
      ) {
        // Keep current tied rank
      } else {
        currentRank = idx + 1;
      }
    } else {
      currentRank = 1;
    }

    return {
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            activityScore: item.activityScore,
            rank: currentRank,
            isActive: item.activityScore > 0,
          },
        },
      },
    };
  });

  if (bulkOps.length > 0) {
    await MonthlyActivity.bulkWrite(bulkOps);
  }

  return {
    count: bulkOps.length,
    topScore: computedList[0]?.activityScore || 0,
    monthYear,
  };
}

export interface InactivePatronResult {
  _id: string;
  barcode: string;
  name: string;
  patronType: string;
  class?: string;
  gender?: string;
  phone?: string;
  points: number;
  imageUrl?: string;
  lastActiveMonth?: string;
}

export interface InactivePatronsOptions {
  year?: number;
  month?: number;
  classLevel?: string;
  patronType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Outreach Report: Detect registered patrons with zero activity in a given month.
 */
export async function getInactivePatrons(
  options: InactivePatronsOptions = {}
): Promise<{
  inactivePatrons: InactivePatronResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  monthYear: string;
}> {
  await connectDB();

  const now = new Date();
  const year = options.year || now.getFullYear();
  const month = options.month || now.getMonth() + 1;
  const monthYear = `${year}-${String(month).padStart(2, '0')}`;
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const skip = (page - 1) * limit;

  // 1. Identify all patron IDs with positive activity in this month
  const activeRecords = await MonthlyActivity.find({
    year,
    month,
    $or: [{ activityScore: { $gt: 0 } }, { isActive: true }],
  })
    .select('patronId')
    .lean();

  const activePatronIdSet = new Set(
    activeRecords.map((r) => r.patronId?.toString()).filter(Boolean)
  );

  // 2. Query active patrons in database
  const patronQuery: Record<string, unknown> = {
    active: true,
  };

  if (options.patronType && options.patronType !== 'all') {
    patronQuery.patronType = options.patronType;
  }
  if (options.classLevel && options.classLevel !== 'all') {
    patronQuery.class = options.classLevel;
  }
  if (options.search && options.search.trim()) {
    const s = options.search.trim();
    patronQuery.$or = [
      { firstname: { $regex: s, $options: 'i' } },
      { surname: { $regex: s, $options: 'i' } },
      { barcode: { $regex: s, $options: 'i' } },
    ];
  }

  const allEligiblePatrons = await Patron.find(patronQuery)
    .sort({ class: 1, surname: 1, firstname: 1 })
    .lean();

  // 3. Filter out those who are active in this month
  const inactiveList = allEligiblePatrons.filter(
    (p) => !activePatronIdSet.has(p._id.toString())
  );

  const total = inactiveList.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = inactiveList.slice(skip, skip + limit);

  // 4. For paginated items, optionally find their last active month
  const patronIds = paginated.map((p) => p._id);
  const lastActivities = await MonthlyActivity.find({
    patronId: { $in: patronIds },
    isActive: true,
  })
    .sort({ year: -1, month: -1 })
    .lean();

  const lastActiveMap = new Map<string, string>();
  for (const act of lastActivities) {
    const pid = act.patronId.toString();
    if (!lastActiveMap.has(pid)) {
      lastActiveMap.set(pid, act.monthYear || `${act.year}-${String(act.month).padStart(2, '0')}`);
    }
  }

  const inactivePatrons: InactivePatronResult[] = paginated.map((p) => ({
    _id: p._id.toString(),
    barcode: p.barcode,
    name: `${p.firstname} ${p.surname}`.trim(),
    patronType: p.patronType,
    class: getPatronClass(p),
    gender: p.gender,
    phone: getPatronPhone(p),
    points: p.points || 0,
    imageUrl: p.image_url?.secure_url,
    lastActiveMonth: lastActiveMap.get(p._id.toString()) || 'Never active',
  }));

  return {
    inactivePatrons,
    total,
    page,
    limit,
    totalPages,
    monthYear,
  };
}

/**
 * Retrieve multi-month historical trend for a single patron.
 */
export async function getPatronMonthlyHistory(
  patronId: string | mongoose.Types.ObjectId
): Promise<{
  patron: {
    _id: string;
    barcode: string;
    name: string;
    class?: string;
    patronType: string;
    points: number;
    imageUrl?: string;
  } | null;
  history: Array<{
    year: number;
    month: number;
    monthYear: string;
    activityScore: number;
    rank: number;
    rankTier: RankTier;
    booksCheckedOut: number;
    booksReturned: number;
    classesAttended: number;
    summariesApproved: number;
    totalPoints: number;
  }>;
}> {
  await connectDB();

  const patron = await Patron.findById(patronId).lean();
  if (!patron) {
    return { patron: null, history: [] };
  }

  const records = await MonthlyActivity.find({ patronId: patron._id })
    .sort({ year: -1, month: -1 })
    .limit(12)
    .lean();

  const history = records.map((r) => ({
    year: r.year,
    month: r.month,
    monthYear: r.monthYear || `${r.year}-${String(r.month).padStart(2, '0')}`,
    activityScore: r.activityScore || 0,
    rank: r.rank || 0,
    rankTier: getRankTier(r.rank || 99),
    booksCheckedOut: r.booksCheckedOut || 0,
    booksReturned: r.booksReturned || 0,
    classesAttended: r.classesAttended || 0,
    summariesApproved: r.summariesApproved || 0,
    totalPoints: r.totalPoints || 0,
  }));

  return {
    patron: {
      _id: patron._id.toString(),
      barcode: patron.barcode,
      name: `${patron.firstname} ${patron.surname}`.trim(),
      class: getPatronClass(patron),
      patronType: patron.patronType,
      points: patron.points || 0,
      imageUrl: patron.image_url?.secure_url,
    },
    history,
  };
}
