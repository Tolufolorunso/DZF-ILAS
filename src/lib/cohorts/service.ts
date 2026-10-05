import connectDB from '@/lib/db';
import Cohort, { ICohortDocument } from '@/models/Cohort';
import CohortGroup from '@/models/CohortGroup';
import Patron from '@/models/Patron';

export interface CohortStats {
  totalStudents: number;
  activeStudents: number;
  certifiedStudents: number;
  removedStudents: number;
  attendanceRate: number; // 0 to 100
  totalAttendanceRecords: number;
}

export interface CohortGroupWithStats {
  _id: string;
  cohortType: string;
  displayName: string;
  description: string;
  active: boolean;
  order: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  stats: CohortStats;
}

export interface EnrichedStudent {
  _id: string;
  barcode: string;
  firstname: string;
  surname: string;
  middlename?: string;
  schoolClass?: string;
  cohortType: string;
  receivedCertificate: boolean;
  active: boolean;
  isRemoved: boolean;
  removedAt?: string | null;
  attendanceCount: number;
  totalPossibleWeeks: number;
  attendancePercentage: number;
  attendance: Array<{
    date?: string;
    week?: number;
    attended: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculates aggregate stats for a list of cohort students
 */
function calculateCohortStats(students: ICohortDocument[]): CohortStats {
  const totalStudents = students.length;
  let activeStudents = 0;
  let certifiedStudents = 0;
  let removedStudents = 0;
  let totalAttendanceSum = 0;
  let studentsWithAttendance = 0;

  // Find max weeks recorded in this cohort to serve as benchmark
  let maxWeeks = 1;
  students.forEach((s) => {
    if (s.attendance && s.attendance.length > maxWeeks) {
      maxWeeks = s.attendance.length;
    }
  });

  students.forEach((student) => {
    if (student.isRemoved) {
      removedStudents++;
    } else if (student.active) {
      activeStudents++;
    }

    if (student.receivedCertificate) {
      certifiedStudents++;
    }

    const attendedWeeks = (student.attendance || []).filter((a) => a.attended).length;
    totalAttendanceSum += attendedWeeks;

    if (!student.isRemoved && student.active) {
      studentsWithAttendance++;
    }
  });

  const possibleAttendance = (studentsWithAttendance || totalStudents) * maxWeeks;
  const attendanceRate =
    possibleAttendance > 0 ? Math.round((totalAttendanceSum / possibleAttendance) * 100) : 0;

  return {
    totalStudents,
    activeStudents,
    certifiedStudents,
    removedStudents,
    attendanceRate: Math.min(100, Math.max(0, attendanceRate)),
    totalAttendanceRecords: totalAttendanceSum,
  };
}

/**
 * Get all cohort groups enriched with live statistics
 */
export async function getAllCohortGroups(): Promise<CohortGroupWithStats[]> {
  await connectDB();

  const groups = await CohortGroup.find({}).sort({ order: 1, createdAt: 1 }).lean();

  const enrichedGroups: CohortGroupWithStats[] = await Promise.all(
    groups.map(async (group) => {
      const students = await Cohort.find({ cohortType: group.cohortType }).lean();
      const stats = calculateCohortStats(students as unknown as ICohortDocument[]);

      return {
        _id: String(group._id),
        cohortType: group.cohortType,
        displayName: group.displayName || group.cohortType,
        description: group.description || '',
        active: group.active !== false,
        order: group.order || 100,
        createdBy: group.createdBy || '',
        updatedBy: group.updatedBy || '',
        createdAt: group.createdAt ? new Date(group.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: group.updatedAt ? new Date(group.updatedAt).toISOString() : new Date().toISOString(),
        stats,
      };
    })
  );

  return enrichedGroups;
}

/**
 * Get single cohort group metadata and statistics
 */
export async function getCohortGroupByType(cohortType: string): Promise<CohortGroupWithStats | null> {
  await connectDB();

  const normalizedType = cohortType.trim().toLowerCase();
  const group = await CohortGroup.findOne({ cohortType: normalizedType }).lean();

  if (!group) {
    // If not in CohortGroup collection but students exist with this cohortType, synthesize group
    const studentCount = await Cohort.countDocuments({ cohortType: normalizedType });
    if (studentCount > 0) {
      const students = await Cohort.find({ cohortType: normalizedType }).lean();
      const stats = calculateCohortStats(students as unknown as ICohortDocument[]);
      return {
        _id: normalizedType,
        cohortType: normalizedType,
        displayName: normalizedType.replace(/-/g, ' ').toUpperCase(),
        description: 'Auto-detected Cohort Batch',
        active: true,
        order: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats,
      };
    }
    return null;
  }

  const students = await Cohort.find({ cohortType: normalizedType }).lean();
  const stats = calculateCohortStats(students as unknown as ICohortDocument[]);

  return {
    _id: String(group._id),
    cohortType: group.cohortType,
    displayName: group.displayName || group.cohortType,
    description: group.description || '',
    active: group.active !== false,
    order: group.order || 100,
    createdBy: group.createdBy || '',
    updatedBy: group.updatedBy || '',
    createdAt: group.createdAt ? new Date(group.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: group.updatedAt ? new Date(group.updatedAt).toISOString() : new Date().toISOString(),
    stats,
  };
}

/**
 * Create a new cohort group
 */
export async function createCohortGroup(data: {
  cohortType: string;
  displayName?: string;
  description?: string;
  active?: boolean;
  order?: number;
  createdBy?: string;
}): Promise<CohortGroupWithStats> {
  await connectDB();

  const normalizedType = data.cohortType.trim().toLowerCase().replace(/\s+/g, '-');
  if (!normalizedType) {
    throw new Error('Cohort type key identifier is required');
  }

  const existing = await CohortGroup.findOne({ cohortType: normalizedType });
  if (existing) {
    throw new Error(`Cohort with identifier "${normalizedType}" already exists`);
  }

  const newGroup = await CohortGroup.create({
    cohortType: normalizedType,
    displayName: data.displayName?.trim() || normalizedType,
    description: data.description?.trim() || '',
    active: data.active !== undefined ? data.active : true,
    order: typeof data.order === 'number' ? data.order : 100,
    createdBy: data.createdBy || '',
    updatedBy: data.createdBy || '',
  });

  return {
    _id: String(newGroup._id),
    cohortType: newGroup.cohortType,
    displayName: newGroup.displayName,
    description: newGroup.description,
    active: newGroup.active,
    order: newGroup.order,
    createdBy: newGroup.createdBy,
    updatedBy: newGroup.updatedBy,
    createdAt: newGroup.createdAt.toISOString(),
    updatedAt: newGroup.updatedAt.toISOString(),
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      certifiedStudents: 0,
      removedStudents: 0,
      attendanceRate: 0,
      totalAttendanceRecords: 0,
    },
  };
}

/**
 * Update cohort group details
 */
export async function updateCohortGroup(
  cohortType: string,
  updateData: {
    displayName?: string;
    description?: string;
    active?: boolean;
    order?: number;
    updatedBy?: string;
  }
): Promise<CohortGroupWithStats | null> {
  await connectDB();

  const normalizedType = cohortType.trim().toLowerCase();
  const group = await CohortGroup.findOne({ cohortType: normalizedType });
  if (!group) {
    return null;
  }

  if (updateData.displayName !== undefined) group.displayName = updateData.displayName.trim();
  if (updateData.description !== undefined) group.description = updateData.description.trim();
  if (updateData.active !== undefined) group.active = updateData.active;
  if (updateData.order !== undefined) group.order = updateData.order;
  if (updateData.updatedBy) group.updatedBy = updateData.updatedBy;

  await group.save();
  return getCohortGroupByType(normalizedType);
}

/**
 * Get all students for a cohort with optional search, filtering, and pagination
 */
export async function getCohortStudents(
  cohortType: string,
  options?: {
    search?: string;
    filter?: 'all' | 'active' | 'certified' | 'removed';
    page?: number;
    limit?: number;
  }
): Promise<{ students: EnrichedStudent[]; total: number; page: number; limit: number; totalPages: number }> {
  await connectDB();

  const normalizedType = cohortType.trim().toLowerCase();
  const query: Record<string, unknown> = { cohortType: normalizedType };

  if (options?.filter === 'active') {
    query.active = true;
    query.isRemoved = false;
  } else if (options?.filter === 'certified') {
    query.receivedCertificate = true;
  } else if (options?.filter === 'removed') {
    query.isRemoved = true;
  }

  if (options?.search) {
    const s = options.search.trim();
    const regex = new RegExp(s, 'i');
    query.$or = [
      { barcode: regex },
      { firstname: regex },
      { surname: regex },
      { middlename: regex },
      { schoolClass: regex },
    ];
  }

  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, Math.min(100, options?.limit || 50));
  const skip = (page - 1) * limit;

  const total = await Cohort.countDocuments(query);
  const rawStudents = await Cohort.find(query)
    .sort({ isRemoved: 1, receivedCertificate: -1, surname: 1, firstname: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Find max weeks in cohort for percentage calculations
  const allCohortStudents = await Cohort.find({ cohortType: normalizedType }, { attendance: 1 }).lean();
  let maxWeeks = 1;
  allCohortStudents.forEach((st) => {
    if (st.attendance && st.attendance.length > maxWeeks) {
      maxWeeks = st.attendance.length;
    }
  });

  const students: EnrichedStudent[] = rawStudents.map((st) => {
    const attendance = st.attendance || [];
    const attendedWeeks = attendance.filter((a) => a.attended).length;
    const totalPossibleWeeks = Math.max(attendance.length, maxWeeks);
    const attendancePercentage =
      totalPossibleWeeks > 0 ? Math.round((attendedWeeks / totalPossibleWeeks) * 100) : 0;

    return {
      _id: String(st._id),
      barcode: st.barcode,
      firstname: st.firstname,
      surname: st.surname,
      middlename: st.middlename || '',
      schoolClass: st.schoolClass || '',
      cohortType: st.cohortType,
      receivedCertificate: st.receivedCertificate || false,
      active: st.active !== false,
      isRemoved: st.isRemoved || false,
      removedAt: st.removedAt ? new Date(st.removedAt).toISOString() : null,
      attendanceCount: attendedWeeks,
      totalPossibleWeeks,
      attendancePercentage: Math.min(100, Math.max(0, attendancePercentage)),
      attendance: attendance.map((att) => ({
        date: att.date ? new Date(att.date).toISOString() : undefined,
        week: att.week,
        attended: att.attended,
      })),
      createdAt: st.createdAt ? new Date(st.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: st.updatedAt ? new Date(st.updatedAt).toISOString() : new Date().toISOString(),
    };
  });

  return {
    students,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Enroll a patron as a student into a cohort
 */
export async function enrollStudent(
  cohortType: string,
  patronBarcodeOrId: string
): Promise<EnrichedStudent> {
  await connectDB();

  const normalizedType = cohortType.trim().toLowerCase();
  const barcodeQuery = patronBarcodeOrId.trim();

  // Find patron
  const patron = await Patron.findOne({
    $or: [{ barcode: barcodeQuery }, { _id: barcodeQuery.match(/^[0-9a-fA-F]{24}$/) ? barcodeQuery : null }],
  }).lean();

  if (!patron) {
    throw new Error(`No patron found with barcode or ID "${patronBarcodeOrId}"`);
  }

  // Check if student already enrolled in this cohort
  const existing = await Cohort.findOne({
    barcode: patron.barcode,
    cohortType: normalizedType,
  });

  if (existing) {
    if (!existing.isRemoved) {
      throw new Error(`Patron ${patron.firstname} ${patron.surname} (${patron.barcode}) is already enrolled in ${normalizedType}`);
    }
    // Re-enroll removed student
    existing.isRemoved = false;
    existing.active = true;
    existing.removedAt = undefined;
    await existing.save();

    return {
      _id: String(existing._id),
      barcode: existing.barcode,
      firstname: existing.firstname,
      surname: existing.surname,
      middlename: existing.middlename,
      schoolClass: existing.schoolClass,
      cohortType: existing.cohortType,
      receivedCertificate: existing.receivedCertificate,
      active: existing.active,
      isRemoved: existing.isRemoved,
      removedAt: null,
      attendanceCount: existing.attendance?.filter((a) => a.attended).length || 0,
      totalPossibleWeeks: existing.attendance?.length || 0,
      attendancePercentage: 0,
      attendance: (existing.attendance || []).map((att) => ({
        date: att.date?.toISOString(),
        week: att.week,
        attended: att.attended,
      })),
      createdAt: existing.createdAt.toISOString(),
      updatedAt: existing.updatedAt.toISOString(),
    };
  }

  // Create new student enrollment
  const newStudent = await Cohort.create({
    barcode: patron.barcode,
    firstname: patron.firstname,
    surname: patron.surname,
    middlename: patron.middlename || '',
    schoolClass: patron.studentSchoolInfo?.currentClass || '',
    cohortType: normalizedType,
    receivedCertificate: false,
    active: true,
    isRemoved: false,
    attendance: [],
  });

  return {
    _id: String(newStudent._id),
    barcode: newStudent.barcode,
    firstname: newStudent.firstname,
    surname: newStudent.surname,
    middlename: newStudent.middlename,
    schoolClass: newStudent.schoolClass,
    cohortType: newStudent.cohortType,
    receivedCertificate: newStudent.receivedCertificate,
    active: newStudent.active,
    isRemoved: newStudent.isRemoved,
    removedAt: null,
    attendanceCount: 0,
    totalPossibleWeeks: 0,
    attendancePercentage: 0,
    attendance: [],
    createdAt: newStudent.createdAt.toISOString(),
    updatedAt: newStudent.updatedAt.toISOString(),
  };
}

/**
 * Update student status in cohort (certificate toggle, removal toggle, class update)
 */
export async function updateStudentStatus(
  cohortType: string,
  barcode: string,
  updates: {
    receivedCertificate?: boolean;
    isRemoved?: boolean;
    schoolClass?: string;
  }
): Promise<EnrichedStudent | null> {
  await connectDB();

  const normalizedType = cohortType.trim().toLowerCase();
  const student = await Cohort.findOne({ cohortType: normalizedType, barcode });

  if (!student) {
    return null;
  }

  if (updates.receivedCertificate !== undefined) {
    student.receivedCertificate = updates.receivedCertificate;
  }

  if (updates.isRemoved !== undefined) {
    student.isRemoved = updates.isRemoved;
    if (updates.isRemoved) {
      student.active = false;
      student.removedAt = new Date();
    } else {
      student.active = true;
      student.removedAt = undefined;
    }
  }

  if (updates.schoolClass !== undefined) {
    student.schoolClass = updates.schoolClass.trim();
  }

  await student.save();

  const attendance = student.attendance || [];
  const attendedWeeks = attendance.filter((a) => a.attended).length;
  const totalPossibleWeeks = Math.max(1, attendance.length);
  const attendancePercentage = Math.round((attendedWeeks / totalPossibleWeeks) * 100);

  return {
    _id: String(student._id),
    barcode: student.barcode,
    firstname: student.firstname,
    surname: student.surname,
    middlename: student.middlename,
    schoolClass: student.schoolClass,
    cohortType: student.cohortType,
    receivedCertificate: student.receivedCertificate,
    active: student.active,
    isRemoved: student.isRemoved,
    removedAt: student.removedAt ? student.removedAt.toISOString() : null,
    attendanceCount: attendedWeeks,
    totalPossibleWeeks,
    attendancePercentage,
    attendance: attendance.map((att) => ({
      date: att.date ? new Date(att.date).toISOString() : undefined,
      week: att.week,
      attended: att.attended,
    })),
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
}

/**
 * Reconcile and record attendance for a student
 */
export async function addStudentAttendanceRecord(
  cohortType: string,
  barcode: string,
  record: { date: Date; week?: number; attended: boolean }
): Promise<boolean> {
  await connectDB();

  const student = await Cohort.findOne({ cohortType: cohortType.trim().toLowerCase(), barcode });
  if (!student) return false;

  student.attendance.push({
    date: record.date,
    week: record.week || student.attendance.length + 1,
    attended: record.attended,
  });

  await student.save();
  return true;
}

/**
 * Fetch raw student records for Google Sheets sync
 */
export async function getCohortStudentsForSync(cohortType: string): Promise<ICohortDocument[]> {
  await connectDB();
  return Cohort.find({ cohortType: cohortType.trim().toLowerCase() })
    .sort({ isRemoved: 1, receivedCertificate: -1, surname: 1, firstname: 1 });
}
