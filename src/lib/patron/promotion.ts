import connectDB from '@/lib/db';
import { Patron } from '@/models/Patron';
import { SystemSetting } from '@/models/SystemSetting';
import { logAuditEvent } from '@/lib/admin/service';

export interface PromotionResolution {
  currentClass: string;
  nextClass: string;
  isChanged: boolean;
  isGraduated: boolean;
}

export interface TransitionBucket {
  fromClass: string;
  toClass: string;
  count: number;
  sampleStudents: string[];
}

export interface PromotionSimulationResult {
  academicYear: string;
  totalStudents: number;
  promotedCount: number;
  graduatedCount: number;
  unchangedCount: number;
  transitions: TransitionBucket[];
}

export interface PromotionExecutionResult extends PromotionSimulationResult {
  executedAt: string;
  executedBy: string;
}

/**
 * Maps a student's current academic class to their next academic grade.
 * 
 * Ladder Progression:
 * Primary:
 * - Pry 1 -> Pry 2
 * - Pry 2 -> Pry 3
 * - Pry 3 -> Pry 4
 * - Pry 4 -> Pry 5
 * - Pry 5 -> Pry 6
 * - Pry 6 -> JSS 1
 * 
 * Junior Secondary:
 * - JSS 1 -> JSS 2
 * - JSS 2 -> JSS 3
 * - JSS 3 -> SS 1
 * 
 * Senior Secondary:
 * - SS 1 -> SS 2
 * - SS 2 -> SS 3
 * - SS 3 -> out-of-school (Graduation)
 * 
 * Invariants:
 * - If already 'out-of-school', remains 'out-of-school' without changes.
 * - Non-standard or unrecognized classes remain unchanged.
 */
export function promoteClass(currentClass?: string | null): PromotionResolution {
  if (!currentClass || typeof currentClass !== 'string') {
    return {
      currentClass: 'Unassigned',
      nextClass: 'Unassigned',
      isChanged: false,
      isGraduated: false,
    };
  }

  const raw = currentClass.trim();
  const lower = raw.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');

  // 1. Already Out of School
  if (lower === 'out of school' || lower === 'out-of-school' || lower === 'graduated') {
    return {
      currentClass: raw,
      nextClass: 'out-of-school',
      isChanged: raw.toLowerCase() !== 'out-of-school',
      isGraduated: true,
    };
  }

  // 2. Senior Secondary: SS 1-3
  if (/^(ss|sss|senior secondary)\s*3$/i.test(lower) || lower === 'ss3' || lower === 'sss3') {
    return {
      currentClass: raw,
      nextClass: 'out-of-school',
      isChanged: true,
      isGraduated: true,
    };
  }
  if (/^(ss|sss|senior secondary)\s*2$/i.test(lower) || lower === 'ss2' || lower === 'sss2') {
    return {
      currentClass: raw,
      nextClass: 'SS 3',
      isChanged: true,
      isGraduated: false,
    };
  }
  if (/^(ss|sss|senior secondary)\s*1$/i.test(lower) || lower === 'ss1' || lower === 'sss1') {
    return {
      currentClass: raw,
      nextClass: 'SS 2',
      isChanged: true,
      isGraduated: false,
    };
  }

  // 3. Junior Secondary: JSS 1-3
  if (/^(jss|junior secondary|js)\s*3$/i.test(lower) || lower === 'jss3') {
    return {
      currentClass: raw,
      nextClass: 'SS 1',
      isChanged: true,
      isGraduated: false,
    };
  }
  if (/^(jss|junior secondary|js)\s*2$/i.test(lower) || lower === 'jss2') {
    return {
      currentClass: raw,
      nextClass: 'JSS 3',
      isChanged: true,
      isGraduated: false,
    };
  }
  if (/^(jss|junior secondary|js)\s*1$/i.test(lower) || lower === 'jss1') {
    return {
      currentClass: raw,
      nextClass: 'JSS 2',
      isChanged: true,
      isGraduated: false,
    };
  }

  // 4. Primary: Pry 1-6 / Basic 1-6 / Primary 1-6
  if (/^(pry|primary|basic|pri|p)\s*6$/i.test(lower) || lower === 'p6') {
    return {
      currentClass: raw,
      nextClass: 'JSS 1',
      isChanged: true,
      isGraduated: false,
    };
  }
  if (/^(pry|primary|basic|pri|p)\s*5$/i.test(lower) || lower === 'p5') {
    return {
      currentClass: raw,
      nextClass: 'Pry 6',
      isChanged: true,
      isGraduated: false,
    };
  }
  if (/^(pry|primary|basic|pri|p)\s*4$/i.test(lower) || lower === 'p4') {
    return {
      currentClass: raw,
      nextClass: 'Pry 5',
      isChanged: true,
      isGraduated: false,
    };
  }
  if (/^(pry|primary|basic|pri|p)\s*3$/i.test(lower) || lower === 'p3') {
    return {
      currentClass: raw,
      nextClass: 'Pry 4',
      isChanged: true,
      isGraduated: false,
    };
  }
  if (/^(pry|primary|basic|pri|p)\s*2$/i.test(lower) || lower === 'p2') {
    return {
      currentClass: raw,
      nextClass: 'Pry 3',
      isChanged: true,
      isGraduated: false,
    };
  }
  if (/^(pry|primary|basic|pri|p)\s*1$/i.test(lower) || lower === 'p1') {
    return {
      currentClass: raw,
      nextClass: 'Pry 2',
      isChanged: true,
      isGraduated: false,
    };
  }

  // Fallback for unmapped classes
  return {
    currentClass: raw,
    nextClass: raw,
    isChanged: false,
    isGraduated: false,
  };
}

/**
 * Runs a dry-run simulation of student promotions across the database without saving changes.
 */
export async function simulateAcademicPromotion(): Promise<PromotionSimulationResult> {
  await connectDB();

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}/${currentYear + 1}`;

  // Only students who are active and not deleted
  const students = await Patron.find({
    patronType: 'student',
    isDeleted: { $ne: true },
  }).select('firstname surname barcode studentSchoolInfo').lean();

  let promotedCount = 0;
  let graduatedCount = 0;
  let unchangedCount = 0;

  const transitionMap = new Map<string, TransitionBucket>();

  for (const s of students) {
    const rawClass = s.studentSchoolInfo?.currentClass || 'Unassigned';
    const resolution = promoteClass(rawClass);

    if (resolution.isGraduated && resolution.isChanged) {
      graduatedCount++;
    } else if (resolution.isChanged) {
      promotedCount++;
    } else {
      unchangedCount++;
    }

    const key = `${resolution.currentClass} -> ${resolution.nextClass}`;
    const studentName = `${s.firstname} ${s.surname} (${s.barcode})`;

    if (!transitionMap.has(key)) {
      transitionMap.set(key, {
        fromClass: resolution.currentClass,
        toClass: resolution.nextClass,
        count: 1,
        sampleStudents: [studentName],
      });
    } else {
      const bucket = transitionMap.get(key)!;
      bucket.count++;
      if (bucket.sampleStudents.length < 5) {
        bucket.sampleStudents.push(studentName);
      }
    }
  }

  const transitions = Array.from(transitionMap.values()).sort((a, b) => b.count - a.count);

  return {
    academicYear,
    totalStudents: students.length,
    promotedCount,
    graduatedCount,
    unchangedCount,
    transitions,
  };
}

/**
 * Executes the annual student class promotions across all student patrons.
 * Strictly preserves non-student accounts and existing out-of-school patrons.
 */
export async function executeAcademicPromotion(
  executedByUsername: string,
  executedByRole: string
): Promise<PromotionExecutionResult> {
  await connectDB();

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}/${currentYear + 1}`;
  const now = new Date();

  const students = await Patron.find({
    patronType: 'student',
    isDeleted: { $ne: true },
  });

  let promotedCount = 0;
  let graduatedCount = 0;
  let unchangedCount = 0;

  const transitionMap = new Map<string, TransitionBucket>();

  for (const student of students) {
    const currentClass = student.studentSchoolInfo?.currentClass || 'Unassigned';
    const resolution = promoteClass(currentClass);

    if (resolution.isChanged) {
      if (!student.studentSchoolInfo) {
        student.studentSchoolInfo = { currentClass: resolution.nextClass };
      } else {
        student.studentSchoolInfo.currentClass = resolution.nextClass;
      }
      await student.save();

      if (resolution.isGraduated) {
        graduatedCount++;
      } else {
        promotedCount++;
      }
    } else {
      unchangedCount++;
    }

    const key = `${resolution.currentClass} -> ${resolution.nextClass}`;
    const studentName = `${student.firstname} ${student.surname} (${student.barcode})`;

    if (!transitionMap.has(key)) {
      transitionMap.set(key, {
        fromClass: resolution.currentClass,
        toClass: resolution.nextClass,
        count: 1,
        sampleStudents: [studentName],
      });
    } else {
      const bucket = transitionMap.get(key)!;
      bucket.count++;
      if (bucket.sampleStudents.length < 5) {
        bucket.sampleStudents.push(studentName);
      }
    }
  }

  // Update SystemSetting record to track this year's run
  await SystemSetting.findByIdAndUpdate(
    'default',
    {
      lastPromotionYear: currentYear,
      lastPromotionDate: now,
      updatedBy: executedByUsername,
    },
    { upsert: true, new: true }
  );

  // Log to AuditLog
  await logAuditEvent({
    action: 'ANNUAL_ACADEMIC_PROMOTION_EXECUTED',
    performedBy: executedByUsername,
    performedByRole: executedByRole,
    targetEntity: 'Patron',
    targetId: 'all_students',
    details: {
      academicYear,
      totalStudents: students.length,
      promotedCount,
      graduatedCount,
      unchangedCount,
    },
  });

  const transitions = Array.from(transitionMap.values()).sort((a, b) => b.count - a.count);

  return {
    academicYear,
    totalStudents: students.length,
    promotedCount,
    graduatedCount,
    unchangedCount,
    transitions,
    executedAt: now.toISOString(),
    executedBy: executedByUsername,
  };
}

/**
 * Checks if annual promotion is eligible to run automatically (on or after August 31st).
 */
export async function checkAnnualPromotionStatus(): Promise<{
  isAugust31Passed: boolean;
  lastPromotionYear?: number;
  lastPromotionDate?: string | null;
  needsPromotionThisYear: boolean;
}> {
  await connectDB();
  const setting = await SystemSetting.findById('default');
  const now = new Date();
  const currentYear = now.getFullYear();

  // August is month index 7 (0-indexed). August 31st = month 7, day 31
  const isAugust31Passed =
    now.getMonth() > 7 || (now.getMonth() === 7 && now.getDate() >= 31);

  const lastYear = setting?.lastPromotionYear;
  const needsPromotionThisYear = isAugust31Passed && (!lastYear || lastYear < currentYear);

  return {
    isAugust31Passed,
    lastPromotionYear: lastYear,
    lastPromotionDate: setting?.lastPromotionDate ? setting.lastPromotionDate.toISOString() : null,
    needsPromotionThisYear,
  };
}
