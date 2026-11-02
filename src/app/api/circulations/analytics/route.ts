import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import connectDB from '@/lib/db';
import { Library } from '@/models/Library';
import { Cataloging, ICatalogingDocument } from '@/models/Cataloging';
import { Patron, IPatronDocument } from '@/models/Patron';

const DEWEY_CLASSES: Record<string, string> = {
  '000': 'Computer Science, Knowledge & General Works',
  '100': 'Philosophy & Psychology',
  '200': 'Religion',
  '300': 'Social Sciences',
  '400': 'Language & Linguistics',
  '500': 'Science & Mathematics',
  '600': 'Technology & Applied Sciences',
  '700': 'Arts & Recreation',
  '800': 'Literature & Rhetoric',
  '900': 'History & Geography',
};

function getDeweyClassBucket(classification?: string): { code: string; label: string } {
  if (!classification) {
    return { code: 'Other', label: 'General / Unclassified' };
  }
  const match = classification.trim().match(/^(\d)/);
  if (match) {
    const code = `${match[1]}00`;
    return { code, label: DEWEY_CLASSES[code] || `Class ${code}` };
  }
  return { code: 'Other', label: 'General / Unclassified' };
}

function formatDateLabel(date: Date, interval: 'day' | 'week' | 'month'): string {
  if (interval === 'day') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (interval === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  // week
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

interface UnifiedLoanRecord {
  id: string;
  bookId?: string;
  bookBarcode: string;
  bookTitle: string;
  author: string;
  classification: string;
  copiesAvailable: number;
  copiesTotal: number;
  patronId?: string;
  patronBarcode: string;
  patronName: string;
  patronType: string;
  classGrade?: string;
  issueDate?: Date;
  dueDate?: Date;
  returnDate?: Date;
  status: string;
  pointsAwarded?: number;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getSessionUser(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const unitParam = searchParams.get('unit') || 'months';
    const amountParam = parseInt(searchParams.get('amount') || '1', 10);
    const granularityParam = searchParams.get('granularity') as 'month' | 'week' | 'day' | null;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const amount = Number.isFinite(amountParam) && amountParam > 0 ? amountParam : 1;
    const now = new Date();
    let toDate = endDateParam ? new Date(endDateParam) : now;
    if (isNaN(toDate.getTime())) toDate = now;

    let fromDate: Date;
    if (startDateParam) {
      fromDate = new Date(startDateParam);
      if (isNaN(fromDate.getTime())) {
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      }
    } else if (unitParam === 'all') {
      fromDate = new Date(0);
    } else if (unitParam === 'weeks') {
      fromDate = new Date(toDate.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
    } else {
      // months default
      fromDate = new Date(toDate.getFullYear(), toDate.getMonth() - amount, toDate.getDate(), toDate.getHours(), toDate.getMinutes(), toDate.getSeconds());
    }

    // Determine interval (granularity)
    let interval: 'day' | 'week' | 'month';
    if (granularityParam === 'month' || granularityParam === 'week' || granularityParam === 'day') {
      interval = granularityParam;
    } else if (unitParam === 'weeks') {
      interval = amount === 1 ? 'day' : 'week';
    } else if (unitParam === 'months') {
      interval = 'month';
    } else {
      // all
      interval = 'month';
    }

    // 1. Fetch loans from Library collection in period
    const libraryLoans = await Library.find({
      $or: [
        { issueDate: { $gte: fromDate, $lte: toDate } },
        { returnDate: { $gte: fromDate, $lte: toDate } },
      ],
    })
      .populate<{ bookId: ICatalogingDocument }>('bookId')
      .populate<{ patronId: IPatronDocument }>('patronId')
      .lean();

    // Map existing Library records into unified structure
    const unifiedLoansMap = new Map<string, UnifiedLoanRecord>();

    for (const l of libraryLoans) {
      const bookDoc = l.bookId as ICatalogingDocument | undefined;
      const patronDoc = l.patronId as IPatronDocument | undefined;

      let title = l.bookTitle || 'Untitled Book';
      let author = 'Unknown Author';
      let classification = 'Unclassified';
      let copiesAvailable = 0;
      let copiesTotal = 1;

      if (bookDoc) {
        if (typeof bookDoc.title === 'string') title = bookDoc.title;
        else if (bookDoc.title?.mainTitle) title = bookDoc.title.mainTitle;

        if (typeof bookDoc.author === 'string') author = bookDoc.author;
        else if (bookDoc.author?.mainAuthor) author = bookDoc.author.mainAuthor;

        if (bookDoc.classification) classification = bookDoc.classification;
        copiesAvailable = bookDoc.copiesAvailable ?? 0;
        copiesTotal = bookDoc.copiesTotal ?? 1;
      }

      const pType = patronDoc?.patronType || 'student';
      const pName = patronDoc ? `${patronDoc.firstname} ${patronDoc.surname}` : 'Patron';
      const classGrade = patronDoc?.studentSchoolInfo?.currentClass;

      const recordKey = `${l.bookBarcode || 'book'}_${l.issueDate ? new Date(l.issueDate).getTime() : l._id}`;

      unifiedLoansMap.set(recordKey, {
        id: l._id.toString(),
        bookId: bookDoc?._id?.toString(),
        bookBarcode: l.bookBarcode || bookDoc?.barcode || '',
        bookTitle: title,
        author,
        classification,
        copiesAvailable,
        copiesTotal,
        patronId: patronDoc?._id?.toString(),
        patronBarcode: l.patronBarcode || patronDoc?.barcode || '',
        patronName: pName,
        patronType: pType,
        classGrade,
        issueDate: l.issueDate ? new Date(l.issueDate) : undefined,
        dueDate: l.dueDate ? new Date(l.dueDate) : undefined,
        returnDate: l.returnDate ? new Date(l.returnDate) : undefined,
        status: l.status || (l.returnDate ? 'returned' : 'borrowed'),
        pointsAwarded: l.pointsAwarded,
      });
    }

    // 2. Fetch historical loans from Cataloging.patronsCheckedOutHistory
    const catalogingsWithHistory = await Cataloging.find({
      $or: [
        { 'patronsCheckedOutHistory.checkedOutAt': { $gte: fromDate, $lte: toDate } },
        { 'patronsCheckedOutHistory.returnedAt': { $gte: fromDate, $lte: toDate } },
      ],
    }).lean();

    // Collect patron barcodes/IDs needing lookup
    const missingPatronBarcodes = new Set<string>();
    for (const b of catalogingsWithHistory) {
      for (const h of b.patronsCheckedOutHistory || []) {
        if (h.barcode) missingPatronBarcodes.add(h.barcode);
      }
    }

    const patronLookupMap = new Map<string, IPatronDocument>();
    if (missingPatronBarcodes.size > 0) {
      const foundPatrons = await Patron.find({ barcode: { $in: Array.from(missingPatronBarcodes) } }).lean();
      for (const p of foundPatrons) {
        if (p.barcode) patronLookupMap.set(p.barcode, p as unknown as IPatronDocument);
      }
    }

    // Merge Cataloging historical checkouts
    for (const b of catalogingsWithHistory) {
      let title = 'Untitled Book';
      if (typeof b.title === 'string') title = b.title;
      else if (b.title?.mainTitle) title = b.title.mainTitle;

      let author = 'Unknown Author';
      if (typeof b.author === 'string') author = b.author;
      else if (b.author?.mainAuthor) author = b.author.mainAuthor;

      const classification = b.classification || 'Unclassified';
      const copiesAvailable = b.copiesAvailable ?? 0;
      const copiesTotal = b.copiesTotal ?? 1;

      for (const h of b.patronsCheckedOutHistory || []) {
        const issueDate = h.checkedOutAt ? new Date(h.checkedOutAt) : undefined;
        const returnDate = h.returnedAt ? new Date(h.returnedAt) : undefined;
        const dueDate = h.dueDate ? new Date(h.dueDate) : undefined;

        // Check if inside date window
        const issueInRange = issueDate && issueDate >= fromDate && issueDate <= toDate;
        const returnInRange = returnDate && returnDate >= fromDate && returnDate <= toDate;
        if (!issueInRange && !returnInRange) continue;

        // Check for deduplication with Library records
        const approxTime = issueDate ? issueDate.getTime() : 0;
        let isDuplicate = false;
        for (const existing of unifiedLoansMap.values()) {
          if (
            existing.bookBarcode === b.barcode &&
            existing.issueDate &&
            Math.abs(existing.issueDate.getTime() - approxTime) < 60000
          ) {
            isDuplicate = true;
            // Update returnDate or metadata if Library record lacked it
            if (!existing.returnDate && returnDate) {
              existing.returnDate = returnDate;
              existing.status = 'returned';
            }
            break;
          }
        }

        if (!isDuplicate) {
          const matchedPatron = h.barcode ? patronLookupMap.get(h.barcode) : undefined;
          const pType = matchedPatron?.patronType || 'student';
          const pName = h.fullname || (matchedPatron ? `${matchedPatron.firstname} ${matchedPatron.surname}` : 'Patron');
          const classGrade = matchedPatron?.studentSchoolInfo?.currentClass;

          const recordKey = `cat_${b.barcode}_${approxTime}_${h.barcode || ''}`;
          unifiedLoansMap.set(recordKey, {
            id: recordKey,
            bookId: b._id.toString(),
            bookBarcode: b.barcode,
            bookTitle: title,
            author,
            classification,
            copiesAvailable,
            copiesTotal,
            patronId: h.checkedOutBy ? h.checkedOutBy.toString() : undefined,
            patronBarcode: h.barcode || '',
            patronName: pName,
            patronType: pType,
            classGrade,
            issueDate,
            dueDate,
            returnDate,
            status: returnDate ? 'returned' : 'borrowed',
            pointsAwarded: returnDate && dueDate && returnDate <= dueDate ? 3 : 0,
          });
        }
      }
    }

    const allUnifiedLoans = Array.from(unifiedLoansMap.values());

    // Filter checkouts in period and returns in period
    const checkoutsInPeriod = allUnifiedLoans.filter(
      (l) => l.issueDate && l.issueDate >= fromDate && l.issueDate <= toDate
    );
    const returnsInPeriod = allUnifiedLoans.filter(
      (l) => l.returnDate && l.returnDate >= fromDate && l.returnDate <= toDate
    );

    // Active overdues across the library system right now
    const activeOverdues = await Library.countDocuments({
      status: { $in: ['borrowed', 'overdue'] },
      dueDate: { $lt: now },
    });

    // 4. Summary Calculations
    const totalCheckouts = checkoutsInPeriod.length;
    const totalReturns = returnsInPeriod.length;

    let onTimeReturns = 0;
    let lateReturns = 0;
    let totalLoanDaysSum = 0;
    let validDurationCount = 0;

    let onTime3Pts = 0;
    let grace1Pt = 0;
    let overdue0Pts = 0;

    for (const ret of returnsInPeriod) {
      if (ret.returnDate && ret.dueDate) {
        const retTime = ret.returnDate.getTime();
        const dueTime = ret.dueDate.getTime();
        if (retTime <= dueTime) {
          onTimeReturns++;
        } else {
          lateReturns++;
        }
      }

      if (ret.returnDate && ret.issueDate) {
        const durationDays = (ret.returnDate.getTime() - ret.issueDate.getTime()) / (1000 * 60 * 60 * 24);
        if (durationDays >= 0) {
          totalLoanDaysSum += durationDays;
          validDurationCount++;
        }
      }

      const pts = ret.pointsAwarded ?? (ret.returnDate && ret.dueDate && ret.returnDate <= ret.dueDate ? 3 : 0);
      if (pts >= 3) onTime3Pts++;
      else if (pts === 1) grace1Pt++;
      else overdue0Pts++;
    }

    const onTimeRate = totalReturns > 0 ? Math.round((onTimeReturns / totalReturns) * 1000) / 10 : 100;
    const delinquencyRate = totalCheckouts > 0 ? Math.round((activeOverdues / totalCheckouts) * 1000) / 10 : 0;
    const averageLoanDays = validDurationCount > 0 ? Math.round((totalLoanDaysSum / validDurationCount) * 10) / 10 : 5;

    // 5. Volume Trends Breakdown - Continuous Seeding
    let trendStart = fromDate;
    if (unitParam === 'all') {
      let earliest = toDate;
      for (const loan of allUnifiedLoans) {
        if (loan.issueDate && loan.issueDate < earliest) earliest = loan.issueDate;
        if (loan.returnDate && loan.returnDate < earliest) earliest = loan.returnDate;
      }
      trendStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    }

    interface TrendBucket {
      dateKey: string;
      label: string;
      start: Date;
      end: Date;
      checkouts: number;
      returns: number;
      timestamp: number;
    }

    const bucketList: TrendBucket[] = [];

    if (interval === 'day') {
      const cursor = new Date(trendStart);
      while (cursor <= toDate) {
        const start = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 0, 0, 0, 0);
        const end = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 23, 59, 59, 999);
        bucketList.push({
          dateKey: start.toISOString().slice(0, 10),
          label: formatDateLabel(start, 'day'),
          start,
          end,
          checkouts: 0,
          returns: 0,
          timestamp: start.getTime(),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else if (interval === 'week') {
      const cursor = new Date(trendStart);
      while (cursor <= toDate) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 7);
        bucketList.push({
          dateKey: start.toISOString().slice(0, 10),
          label: formatDateLabel(start, 'week'),
          start,
          end,
          checkouts: 0,
          returns: 0,
          timestamp: start.getTime(),
        });
        cursor.setDate(cursor.getDate() + 7);
      }
    } else {
      // interval === 'month'
      const cursor = new Date(trendStart.getFullYear(), trendStart.getMonth(), 1);
      while (cursor <= toDate) {
        const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
        bucketList.push({
          dateKey: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
          label: formatDateLabel(start, 'month'),
          start,
          end,
          checkouts: 0,
          returns: 0,
          timestamp: start.getTime(),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    // Match checkouts into continuous buckets
    for (const loan of checkoutsInPeriod) {
      if (!loan.issueDate) continue;
      const d = loan.issueDate;
      for (let i = 0; i < bucketList.length; i++) {
        const b = bucketList[i];
        const isLast = i === bucketList.length - 1;
        const inRange = isLast ? (d >= b.start && d <= b.end) : (d >= b.start && d < b.end);
        if (inRange) {
          b.checkouts++;
          break;
        }
      }
    }

    // Match returns into continuous buckets
    for (const ret of returnsInPeriod) {
      if (!ret.returnDate) continue;
      const d = ret.returnDate;
      for (let i = 0; i < bucketList.length; i++) {
        const b = bucketList[i];
        const isLast = i === bucketList.length - 1;
        const inRange = isLast ? (d >= b.start && d <= b.end) : (d >= b.start && d < b.end);
        if (inRange) {
          b.returns++;
          break;
        }
      }
    }

    const trends = bucketList
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ dateKey, label, checkouts, returns }) => ({
        dateKey,
        label,
        checkouts,
        returns,
      }));

    // 6. Top Borrowed Books Leaderboard
    interface BookStatsAgg {
      bookId: string;
      title: string;
      author: string;
      barcode: string;
      classification: string;
      checkoutCount: number;
      copiesAvailable: number;
      copiesTotal: number;
    }

    const bookAggMap = new Map<string, BookStatsAgg>();

    for (const loan of checkoutsInPeriod) {
      const bookKey = loan.bookId || loan.bookBarcode || loan.bookTitle;
      if (!bookAggMap.has(bookKey)) {
        bookAggMap.set(bookKey, {
          bookId: loan.bookId || '',
          title: loan.bookTitle,
          author: loan.author,
          barcode: loan.bookBarcode,
          classification: loan.classification,
          checkoutCount: 1,
          copiesAvailable: loan.copiesAvailable,
          copiesTotal: loan.copiesTotal,
        });
      } else {
        bookAggMap.get(bookKey)!.checkoutCount++;
      }
    }

    const topBooks = Array.from(bookAggMap.values())
      .sort((a, b) => b.checkoutCount - a.checkoutCount)
      .slice(0, 10);

    // 7. Patron Demographics Breakdown
    const typeCountMap: Record<string, number> = {
      student: 0,
      teacher: 0,
      staff: 0,
      guest: 0,
    };

    const gradeCountMap: Record<string, number> = {};

    for (const loan of checkoutsInPeriod) {
      const pType = loan.patronType || 'student';
      if (typeCountMap[pType] !== undefined) {
        typeCountMap[pType]++;
      } else {
        typeCountMap.student++;
      }

      if (pType === 'student' && loan.classGrade) {
        const grade = loan.classGrade.trim();
        gradeCountMap[grade] = (gradeCountMap[grade] || 0) + 1;
      }
    }

    const typeLabels: Record<string, string> = {
      student: 'Students',
      teacher: 'Teachers & Educators',
      staff: 'Foundation Staff',
      guest: 'Community Guests',
    };

    const byType = Object.entries(typeCountMap).map(([type, count]) => ({
      type,
      label: typeLabels[type] || type,
      count,
      percentage: totalCheckouts > 0 ? Math.round((count / totalCheckouts) * 1000) / 10 : 0,
    }));

    const byGradeLevel = Object.entries(gradeCountMap)
      .map(([classGrade, count]) => ({ classGrade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 8. Dewey Decimal Distribution
    const deweyCountMap: Record<string, { label: string; count: number }> = {};

    for (const loan of checkoutsInPeriod) {
      const bucket = getDeweyClassBucket(loan.classification);
      if (!deweyCountMap[bucket.code]) {
        deweyCountMap[bucket.code] = { label: bucket.label, count: 1 };
      } else {
        deweyCountMap[bucket.code].count++;
      }
    }

    const deweyCategories = Object.entries(deweyCountMap)
      .map(([deweyClass, val]) => ({
        deweyClass,
        label: val.label,
        count: val.count,
        percentage: totalCheckouts > 0 ? Math.round((val.count / totalCheckouts) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      {
        success: true,
        data: {
          timeHorizon: {
            unit: unitParam,
            amount,
            granularity: interval,
            fromDate: fromDate.toISOString(),
            toDate: toDate.toISOString(),
          },
          summary: {
            totalCheckouts,
            totalReturns,
            onTimeReturns,
            lateReturns,
            onTimeRate,
            activeOverdues,
            delinquencyRate,
            averageLoanDays,
          },
          trends,
          topBooks,
          patronDemographics: {
            byType,
            byGradeLevel,
          },
          deweyCategories,
          gamificationPoints: {
            onTime3Pts,
            grace1Pt,
            overdue0Pts,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/circulations/analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while compiling circulation analytics.' },
      { status: 500 }
    );
  }
}
