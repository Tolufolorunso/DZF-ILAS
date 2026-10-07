import { connectDB } from '@/lib/db';
import { User, Patron, Cataloging, Cohort } from '@/models';
import { getSessionUser } from '@/lib/auth/session';
import HomePageClient, { HomeStatData, RealBookItem, StaffItem } from './HomePageClient';

export const metadata = {
  title: 'DZF-ILAS | Dzuels Integrated Library & Administrative System',
  description:
    'Central academic library, cataloging, barcode identity, and administration platform for Dzuels Educational Foundation.',
};

export const dynamic = 'force-dynamic';

interface LeanBookDoc {
  _id: unknown;
  title?: { mainTitle?: string };
  author?: { mainAuthor?: string };
  barcode?: string;
  classification?: string;
}

interface LeanStaffDoc {
  _id: unknown;
  name?: string;
  role?: string;
  username: string;
  dateOfBirth?: Date | string;
  birthMonth?: number;
  birthDay?: number;
}

export default async function HomePage() {
  const user = await getSessionUser();

  // Baseline real database metrics
  let stats: HomeStatData = {
    books: 0,
    patrons: 0,
    cohorts: 0,
    staff: 0,
  };

  let recentBooks: RealBookItem[] = [];
  let staffList: StaffItem[] = [];

  try {
    await connectDB();

    const [booksCount, patronsCount, cohortsCount, staffUsers, books] = await Promise.all([
      Cataloging.countDocuments(),
      Patron.countDocuments(),
      Cohort.countDocuments(),
      User.find({ active: true }).select('name role username dateOfBirth birthMonth birthDay').lean(),
      Cataloging.find().sort({ _id: -1 }).limit(6).select('title author barcode classification').lean(),
    ]);

    stats = {
      books: booksCount || 0,
      patrons: patronsCount || 0,
      cohorts: cohortsCount || 0,
      staff: staffUsers.length || 0,
    };

    recentBooks = ((books as unknown as LeanBookDoc[]) || []).map((b) => ({
      id: String(b._id),
      title: b.title?.mainTitle || 'Monograph Item',
      author: b.author?.mainAuthor || 'DZF Collection',
      barcode: b.barcode || 'N/A',
      classification: b.classification || '800',
    }));

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const mappedStaff: StaffItem[] = ((staffUsers as unknown as LeanStaffDoc[]) || []).map((s) => {
      let isToday = false;
      let birthdayText: string | undefined = undefined;

      let bMonth: number | undefined = undefined;
      let bDay: number | undefined = undefined;

      if (s.birthMonth && s.birthDay) {
        bMonth = s.birthMonth - 1; // 0-indexed month
        bDay = s.birthDay;
      } else if (s.dateOfBirth) {
        const d = new Date(s.dateOfBirth);
        if (!isNaN(d.getTime())) {
          bMonth = d.getMonth();
          bDay = d.getDate();
        }
      }

      if (bMonth !== undefined && bDay !== undefined) {
        if (bMonth === currentMonth && bDay === currentDay) {
          isToday = true;
          birthdayText = 'Celebrating Today!';
        } else {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          birthdayText = `${months[bMonth]} ${bDay}`;
        }
      }

      return {
        id: String(s._id),
        name: s.name || s.username,
        role: s.role || 'Staff',
        username: s.username,
        isToday,
        birthdayText,
      };
    });

    // Show only ONE staff member: the birthday celebrant today or the upcoming birthday
    const celebrantToday = mappedStaff.find((s) => s.isToday);
    if (celebrantToday) {
      staffList = [celebrantToday];
    } else {
      const withDates = mappedStaff.filter((s) => s.birthdayText);
      if (withDates.length > 0) {
        staffList = [withDates[0]];
      } else if (mappedStaff.length > 0) {
        staffList = [{
          ...mappedStaff[0],
          isToday: false,
          birthdayText: 'Upcoming Celebrant',
        }];
      }
    }
  } catch (error) {
    console.error('Failed to load live database data for homepage:', error);
  }

  return (
    <HomePageClient
      stats={stats}
      recentBooks={recentBooks}
      staffList={staffList}
      user={user}
    />
  );
}
