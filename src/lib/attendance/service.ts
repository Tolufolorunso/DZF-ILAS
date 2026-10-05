import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Attendance, IAttendanceDocument, ClassType } from '@/models/Attendance';
import { Patron } from '@/models/Patron';
import { MonthlyActivity } from '@/models/MonthlyActivity';
import { Cohort } from '@/models/Cohort';

export interface ScanAttendanceInput {
  barcode: string;
  classType?: ClassType;
  className?: string;
  classDate?: string | Date;
  points?: number;
  notes?: string;
  markedBy: string;
  library?: string;
}

export interface PatronAttendanceDTO {
  _id: string;
  barcode: string;
  firstname: string;
  surname: string;
  fullName: string;
  patronType: string;
  schoolClass?: string;
  points: number;
  photo?: string;
}

export interface ScanAttendanceResult {
  success: boolean;
  message?: string;
  error?: string;
  alreadyMarked?: boolean;
  attendance?: IAttendanceDocument;
  patron?: PatronAttendanceDTO;
  existingAttendance?: {
    _id: string;
    attendanceTime: Date;
    className: string;
    markedBy: string;
  };
}

export interface AttendanceFilterOptions {
  page?: number;
  limit?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  classType?: string;
  className?: string;
  patronBarcode?: string;
  search?: string;
}

export interface AttendanceStatsDTO {
  totalToday: number;
  libraryVisitsToday: number;
  academyClassesToday: number;
  uniquePatronsToday: number;
  totalPointsAwardedToday: number;
  sessionBreakdown: { className: string; count: number }[];
}

export interface SessionOption {
  id: string;
  name: string;
  classType: ClassType;
  defaultPoints: number;
  description: string;
}

/**
 * Normalizes any given date to start-of-day UTC (00:00:00.000Z)
 * to avoid timezone offset collision bugs.
 */
export function normalizeClassDate(d?: string | Date): Date {
  const dateObj = d ? new Date(d) : new Date();
  if (isNaN(dateObj.getTime())) {
    const today = new Date();
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  }
  return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
}

/**
 * Standard default sessions available for attendance check-ins.
 */
export const DEFAULT_SESSIONS: SessionOption[] = [
  {
    id: 'general-reading',
    name: 'General Reading & Study',
    classType: 'library',
    defaultPoints: 2,
    description: 'Daily academic library visitor or reading room study session',
  },
  {
    id: 'early-elementary-literacy',
    name: 'Early Elementary (Primary 1-3)',
    classType: 'literacy',
    defaultPoints: 5,
    description: 'Foundational digital literacy & reading session for lower grades',
  },
  {
    id: 'upper-elementary-literacy',
    name: 'Upper Elementary (Primary 4-6)',
    classType: 'literacy',
    defaultPoints: 5,
    description: 'Intermediate computer & digital skills academy class',
  },
  {
    id: 'cohort-1',
    name: 'cohort-1',
    classType: 'cohort',
    defaultPoints: 5,
    description: 'Digital Literacy Academy Cohort 1',
  },
  {
    id: 'cohort-2',
    name: 'cohort-2',
    classType: 'cohort',
    defaultPoints: 5,
    description: 'Digital Literacy Academy Cohort 2',
  },
  {
    id: 'reading-club',
    name: 'Reading & Discussion Club',
    classType: 'reading_club',
    defaultPoints: 5,
    description: 'Peer book discussion and literature appreciation club',
  },
  {
    id: 'stem-workshop',
    name: 'STEM & ICT Workshop',
    classType: 'workshop',
    defaultPoints: 5,
    description: 'Special practical ICT, robotics or values leadership workshop',
  },
];

/**
 * Records a barcode attendance scan with duplicate detection,
 * atomic Patron points increment, and MonthlyActivity update.
 */
export async function recordAttendanceScan(
  input: ScanAttendanceInput
): Promise<ScanAttendanceResult> {
  await connectDB();

  const cleanBarcode = input.barcode ? input.barcode.trim() : '';
  if (!cleanBarcode) {
    return { success: false, error: 'Patron barcode is required.' };
  }

  // 1. Verify patron exists and is active
  const patron = await Patron.findOne({ barcode: cleanBarcode });
  if (!patron) {
    return {
      success: false,
      error: `Patron with barcode "${cleanBarcode}" was not found in the directory.`,
    };
  }

  if (patron.active === false) {
    return {
      success: false,
      error: `Patron ${patron.firstname} ${patron.surname} (${cleanBarcode}) is currently marked inactive.`,
    };
  }

  const normalizedDate = normalizeClassDate(input.classDate);
  const classType: ClassType = input.classType || 'literacy';
  const className = input.className?.trim() || 'General Reading & Study';
  const points =
    typeof input.points === 'number' && !isNaN(input.points) && input.points >= 0
      ? input.points
      : classType === 'library'
      ? 2
      : 5;

  const patronFullName = `${patron.firstname} ${patron.surname}`.trim();
  const patronDTO: PatronAttendanceDTO = {
    _id: patron._id.toString(),
    barcode: patron.barcode,
    firstname: patron.firstname,
    surname: patron.surname,
    fullName: patronFullName,
    patronType: patron.patronType,
    schoolClass: patron.studentSchoolInfo?.currentClass,
    points: patron.points || 0,
    photo: patron.image_url?.secure_url,
  };

  // 2. Duplicate prevention check
  const existing = await Attendance.findOne({
    patronBarcode: patron.barcode,
    className,
    classDate: normalizedDate,
  });

  if (existing) {
    const timeFormatted = new Date(existing.attendanceTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      success: false,
      alreadyMarked: true,
      error: `Patron ${patronFullName} was already marked present for "${className}" today at ${timeFormatted}.`,
      existingAttendance: {
        _id: existing._id.toString(),
        attendanceTime: existing.attendanceTime,
        className: existing.className,
        markedBy: existing.markedBy,
      },
      patron: patronDTO,
    };
  }

  // 3. Create Attendance record
  const now = new Date();
  const attendance = new Attendance({
    patronId: patron._id,
    patronBarcode: patron.barcode,
    patronName: patronFullName,
    classType,
    className,
    classDate: normalizedDate,
    attendanceTime: now,
    markedBy: input.markedBy.trim() || 'Desk Staff',
    points,
    notes: input.notes?.trim() || '',
    library: input.library || patron.library || 'AAoJ',
  });

  await attendance.save();

  // 4. Atomically award points to Patron
  const updatedPatron = await Patron.findByIdAndUpdate(
    patron._id,
    { $inc: { points } },
    { new: true }
  );

  if (updatedPatron) {
    patronDTO.points = updatedPatron.points || 0;
  }

  // 5. Atomically upsert MonthlyActivity record
  const currentYear = normalizedDate.getUTCFullYear();
  const currentMonth = normalizedDate.getUTCMonth() + 1;
  const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  try {
    await MonthlyActivity.findOneAndUpdate(
      { patronId: patron._id, monthYear },
      {
        $setOnInsert: {
          patronBarcode: patron.barcode,
          patronName: patronFullName,
          year: currentYear,
          month: currentMonth,
          monthYear,
          library: patron.library || 'AAoJ',
          isActive: true,
        },
        $inc: {
          classesAttended: 1,
          pointsFromAttendance: points,
          totalPoints: points,
          activityScore: points,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (monthlyErr) {
    console.warn('MonthlyActivity update for attendance error:', monthlyErr);
  }

  // 6. Optional Cohort roster synchronization
  try {
    await Cohort.findOneAndUpdate(
      { barcode: patron.barcode, cohortType: className, active: true },
      {
        $push: {
          attendance: {
            date: now,
            attended: true,
          },
        },
      }
    );
  } catch (cohortErr) {
    console.warn('Cohort attendance sync error:', cohortErr);
  }

  return {
    success: true,
    message: `Attendance recorded successfully (+${points} points awarded).`,
    attendance,
    patron: patronDTO,
  };
}

/**
 * Undoes / deletes an attendance record and reverses points.
 */
export async function undoAttendance(
  attendanceId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
    return { success: false, error: 'Invalid attendance ID format.' };
  }

  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    return { success: false, error: 'Attendance record not found.' };
  }

  const pointsToReverse = attendance.points || 0;
  const patronId = attendance.patronId;
  const classDate = attendance.classDate;

  // 1. Remove the attendance document
  await Attendance.findByIdAndDelete(attendanceId);

  // 2. Revert Patron points
  if (pointsToReverse > 0) {
    await Patron.findByIdAndUpdate(patronId, {
      $inc: { points: -pointsToReverse },
    });
  }

  // 3. Revert MonthlyActivity
  const dateObj = new Date(classDate);
  const currentYear = dateObj.getUTCFullYear();
  const currentMonth = dateObj.getUTCMonth() + 1;
  const monthYear = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  try {
    await MonthlyActivity.findOneAndUpdate(
      { patronId, monthYear },
      {
        $inc: {
          classesAttended: -1,
          pointsFromAttendance: -pointsToReverse,
          totalPoints: -pointsToReverse,
          activityScore: -pointsToReverse,
        },
      }
    );
  } catch (err) {
    console.warn('MonthlyActivity reversal error:', err);
  }

  return {
    success: true,
    message: `Attendance check-in undone and ${pointsToReverse} points reversed.`,
  };
}

/**
 * Queries attendance records with pagination, date normalization, and filters.
 */
export async function getAttendanceLogs(
  options: AttendanceFilterOptions = {}
): Promise<{
  attendances: IAttendanceDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  await connectDB();

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};

  if (options.date) {
    const norm = normalizeClassDate(options.date);
    query.classDate = norm;
  } else if (options.startDate || options.endDate) {
    query.classDate = {};
    if (options.startDate) {
      query.classDate.$gte = normalizeClassDate(options.startDate);
    }
    if (options.endDate) {
      query.classDate.$lte = normalizeClassDate(options.endDate);
    }
  }

  if (options.classType && options.classType !== 'all') {
    query.classType = options.classType;
  }

  if (options.className && options.className !== 'all') {
    query.className = options.className;
  }

  if (options.patronBarcode) {
    query.patronBarcode = options.patronBarcode.trim();
  }

  if (options.search) {
    const s = options.search.trim();
    query.$or = [
      { patronBarcode: { $regex: s, $options: 'i' } },
      { patronName: { $regex: s, $options: 'i' } },
      { className: { $regex: s, $options: 'i' } },
    ];
  }

  const [attendances, total] = await Promise.all([
    Attendance.find(query).sort({ attendanceTime: -1 }).skip(skip).limit(limit).lean(),
    Attendance.countDocuments(query),
  ]);

  return {
    attendances: attendances as unknown as IAttendanceDocument[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Returns live attendance statistics for today or a specific date.
 */
export async function getAttendanceStats(dateStr?: string): Promise<AttendanceStatsDTO> {
  await connectDB();

  const targetDate = normalizeClassDate(dateStr);

  const [allToday, uniquePatrons, sessionAggregation] = await Promise.all([
    Attendance.find({ classDate: targetDate }).lean(),
    Attendance.distinct('patronBarcode', { classDate: targetDate }),
    Attendance.aggregate([
      { $match: { classDate: targetDate } },
      { $group: { _id: '$className', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  let libraryVisitsToday = 0;
  let academyClassesToday = 0;
  let totalPointsAwardedToday = 0;

  for (const record of allToday) {
    if (record.classType === 'library') {
      libraryVisitsToday++;
    } else {
      academyClassesToday++;
    }
    totalPointsAwardedToday += record.points || 0;
  }

  const sessionBreakdown = sessionAggregation.map((s) => ({
    className: String(s._id || 'Unknown'),
    count: Number(s.count) || 0,
  }));

  return {
    totalToday: allToday.length,
    libraryVisitsToday,
    academyClassesToday,
    uniquePatronsToday: uniquePatrons.length,
    totalPointsAwardedToday,
    sessionBreakdown,
  };
}

/**
 * Fetches available session presets merged with dynamic active cohorts.
 */
export async function getActiveSessions(): Promise<SessionOption[]> {
  await connectDB();

  const sessions = [...DEFAULT_SESSIONS];

  try {
    const distinctCohorts: string[] = await Cohort.distinct('cohortType', {
      active: true,
      isRemoved: false,
    });

    for (const c of distinctCohorts) {
      if (c && !sessions.some((s) => s.name === c)) {
        sessions.push({
          id: `cohort-${c}`,
          name: c,
          classType: 'cohort',
          defaultPoints: 5,
          description: `Active student cohort session: ${c}`,
        });
      }
    }
  } catch (err) {
    console.warn('Error fetching active cohorts for sessions:', err);
  }

  return sessions;
}
