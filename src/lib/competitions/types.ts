export type CompetitionCategoryCode = 'SS1-3' | 'JSS1-3' | 'P4-6' | 'P1-3';

export interface ICategoryMeta {
  code: CompetitionCategoryCode;
  label: string;
  sublabel: string;
  gradeLevels: string;
}

export const COMPETITION_CATEGORIES: ICategoryMeta[] = [
  {
    code: 'SS1-3',
    label: 'Senior Secondary',
    sublabel: 'SS1 – SS3',
    gradeLevels: 'Senior Secondary 1, 2, 3',
  },
  {
    code: 'JSS1-3',
    label: 'Junior Secondary',
    sublabel: 'JSS1 – JSS3',
    gradeLevels: 'Junior Secondary 1, 2, 3',
  },
  {
    code: 'P4-6',
    label: 'Upper Primary',
    sublabel: 'Primary 4 – 6',
    gradeLevels: 'Primary 4, 5, 6 / Basic 4, 5, 6',
  },
  {
    code: 'P1-3',
    label: 'Lower Primary',
    sublabel: 'Primary 1 – 3',
    gradeLevels: 'Primary 1, 2, 3 / Basic 1, 2, 3',
  },
];

export interface ICompetitionRecentBook {
  title: string;
  grade: number | null;
  teacherVerified: boolean;
  checkinDate?: Date | string;
}

export interface ICompetitionLeaderboardEntry {
  rank: number;
  patronId: string;
  patronBarcode: string;
  patronName: string;
  category: CompetitionCategoryCode | 'Unassigned';
  booksRead: number;
  averageGrade: number;
  teacherVerifiedCount: number;
  totalGradePoints: number;
  recentBooks?: ICompetitionRecentBook[];
}

export interface ICompetitionPodiumEntry {
  rank: 1 | 2 | 3;
  patronId: string;
  patronBarcode: string;
  patronName: string;
  category: CompetitionCategoryCode | 'Unassigned';
  booksRead: number;
  averageGrade: number;
  teacherVerifiedCount: number;
}

export interface ICompetitionStats {
  totalParticipants: number;
  totalBooksEvaluated: number;
  overallAverageGrade: number;
  verifiedRate: number;
}

export interface ICategorySummaryItem {
  code: CompetitionCategoryCode;
  label: string;
  count: number;
}

export interface ICompetitionResultData {
  sessionKey: string;
  sessionTitle: string;
  isPublished: boolean;
  publishedAt?: string | null;
  publishedBy?: string;
  selectedCategory: string; // 'ALL' or CompetitionCategoryCode
  categories: ICategorySummaryItem[];
  leaderboard: ICompetitionLeaderboardEntry[];
  podium: ICompetitionPodiumEntry[];
  stats: ICompetitionStats;
}

export interface ICompetitionSessionInfo {
  sessionKey: string;
  title: string;
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  publishedBy?: string;
  totalEntries: number;
  totalParticipants: number;
}

export interface ICreateCompetitionCheckoutInput {
  sessionKey?: string;
  patronBarcode: string;
  bookBarcode?: string;
  bookTitle?: string;
  category?: string;
  checkedOutBy?: string;
}

export interface IProcessCompetitionCheckinInput {
  entryId?: string;
  sessionKey?: string;
  patronBarcode?: string;
  bookBarcode?: string;
  bookTitle?: string;
  category?: string;
  grade: number;
  summary?: string;
  feedback?: string;
  teacherVerified?: boolean;
  teacherVerifiedBy?: string;
  gradedBy?: string;
}

export interface IUpdateCompetitionEntryInput {
  grade?: number;
  summary?: string;
  feedback?: string;
  teacherVerified?: boolean;
  teacherVerifiedBy?: string;
  gradedBy?: string;
  category?: string;
}

export interface ICompetitionEntryItem {
  _id: string;
  sessionKey: string;
  category?: string;
  patronId?: string;
  patronBarcode: string;
  patronName: string;
  bookBarcode?: string;
  bookTitle: string;
  checkoutDate: string;
  checkinDate?: string;
  status: string;
  grade?: number | null;
  summary?: string;
  feedback?: string;
  teacherVerified?: boolean;
  teacherVerifiedBy?: string;
  gradedBy?: string;
  checkedOutBy?: string;
}

