import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/transcomm/service';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/transcomm/articles/slug/[slug]
 * Retrieves article by slug, atomically increments view count, and provides related articles.
 * Consumable by web reader and Android mobile application.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const trackView = searchParams.get('trackView') !== 'false';

    const { article, related } = await getArticleBySlug(slug, trackView);

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
      related,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
