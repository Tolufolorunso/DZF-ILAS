import type { DRNICERValue, TranscommCategory } from '@/models/TranscommArticle';

export type { DRNICERValue, TranscommCategory };

export interface ITranscommArticleData {
  _id: string;
  title: string;
  slug: string;
  category: TranscommCategory;
  drnicerValue?: DRNICERValue;
  readTime: string;
  excerpt: string;
  content: string;
  tags: string[];
  author: string;
  isActive: boolean;
  viewCount: number;
  library: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateArticleInput {
  title: string;
  slug?: string;
  category: TranscommCategory;
  drnicerValue?: DRNICERValue;
  excerpt: string;
  content: string;
  tags?: string[] | string;
  author: string;
  isActive?: boolean;
  readTime?: string;
  library?: string;
}

export interface IUpdateArticleInput {
  title?: string;
  slug?: string;
  category?: TranscommCategory;
  drnicerValue?: DRNICERValue;
  excerpt?: string;
  content?: string;
  tags?: string[] | string;
  author?: string;
  isActive?: boolean;
  readTime?: string;
}

export interface IArticleListQuery {
  category?: TranscommCategory | string;
  drnicerValue?: DRNICERValue | string;
  search?: string;
  status?: 'active' | 'draft' | 'all';
  page?: number;
  limit?: number;
  sort?: 'newest' | 'popular' | 'title';
}

export interface IPaginatedArticles {
  items: ITranscommArticleData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IDRNICERPillarMeta {
  pillar: DRNICERValue;
  letter: string;
  title: string;
  tagline: string;
  description: string;
  accentColor: string;
  bgLight: string;
}

export const DRNICER_PILLARS: Record<DRNICERValue, IDRNICERPillarMeta> = {
  Discipline: {
    pillar: 'Discipline',
    letter: 'D',
    title: 'Discipline',
    tagline: 'Self-control, focus, and adherence to academic rigor',
    description: 'The foundation of all scholarly pursuit and personal mastery.',
    accentColor: '#17324d', // Scholastic Navy
    bgLight: 'rgba(23, 50, 77, 0.08)',
  },
  Respect: {
    pillar: 'Respect',
    letter: 'R',
    title: 'Respect',
    tagline: 'Regard for the dignity and perspectives of every individual',
    description: 'Treating peers, teachers, and library patrons with honour and consideration.',
    accentColor: '#6f1111', // Brand Maroon
    bgLight: 'rgba(111, 17, 17, 0.08)',
  },
  Nobility: {
    pillar: 'Nobility',
    letter: 'N',
    title: 'Nobility',
    tagline: 'High moral character and purposeful community leadership',
    description: 'Carrying oneself with grace, honour, and civic responsibility.',
    accentColor: '#9333ea', // Royal Purple
    bgLight: 'rgba(147, 51, 234, 0.08)',
  },
  Integrity: {
    pillar: 'Integrity',
    letter: 'I',
    title: 'Integrity',
    tagline: 'Uncompromising honesty and ethical consistency',
    description: 'Upholding truthful research, academic originality, and accountability.',
    accentColor: '#0d9488', // Emerald/Teal
    bgLight: 'rgba(13, 148, 136, 0.08)',
  },
  Compassion: {
    pillar: 'Compassion',
    letter: 'C',
    title: 'Compassion',
    tagline: 'Empathetic action to uplift and serve our learners',
    description: 'Extending generosity and patience to peers developing their literacy.',
    accentColor: '#e11d48', // Rose
    bgLight: 'rgba(225, 29, 72, 0.08)',
  },
  Excellence: {
    pillar: 'Excellence',
    letter: 'E',
    title: 'Excellence',
    tagline: 'Relentless dedication to the highest standards of scholarship',
    description: 'Never settling for mediocre work in reading, writing, and digital inquiry.',
    accentColor: '#cca349', // Academic Gold
    bgLight: 'rgba(204, 163, 73, 0.12)',
  },
  Responsibility: {
    pillar: 'Responsibility',
    letter: 'R',
    title: 'Responsibility',
    tagline: 'Ownership of actions, shared resources, and academic tools',
    description: 'Protecting library collections, mentoring juniors, and keeping commitments.',
    accentColor: '#2563eb', // Academic Blue
    bgLight: 'rgba(37, 99, 235, 0.08)',
  },
};

export const TRANSCOMM_CATEGORY_CONFIG: Record<
  TranscommCategory,
  { label: string; description: string }
> = {
  'drnicer-values': {
    label: 'DRNICER Values',
    description: 'Core institutional pillars guiding character and scholar excellence',
  },
  'leadership-basics': {
    label: 'Leadership Basics',
    description: 'Practical guides on student initiative, ethics, and team direction',
  },
  communication: {
    label: 'Communication',
    description: 'Public speaking, articulate writing, and respectful debate',
  },
  teamwork: {
    label: 'Teamwork',
    description: 'Collaborative projects, peer mentoring, and mutual support',
  },
  'problem-solving': {
    label: 'Problem Solving',
    description: 'Critical analysis, logic puzzles, and structured reasoning',
  },
  confidence: {
    label: 'Confidence',
    description: 'Overcoming stage fright, embracing challenges, and positive self-belief',
  },
  inspiration: {
    label: 'Inspiration',
    description: 'Biographies of African leaders, scholars, and educational reformers',
  },
};
