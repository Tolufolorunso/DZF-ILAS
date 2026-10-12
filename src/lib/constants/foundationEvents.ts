/**
 * Official annual event presets and grade-band literacy tracks
 * established by the Dzuels Educational Foundation.
 */

export interface AnnualEventPreset {
  name: string;
  slug: string;
  month: number; // 1 - 12
  monthLabel: string;
  category: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
  targetAudience: string;
  description: string;
  competitionType?: 'reading' | 'writing' | 'speaking' | 'essay' | 'spelling' | 'listening' | 'other';
  defaultPoints: number;
}

export interface LiteracyGradeBandPreset {
  id: string;
  name: string;
  gradeBand: string;
  targetAudience: string;
  defaultPoints: number;
  description: string;
}

export const ANNUAL_FOUNDATION_EVENTS: AnnualEventPreset[] = [
  {
    name: 'World Education Day',
    slug: 'world-education-day',
    month: 1,
    monthLabel: 'January',
    category: 'assembly',
    targetAudience: 'All Registered Patrons, Students & Community',
    description: 'Global observance honoring education as a fundamental human right, dignity milestone, and public good.',
    defaultPoints: 5,
  },
  {
    name: 'Spelling Bee - Elementary',
    slug: 'spelling-bee-elementary',
    month: 2,
    monthLabel: 'February',
    category: 'competition',
    targetAudience: 'Elementary Students (Primary 1-6)',
    description: 'Foundational primary school spelling bee testing phonics, orthography, and academic vocabulary.',
    competitionType: 'spelling',
    defaultPoints: 10,
  },
  {
    name: 'Spelling Bee - High School',
    slug: 'spelling-bee-high-school',
    month: 3,
    monthLabel: 'March',
    category: 'competition',
    targetAudience: 'Secondary School Students (JSS 1-3 & SS 1-3)',
    description: 'Challenging high school spelling competition testing advanced etymology, diction, and linguistic mastery.',
    competitionType: 'spelling',
    defaultPoints: 10,
  },
  {
    name: 'World Reading Book Day (Reading Competition)',
    slug: 'world-reading-book-day',
    month: 4,
    monthLabel: 'April',
    category: 'competition',
    targetAudience: 'All Registered Patrons & Students',
    description: 'Annual reading marathon, literary appreciation gala, comprehension rounds, and reading tournament.',
    competitionType: 'reading',
    defaultPoints: 10,
  },
  {
    name: 'UN Day Of Boy Child',
    slug: 'un-day-of-boy-child',
    month: 5,
    monthLabel: 'May',
    category: 'workshop',
    targetAudience: 'Male Students, Youth & Community Mentors',
    description: 'Advocacy summit championing male youth mentorship, psychological well-being, literacy, and ethical leadership.',
    defaultPoints: 5,
  },
  {
    name: 'Career Week',
    slug: 'career-week',
    month: 6,
    monthLabel: 'June',
    category: 'workshop',
    targetAudience: 'Senior Students (SS 1-3) & Leavers',
    description: 'Vocational orientation, university pathway discovery, professional keynote sessions, and career counseling.',
    defaultPoints: 5,
  },
  {
    name: 'Ijero Tech Day',
    slug: 'ijero-tech-day',
    month: 6,
    monthLabel: 'June',
    category: 'workshop',
    targetAudience: 'Tech Cohort Scholars, Students & General Public',
    description: 'Annual foundation flagship exhibition showcasing digital literacy cohorts, robotics, coding, and software projects.',
    defaultPoints: 10,
  },
  {
    name: 'UN Day Against Drug Abuse & Trafficking',
    slug: 'un-day-against-drug-abuse',
    month: 6,
    monthLabel: 'June',
    category: 'assembly',
    targetAudience: 'Teenagers, Youth & Community Members',
    description: 'Community sensitization workshop against illicit substance abuse, peer vulnerability, and crime prevention.',
    defaultPoints: 5,
  },
  {
    name: 'World Literacy Day (Essay Competition)',
    slug: 'world-literacy-day-essay',
    month: 9,
    monthLabel: 'August - September',
    category: 'competition',
    targetAudience: 'Primary & Secondary School Scholars',
    description: 'International celebration of literacy featuring a flagship creative and analytical essay writing competition.',
    competitionType: 'essay',
    defaultPoints: 10,
  },
  {
    name: 'World Day of Charity',
    slug: 'world-day-of-charity',
    month: 9,
    monthLabel: 'September',
    category: 'general',
    targetAudience: 'Foundation Beneficiaries, Donors & Volunteers',
    description: 'Philanthropic outreach, community book drives, civic engagement, and educational supply distribution.',
    defaultPoints: 5,
  },
  {
    name: 'World Teacher Day',
    slug: 'world-teacher-day',
    month: 10,
    monthLabel: 'October',
    category: 'assembly',
    targetAudience: 'Educators, Instructors, School Heads & Staff',
    description: 'Honoring transformative educational leadership, instructor resilience, and classroom pedagogical excellence.',
    defaultPoints: 5,
  },
  {
    name: 'International Day Of the Girl Child',
    slug: 'day-of-the-girl-child',
    month: 10,
    monthLabel: 'October',
    category: 'workshop',
    targetAudience: 'Female Students, Mentors & Women in STEM',
    description: 'Empowerment summit championing girls’ education, digital equity, safety, and leadership development.',
    defaultPoints: 5,
  },
  {
    name: 'UN Human Right Day (Focus On Education)',
    slug: 'un-human-right-day-education',
    month: 12,
    monthLabel: 'December',
    category: 'assembly',
    targetAudience: 'All Foundation Patrons & General Public',
    description: 'Commemoration of the Universal Declaration of Human Rights with central focus on universal access to literacy.',
    defaultPoints: 5,
  },
];

export const LITERACY_GRADE_BANDS: LiteracyGradeBandPreset[] = [
  {
    id: 'early-elementary',
    name: 'Early Elementary',
    gradeBand: 'Primary 1-3',
    targetAudience: 'Lower Basic Students (P1-P3)',
    defaultPoints: 5,
    description: 'Foundational phonics, letter recognition, and early reading fluency.',
  },
  {
    id: 'upper-elementary',
    name: 'Upper Elementary',
    gradeBand: 'Primary 4-6',
    targetAudience: 'Middle Basic Students (P4-P6)',
    defaultPoints: 5,
    description: 'Intermediate grammar, reading comprehension, and digital literacy exploration.',
  },
  {
    id: 'junior-secondary',
    name: 'Junior Secondary',
    gradeBand: 'JSS 1-3',
    targetAudience: 'Junior Secondary Students (JSS1-JSS3)',
    defaultPoints: 5,
    description: 'Critical analysis, essay writing, and core computer application skills.',
  },
  {
    id: 'senior-secondary',
    name: 'Senior Secondary',
    gradeBand: 'SS 1-3',
    targetAudience: 'Senior Secondary Students (SS1-SS3)',
    defaultPoints: 5,
    description: 'Advanced literature, analytical reasoning, and software productivity.',
  },
  {
    id: 'adult-remedial',
    name: 'Adult & Remedial',
    gradeBand: 'Open / Adult',
    targetAudience: 'Adult Scholars & Remedial Learners',
    defaultPoints: 5,
    description: 'Practical functional literacy, communication, and digital empowerment.',
  },
];

export function getAnnualEventBySlug(slug: string): AnnualEventPreset | undefined {
  return ANNUAL_FOUNDATION_EVENTS.find((e) => e.slug === slug);
}

export function getEventsForMonth(month: number): AnnualEventPreset[] {
  return ANNUAL_FOUNDATION_EVENTS.filter((e) => e.month === month);
}
