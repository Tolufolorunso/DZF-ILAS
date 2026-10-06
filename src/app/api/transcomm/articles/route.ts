import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canPublishArticles } from '@/lib/auth/rbac';
import { createArticle, listArticles } from '@/lib/transcomm/service';
import type {
  DRNICERValue,
  TranscommCategory,
} from '@/models/TranscommArticle';

const VALID_CATEGORIES: TranscommCategory[] = [
  'drnicer-values',
  'leadership-basics',
  'communication',
  'teamwork',
  'problem-solving',
  'confidence',
  'inspiration',
];

const VALID_DRNICER_VALUES: DRNICERValue[] = [
  'Discipline',
  'Respect',
  'Nobility',
  'Integrity',
  'Compassion',
  'Excellence',
  'Responsibility',
];

/**
 * GET /api/transcomm/articles
 * Lists published/draft articles with category, DRNICER value, search, and pagination.
 * Open for read access by mobile app and web clients.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const drnicerValue = searchParams.get('drnicerValue') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as 'newest' | 'popular' | 'title') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const requestedStatus = searchParams.get('status') || 'active';

    // Verify if requester has editorial credentials to view drafts/all
    let effectiveStatus: 'active' | 'draft' | 'all' = 'active';
    if (requestedStatus === 'draft' || requestedStatus === 'all') {
      const user = await getSessionUser(req);
      if (user && canPublishArticles(user.role)) {
        effectiveStatus = requestedStatus as 'draft' | 'all';
      }
    }

    const result = await listArticles({
      category,
      drnicerValue,
      search,
      sort,
      status: effectiveStatus,
      page: isNaN(page) || page < 1 ? 1 : page,
      limit: isNaN(limit) || limit < 1 ? 12 : limit,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transcomm/articles
 * Creates and publishes a new DRNICER or leadership values article.
 * Requires editorial role (admin, asst_admin, transcomm_author).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    if (!canPublishArticles(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Staff editorial credentials required to publish articles.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validation
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Article title is required.' },
        { status: 400 }
      );
    }

    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid article category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (body.category === 'drnicer-values') {
      if (!body.drnicerValue || !VALID_DRNICER_VALUES.includes(body.drnicerValue)) {
        return NextResponse.json(
          {
            success: false,
            error: `Articles in 'drnicer-values' must select a valid DRNICER pillar: ${VALID_DRNICER_VALUES.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    if (!body.excerpt || !body.excerpt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Article excerpt is required.' },
        { status: 400 }
      );
    }

    if (!body.content || body.content.trim().length < 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article content must be at least 200 characters in length.',
        },
        { status: 400 }
      );
    }

    const article = await createArticle({
      title: body.title,
      slug: body.slug,
      category: body.category,
      drnicerValue: body.drnicerValue,
      excerpt: body.excerpt,
      content: body.content,
      tags: body.tags,
      author: body.author?.trim() || user.name || user.username,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      readTime: body.readTime,
      library: body.library || 'AAoJ',
    });

    return NextResponse.json(
      {
        success: true,
        data: article,
        message: `Article "${article.title}" published successfully.`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
