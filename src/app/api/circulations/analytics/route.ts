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
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
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
      fromDate = new Date(toDate);
      fromDate.setMonth(fromDate.getMonth() - amount);
    }

    const diffDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));

    // 1. Fetch loans issued in period
    const issuedLoans = await Library.find({
      issueDate: { $gte: fromDate, $lte: toDate },
    })
      .populate<{ bookId: ICatalogingDocument }>('bookId')
      .populate<{ patronId: IPatronDocument }>('patronId')
      .lean();

    // 2. Fetch returns processed in period
    const returnsInPeriod = await Library.find({
      returnDate: { $gte: fromDate, $lte: toDate },
    }).lean();

    // 3. Active overdues across the library system right now
    const activeOverdues = await Library.countDocuments({
      status: { $in: ['borrowed', 'overdue'] },
      dueDate: { $lt: now },
    });

    // 4. Summaries
    const totalCheckouts = issuedLoans.length;
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
        const retTime = new Date(ret.returnDate).getTime();
        const dueTime = new Date(ret.dueDate).getTime();
        if (retTime <= dueTime) {
          onTimeReturns++;
        } else {
          lateReturns++;
        }
      }

      if (ret.returnDate && ret.issueDate) {
        const durationDays = (new Date(ret.returnDate).getTime() - new Date(ret.issueDate).getTime()) / (1000 * 60 * 60 * 24);
        if (durationDays >= 0) {
          totalLoanDaysSum += durationDays;
          validDurationCount++;
        }
      }

      const pts = ret.pointsAwarded ?? 0;
      if (pts >= 3) onTime3Pts++;
      else if (pts === 1) grace1Pt++;
      else overdue0Pts++;
    }

    const onTimeRate = totalReturns > 0 ? Math.round((onTimeReturns / totalReturns) * 1000) / 10 : 100;
    const delinquencyRate = totalCheckouts > 0 ? Math.round((activeOverdues / totalCheckouts) * 1000) / 10 : 0;
    const averageLoanDays = validDurationCount > 0 ? Math.round((totalLoanDaysSum / validDurationCount) * 10) / 10 : 5;

    // 5. Volume Trends Breakdown
    let interval: 'day' | 'week' | 'month' = 'month';
    if (diffDays <= 14) {
      interval = 'day';
    } else if (diffDays <= 70) {
      interval = 'week';
    } else {
      interval = 'month';
    }

    const trendMap = new Map<string, { label: string; checkouts: number; returns: number; timestamp: number }>();

    // Seed empty buckets across the horizon so the trend curve has continuous points
    const cursor = new Date(fromDate);
    if (interval === 'day') {
      while (cursor <= toDate) {
        const key = cursor.toISOString().slice(0, 10);
        trendMap.set(key, {
          label: formatDateLabel(cursor, 'day'),
          checkouts: 0,
          returns: 0,
          timestamp: cursor.getTime(),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else if (interval === 'week') {
      while (cursor <= toDate) {
        const key = cursor.toISOString().slice(0, 10);
        trendMap.set(key, {
          label: formatDateLabel(cursor, 'week'),
          checkouts: 0,
          returns: 0,
          timestamp: cursor.getTime(),
        });
        cursor.setDate(cursor.getDate() + 7);
      }
    } else {
      // month
      cursor.setDate(1);
      while (cursor <= toDate) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        trendMap.set(key, {
          label: formatDateLabel(cursor, 'month'),
          checkouts: 0,
          returns: 0,
          timestamp: cursor.getTime(),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    // Populate checkouts into buckets
    for (const loan of issuedLoans) {
      if (!loan.issueDate) continue;
      const d = new Date(loan.issueDate);
      let key: string;
      if (interval === 'day') {
        key = d.toISOString().slice(0, 10);
      } else if (interval === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Find closest week bucket
        const diffFromStart = Math.floor((d.getTime() - fromDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekDate = new Date(fromDate.getTime() + diffFromStart * 7 * 24 * 60 * 60 * 1000);
        key = weekDate.toISOString().slice(0, 10);
      }

      if (trendMap.has(key)) {
        trendMap.get(key)!.checkouts++;
      } else {
        trendMap.set(key, {
          label: formatDateLabel(d, interval),
          checkouts: 1,
          returns: 0,
          timestamp: d.getTime(),
        });
      }
    }

    // Populate returns into buckets
    for (const ret of returnsInPeriod) {
      if (!ret.returnDate) continue;
      const d = new Date(ret.returnDate);
      let key: string;
      if (interval === 'day') {
        key = d.toISOString().slice(0, 10);
      } else if (interval === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        const diffFromStart = Math.floor((d.getTime() - fromDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekDate = new Date(fromDate.getTime() + diffFromStart * 7 * 24 * 60 * 60 * 1000);
        key = weekDate.toISOString().slice(0, 10);
      }

      if (trendMap.has(key)) {
        trendMap.get(key)!.returns++;
      } else {
        trendMap.set(key, {
          label: formatDateLabel(d, interval),
          checkouts: 0,
          returns: 1,
          timestamp: d.getTime(),
        });
      }
    }

    const trends = Array.from(trendMap.entries())
      .map(([dateKey, val]) => ({
        dateKey,
        label: val.label,
        checkouts: val.checkouts,
        returns: val.returns,
        timestamp: val.timestamp,
      }))
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

    for (const loan of issuedLoans) {
      const bookDoc = loan.bookId as ICatalogingDocument | undefined;
      const bookKey = bookDoc?._id?.toString() || loan.bookBarcode || 'unknown-book';

      if (!bookAggMap.has(bookKey)) {
        let title = loan.bookTitle || 'Untitled Book';
        let author = 'Unknown Author';
        let classification = 'Unclassified';
        let copiesAvailable = 0;
        let copiesTotal = 1;

        if (bookDoc) {
          if (typeof bookDoc.title === 'string') {
            title = bookDoc.title;
          } else if (bookDoc.title && typeof bookDoc.title === 'object' && bookDoc.title.mainTitle) {
            title = bookDoc.title.mainTitle;
          }

          if (bookDoc.author) {
            if (typeof bookDoc.author === 'string') {
              author = bookDoc.author;
            } else if (bookDoc.author.mainAuthor) {
              author = bookDoc.author.mainAuthor;
            }
          }

          if (bookDoc.classification) classification = bookDoc.classification;
          copiesAvailable = bookDoc.copiesAvailable ?? 0;
          copiesTotal = bookDoc.copiesTotal ?? 1;
        }

        bookAggMap.set(bookKey, {
          bookId: bookDoc?._id?.toString() || '',
          title,
          author,
          barcode: loan.bookBarcode || bookDoc?.barcode || '',
          classification,
          checkoutCount: 1,
          copiesAvailable,
          copiesTotal,
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

    for (const loan of issuedLoans) {
      const patronDoc = loan.patronId as IPatronDocument | undefined;
      const pType = patronDoc?.patronType || 'student';
      if (typeCountMap[pType] !== undefined) {
        typeCountMap[pType]++;
      } else {
        typeCountMap.student++;
      }

      if (pType === 'student' && patronDoc?.studentSchoolInfo?.currentClass) {
        const grade = patronDoc.studentSchoolInfo.currentClass.trim();
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

    for (const loan of issuedLoans) {
      const bookDoc = loan.bookId as ICatalogingDocument | undefined;
      const cls = bookDoc?.classification;
      const bucket = getDeweyClassBucket(cls);

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

