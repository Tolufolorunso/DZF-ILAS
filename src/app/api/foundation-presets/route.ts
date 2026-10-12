import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FoundationPreset } from '@/models/FoundationPreset';
import { ANNUAL_FOUNDATION_EVENTS, LITERACY_GRADE_BANDS } from '@/lib/constants/foundationEvents';

export const dynamic = 'force-dynamic';

/**
 * Ensures that the system FoundationPreset collection has default presets seeded.
 */
async function ensureSeedPresets() {
  const existingCount = await FoundationPreset.countDocuments();
  if (existingCount > 0) return;

  const docsToInsert = [
    ...ANNUAL_FOUNDATION_EVENTS.map((ev) => ({
      category: 'annual_event' as const,
      name: ev.name,
      slug: ev.slug,
      targetMonth: ev.month,
      monthLabel: ev.monthLabel,
      targetAudience: ev.targetAudience,
      description: ev.description,
      competitionType: ev.competitionType,
      defaultPoints: ev.defaultPoints,
      isActive: true,
    })),
    ...LITERACY_GRADE_BANDS.map((gb) => ({
      category: 'grade_band' as const,
      name: gb.name,
      slug: gb.id,
      targetAudience: gb.targetAudience,
      description: gb.description,
      defaultPoints: gb.defaultPoints,
      metadata: { gradeBand: gb.gradeBand },
      isActive: true,
    })),
  ];

  await FoundationPreset.insertMany(docsToInsert);
}

/**
 * GET /api/foundation-presets
 * Retrieves system foundation presets with optional category and month filtering.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await ensureSeedPresets();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const slug = searchParams.get('slug');

    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter.category = category;
    if (month) filter.targetMonth = parseInt(month, 10);
    if (slug) filter.slug = slug.toLowerCase().trim();

    const presets = await FoundationPreset.find(filter)
      .sort({ category: 1, targetMonth: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: presets.length,
      presets,
    });
  } catch (error) {
    console.error('[FOUNDATION_PRESETS_GET_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve presets',
        presets: ANNUAL_FOUNDATION_EVENTS, // Fallback to memory constants
      },
      { status: 500 }
    );
  }
}
