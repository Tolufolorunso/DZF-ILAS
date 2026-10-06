import { connectDB } from '@/lib/db';
import {
  TranscommArticle,
  ITranscommArticleDocument,
  DRNICERValue,
  TranscommCategory,
} from '@/models/TranscommArticle';
import {
  ITranscommArticleData,
  ICreateArticleInput,
  IUpdateArticleInput,
  IArticleListQuery,
  IPaginatedArticles,
} from './types';
import { estimateReadTime, slugify } from './utils';

export { estimateReadTime, slugify };

/**
 * Format Mongoose TranscommArticle document into JSON-serializable ITranscommArticleData
 */
export function serializeArticle(
  doc: ITranscommArticleDocument
): ITranscommArticleData {
  return {
    _id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    category: doc.category,
    drnicerValue: doc.drnicerValue,
    readTime: doc.readTime || estimateReadTime(doc.content),
    excerpt: doc.excerpt,
    content: doc.content,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    author: doc.author,
    isActive: Boolean(doc.isActive),
    viewCount: Number(doc.viewCount || 0),
    library: doc.library || 'AAoJ',
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Ensures slug uniqueness in the database, appending a numeric counter if colliding
 */
export async function generateUniqueSlug(
  baseTitle: string,
  excludeId?: string
): Promise<string> {
  await connectDB();
  const baseSlug = slugify(baseTitle) || 'article';
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await TranscommArticle.findOne(query).select('_id').lean();
    if (!existing) {
      return candidate;
    }
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
}

/**
 * Lists articles with flexible filtering, search, pagination, and sorting
 */
export async function listArticles(
  params: IArticleListQuery = {}
): Promise<IPaginatedArticles> {
  await connectDB();
  await seedInitialArticlesIfEmpty();

  const {
    category,
    drnicerValue,
    search,
    status = 'active',
    page = 1,
    limit = 12,
    sort = 'newest',
  } = params;

  const query: Record<string, unknown> = {};

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'draft') {
    query.isActive = false;
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  if (drnicerValue && drnicerValue !== 'all') {
    query.drnicerValue = drnicerValue;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { excerpt: searchRegex },
      { author: searchRegex },
      { tags: searchRegex },
    ];
  }

  const sortOption: Record<string, 1 | -1> = {};
  if (sort === 'popular') {
    sortOption.viewCount = -1;
    sortOption.createdAt = -1;
  } else if (sort === 'title') {
    sortOption.title = 1;
  } else {
    sortOption.createdAt = -1;
  }

  const skip = Math.max(0, (page - 1) * limit);

  const [total, docs] = await Promise.all([
    TranscommArticle.countDocuments(query),
    TranscommArticle.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .exec(),
  ]);

  const items = docs.map((doc) => serializeArticle(doc));
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Retrieves a single article by its URL slug, optionally incrementing viewCount atomically
 */
export async function getArticleBySlug(
  slug: string,
  incrementView = true
): Promise<{
  article: ITranscommArticleData | null;
  related: ITranscommArticleData[];
}> {
  await connectDB();
  await seedInitialArticlesIfEmpty();

  const normalizedSlug = slug.toLowerCase().trim();

  let doc: ITranscommArticleDocument | null = null;
  if (incrementView) {
    doc = await TranscommArticle.findOneAndUpdate(
      { slug: normalizedSlug },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).exec();
  } else {
    doc = await TranscommArticle.findOne({ slug: normalizedSlug }).exec();
  }

  if (!doc) {
    return { article: null, related: [] };
  }

  // Fetch related articles from same category or drnicerValue
  const relatedDocs = await TranscommArticle.find({
    _id: { $ne: doc._id },
    isActive: true,
    $or: [
      { category: doc.category },
      ...(doc.drnicerValue ? [{ drnicerValue: doc.drnicerValue }] : []),
    ],
  })
    .sort({ createdAt: -1 })
    .limit(3)
    .exec();

  return {
    article: serializeArticle(doc),
    related: relatedDocs.map((d) => serializeArticle(d)),
  };
}

/**
 * Retrieves a single article by ObjectId
 */
export async function getArticleById(
  id: string
): Promise<ITranscommArticleData | null> {
  await connectDB();
  const doc = await TranscommArticle.findById(id).exec();
  return doc ? serializeArticle(doc) : null;
}

/**
 * Creates and persists a new article
 */
export async function createArticle(
  input: ICreateArticleInput
): Promise<ITranscommArticleData> {
  await connectDB();

  const title = input.title.trim();
  const slug = input.slug
    ? await generateUniqueSlug(input.slug)
    : await generateUniqueSlug(title);

  const content = input.content.trim();
  const readTime = input.readTime || estimateReadTime(content);

  let tagsArray: string[] = [];
  if (Array.isArray(input.tags)) {
    tagsArray = input.tags.map((t) => t.trim()).filter(Boolean);
  } else if (typeof input.tags === 'string') {
    tagsArray = input.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const doc = new TranscommArticle({
    title,
    slug,
    category: input.category,
    drnicerValue: input.drnicerValue || undefined,
    excerpt: input.excerpt.trim(),
    content,
    tags: tagsArray,
    author: input.author.trim(),
    isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
    readTime,
    library: input.library || 'AAoJ',
  });

  await doc.save();
  return serializeArticle(doc);
}

/**
 * Updates an existing article
 */
export async function updateArticle(
  id: string,
  input: IUpdateArticleInput
): Promise<ITranscommArticleData | null> {
  await connectDB();

  const doc = await TranscommArticle.findById(id).exec();
  if (!doc) return null;

  if (input.title !== undefined) {
    doc.title = input.title.trim();
  }

  if (input.slug !== undefined && input.slug.trim()) {
    doc.slug = await generateUniqueSlug(input.slug, id);
  }

  if (input.category !== undefined) {
    doc.category = input.category;
  }

  if (input.drnicerValue !== undefined) {
    doc.drnicerValue = input.drnicerValue;
  }

  if (input.excerpt !== undefined) {
    doc.excerpt = input.excerpt.trim();
  }

  if (input.content !== undefined) {
    doc.content = input.content.trim();
    doc.readTime = input.readTime || estimateReadTime(doc.content);
  }

  if (input.tags !== undefined) {
    if (Array.isArray(input.tags)) {
      doc.tags = input.tags.map((t) => t.trim()).filter(Boolean);
    } else if (typeof input.tags === 'string') {
      doc.tags = input.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }

  if (input.author !== undefined) {
    doc.author = input.author.trim();
  }

  if (input.isActive !== undefined) {
    doc.isActive = Boolean(input.isActive);
  }

  if (input.readTime !== undefined) {
    doc.readTime = input.readTime;
  }

  await doc.save();
  return serializeArticle(doc);
}

/**
 * Deletes an article by ID
 */
export async function deleteArticle(id: string): Promise<boolean> {
  await connectDB();
  const res = await TranscommArticle.findByIdAndDelete(id).exec();
  return Boolean(res);
}

/**
 * Toggles an article's active/published status
 */
export async function toggleArticleStatus(
  id: string
): Promise<ITranscommArticleData | null> {
  await connectDB();
  const doc = await TranscommArticle.findById(id).exec();
  if (!doc) return null;

  doc.isActive = !doc.isActive;
  await doc.save();
  return serializeArticle(doc);
}

/**
 * Curated initial seed articles for the 7 DRNICER values to ensure zero mock placeholders
 * and live production database integrity.
 */
const SEED_DRNICER_ARTICLES: Array<{
  title: string;
  slug: string;
  category: TranscommCategory;
  drnicerValue: DRNICERValue;
  excerpt: string;
  author: string;
  tags: string[];
  content: string;
}> = [
  {
    title: 'Discipline: The Cornerstone of Scholarly Mastery',
    slug: 'discipline-cornerstone-scholarly-mastery',
    category: 'drnicer-values',
    drnicerValue: 'Discipline',
    excerpt:
      'How daily self-governance, time blocking, and consistent library study transform aspiring students into lifelong academic achievers.',
    author: 'DZF Academic Board',
    tags: ['discipline', 'study-habits', 'academic-rigor', 'focus'],
    content: `## The Architecture of Intellectual Discipline

At the Dzuels Educational Foundation, we believe that brilliance without discipline is like an unguided river: full of energy, yet incapable of sustaining civilization. True scholastic growth is not an accidental event fueled solely by natural talent; it is the deliberate product of daily habits, disciplined time management, and mental self-restraint.

### 1. Consistent Reading Habits Over Cramming
A scholar who reads twenty pages every morning before dawn builds a cognitive foundation that examinations can never shake. The library is not merely a storehouse of monographs and textbooks; it is a gymnasium for the mind. When you honor your daily library hours, silence external digital distractions, and focus on deep comprehension, you are practicing the highest form of discipline.

### 2. Time Management and Goal Allocation
- **Prioritize Rigorous Subjects:** Tackle the most challenging mathematical or scientific texts when your energy is highest.
- **Maintain Careful Notes:** Never leave a reading session without summarizing key arguments in your personal research journal.
- **Respect Deadlines:** Return borrowed volumes promptly so that fellow scholars may benefit from shared knowledge.

### 3. Long-Term Character Formation
Discipline cultivated during youth becomes the bedrock of professional integrity in adulthood. Whether leading a digital literacy cohort, conducting laboratory experiments, or drafting public policy, the disciplined thinker remains steadfast under pressure. Commit yourself today to small, uncompromising acts of discipline.`,
  },
  {
    title: 'Respect: Fostering Dignity Across Our Academic Community',
    slug: 'respect-fostering-dignity-academic-community',
    category: 'drnicer-values',
    drnicerValue: 'Respect',
    excerpt:
      'Honoring every learner, instructor, and visitor within the library workspace as equal partners in intellectual discovery.',
    author: 'Dr. T. Folorunso',
    tags: ['respect', 'community', 'civility', 'ethics'],
    content: `## The Culture of Mutual Regard

Respect is the oxygen of any healthy educational environment. In an academic library that welcomes students from primary schools to senior secondary levels alongside community scholars, respect ensures that every learner feels safe to inquire, question, and grow.

### Respecting the Sanctuary of Knowledge
Silence in the library is not an arbitrary rule; it is an active expression of respect. When you lower your voice, silence notifications on mobile devices, and treat desks and monographs with care, you acknowledge that every person in the room is engaged in deep intellectual work.

### Valuing Diverse Perspectives
True scholars listen before they speak. When engaging in cohort discussions, debate clubs, or reading competition assessments, respect demands that we critique arguments with logic rather than attacking individuals. We listen attentively to peers whose perspectives differ from our own, recognizing that wisdom is multifaceted.

### Respecting Educational Tools
The books on our shelves and the digital terminals in our academy are community trusts. Returning books uncreased, handling barcodes without damage, and leaving learning spaces cleaner than you found them demonstrate gratitude and respect for educational opportunities.`,
  },
  {
    title: 'Nobility: Cultivating Purposeful and Moral Leadership',
    slug: 'nobility-cultivating-purposeful-moral-leadership',
    category: 'drnicer-values',
    drnicerValue: 'Nobility',
    excerpt:
      'Elevating character above self-interest, embracing servant leadership, and using education to uplift our communities.',
    author: 'Editorial Directorate',
    tags: ['nobility', 'leadership', 'character', 'service'],
    content: `## Nobility of Mind and Spirit

In contemporary discourse, nobility is often misunderstood as privilege or hereditary status. In the Dzuels philosophy, nobility is an inner moral stance: a commitment to behave honourably, defend the vulnerable, and dedicate personal knowledge to the common good.

### Beyond Academic Ambition
What is the worth of high marks if they are accompanied by arrogance? A noble student does not horde knowledge to outshine classmates; a noble student organizes study circles, tutors struggling peers, and shares insights generously. Nobility is measured by the number of people your education uplifts.

### Integrity in the Face of Adversity
- When rules are unmonitored, the noble scholar obeys them out of self-respect.
- When an unfair advantage presents itself, the noble scholar declines it.
- When a peer is unfairly criticized, the noble leader speaks truth with composure and courage.

Let every graduate of the Dzuels Digital Academy walk with the quiet dignity that comes from moral purpose. You are being educated not merely to secure employment, but to renew our nation.`,
  },
  {
    title: 'Integrity: Truthfulness in Research and Character',
    slug: 'integrity-truthfulness-research-character',
    category: 'drnicer-values',
    drnicerValue: 'Integrity',
    excerpt:
      'Upholding academic originality, truthful citations, and uncompromised ethical consistency in all intellectual endeavors.',
    author: 'Lead Librarian',
    tags: ['integrity', 'ethics', 'originality', 'honesty'],
    content: `## The Inviolability of Truth

In the digital era, information is abundant, but integrity remains scarce. Academic integrity is the pledge that what you present as your work is genuine, properly credited, and earned through honest labor.

### The Sacred Duty of Attribution
Plagiarism is an assault on scholarship. When you synthesize arguments from historical authors or scientific papers, acknowledging your sources is not simply a formatting requirement—it is an acknowledgment of intellectual debt. A researcher of integrity celebrates the foundation laid by predecessors.

### Everyday Integrity in Practice
1. **Honest Examination Conduct:** Rejecting shortcuts, unauthorized aids, or fabricated data.
2. **Authentic Reading Logs:** Submitting book summaries that reflect genuine critical thought rather than copied synopses.
3. **Truthful Record Keeping:** Maintaining accurate attendance and circulation records across all library desks.

When you choose truth over convenience, you forge an internal reputation that outlasts any temporary academic accolade. Integrity is doing what is right even when no invigilator is watching.`,
  },
  {
    title: 'Compassion: The Heart of Inclusive Education',
    slug: 'compassion-heart-inclusive-education',
    category: 'drnicer-values',
    drnicerValue: 'Compassion',
    excerpt:
      'Extending empathy, mutual assistance, and patience to fellow scholars overcoming barriers to literacy and digital skills.',
    author: 'Academy Lead',
    tags: ['compassion', 'empathy', 'inclusion', 'mentorship'],
    content: `## Empathy as an Intellectual Virtue

Education without compassion produces cold intellectualism. At Dzuels Educational Foundation, we believe that academic excellence reaches its true height only when coupled with deep empathy for the human condition.

### Welcoming Every Learner
Learners enter our library with varying degrees of preparation. Some have grown up in homes filled with literature, while others are opening an encyclopedia or touching a computer keyboard for the very first time. A compassionate learning community never scoffs at basic questions; it meets curiosity with warmth and patience.

### The Mentor’s Heart
- If you master a coding concept quickly in your cohort, sit with your neighbor until they grasp it.
- If a younger patron cannot locate a book on the shelf, guide them through the catalog rather than brushing them aside.
- Notice when a classmate is discouraged by an exam result, and offer words of encouragement.

Compassion transforms an institutional library into a welcoming intellectual home where every mind has room to flourish.`,
  },
  {
    title: 'Excellence: The Pursuit of Uncompromising Quality',
    slug: 'excellence-pursuit-uncompromising-quality',
    category: 'drnicer-values',
    drnicerValue: 'Excellence',
    excerpt:
      'Refusing mediocrity in reading, research, analysis, and execution across all academic and creative pursuits.',
    author: 'DZF Academic Board',
    tags: ['excellence', 'mastery', 'scholarship', 'standards'],
    content: `## The Standard of Academic Excellence

Excellence is not an unattainable state of perfection; it is a continuous commitment to doing common tasks uncommonly well. Whether organizing a catalog card, writing a book review, or preparing for the annual Reading Competition, excellence demands our best effort.

### Rejecting "Just Enough"
The enemy of excellence is the belief that "good enough" will suffice. When drafting an essay, reread it with a critical eye. Correct typographical errors, verify dates and statistics, and refine sentences until your meaning is crisp and compelling.

### Pillars of Everyday Excellence
- **Depth Over Surface:** Read beyond the required textbook chapter to uncover the underlying theories and historical contexts.
- **Craftsmanship in Presentation:** Present your cohort projects with meticulous typography, orderly formatting, and clean visual assets.
- **Resilience in Feedback:** Welcome constructive critiques from mentors and librarians as tools for refinement rather than personal slights.

Excellence is a habit that opens doors across global academic institutions. Strive for it in every line you write and every volume you study.`,
  },
  {
    title: 'Responsibility: Custodians of Our Shared Heritage',
    slug: 'responsibility-custodians-shared-heritage',
    category: 'drnicer-values',
    drnicerValue: 'Responsibility',
    excerpt:
      'Taking ownership of shared civic resources, personal development, and our collective academic future.',
    author: 'Dr. T. Folorunso',
    tags: ['responsibility', 'stewardship', 'civic-duty', 'ownership'],
    content: `## Active Stewardship of Knowledge

The rights and privileges of membership in the Dzuels Library and Learning Center are accompanied by solemn responsibilities. We are not mere consumers of educational resources; we are their custodians.

### Stewardship of the Commons
Every book spine, barcode tag, computer terminal, and solar power battery in our facility was provided through the sacrificial generosity of donors who believe in Nigerian educational potential. When you protect these assets from damage or loss, you preserve opportunities for generations of students who will follow you.

### Personal Responsibility for Learning
Your education is ultimately your responsibility. Teachers, librarians, and digital mentors can provide guidance and curated reading materials, but the actual labor of thinking, memorizing, analyzing, and synthesizing belongs to you. Take ownership of your questions and push the boundaries of your knowledge.

### Our Promise to the Future
Live as a responsible citizen of our foundation. Honor your commitments, return loans promptly, uphold honesty in our leaderboards, and carry the torch of literacy forward into your schools and communities.`,
  },
];

/**
 * Automatically seeds the 7 DRNICER articles if the collection has fewer than 7 articles.
 */
export async function seedInitialArticlesIfEmpty(): Promise<void> {
  try {
    const count = await TranscommArticle.countDocuments();
    if (count >= 7) return;

    for (const item of SEED_DRNICER_ARTICLES) {
      const exists = await TranscommArticle.findOne({ slug: item.slug }).select('_id');
      if (!exists) {
        await TranscommArticle.create({
          ...item,
          readTime: estimateReadTime(item.content),
          isActive: true,
          viewCount: Math.floor(Math.random() * 25) + 5,
          library: 'AAoJ',
        });
      }
    }
  } catch (err) {
    console.error('Error seeding initial DRNICER articles:', err);
  }
}
