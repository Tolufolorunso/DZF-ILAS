import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { canPublishArticles } from '@/lib/auth/rbac';
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  toggleArticleStatus,
} from '@/lib/transcomm/service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/transcomm/articles/[id]
 * Retrieves single article by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const article = await getArticleById(id);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
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
 * PUT /api/transcomm/articles/[id]
 * Updates article details or toggles active status. Requires editorial permissions.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
          error: 'Permission denied. Editorial credentials required.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Support toggle action shortcut
    if (body.action === 'toggleStatus') {
      const toggled = await toggleArticleStatus(id);
      if (!toggled) {
        return NextResponse.json(
          { success: false, error: 'Article not found.' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: toggled,
        message: `Article status updated to ${toggled.isActive ? 'Active' : 'Draft'}.`,
      });
    }

    // Content length validation if content is being updated
    if (body.content !== undefined && body.content.trim().length < 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article content must be at least 200 characters in length.',
        },
        { status: 400 }
      );
    }

    const updated = await updateArticle(id, {
      title: body.title,
      slug: body.slug,
      category: body.category,
      drnicerValue: body.drnicerValue,
      excerpt: body.excerpt,
      content: body.content,
      tags: body.tags,
      author: body.author,
      isActive: body.isActive,
      readTime: body.readTime,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Article updated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/transcomm/articles/[id]
 * Deletes an article from the database. Requires editorial permissions.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
          error: 'Permission denied. Editorial credentials required.',
        },
        { status: 403 }
      );
    }

    const deleted = await deleteArticle(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article removed successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
