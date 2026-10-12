import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FoundationPreset } from '@/models/FoundationPreset';
import { ANNUAL_FOUNDATION_EVENTS, LITERACY_GRADE_BANDS } from '@/lib/constants/foundationEvents';
import { IJERO_SCHOOL_OPTIONS } from '@/lib/patron/schools';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * Ensures that the system FoundationPreset collection has default presets seeded.
 */
async function ensureSeedPresets() {
  const existingCount = await FoundationPreset.countDocuments();
  if (existingCount === 0) {
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
      ...IJERO_SCHOOL_OPTIONS.filter((s) => s.value && s.value !== 'others').map((s) => ({
        category: 'school' as const,
        name: s.label,
        slug: s.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        description: 'Predefined educational institution in Ijero Ekiti',
        metadata: { address: s.address },
        isActive: true,
      })),
    ];

    await FoundationPreset.insertMany(docsToInsert);
    return;
  }

  // Also verify schools specifically exist if presets were already seeded before Feature 38
  const schoolCount = await FoundationPreset.countDocuments({ category: 'school' });
  if (schoolCount === 0) {
    const schoolDocs = IJERO_SCHOOL_OPTIONS.filter((s) => s.value && s.value !== 'others').map(
      (s) => ({
        category: 'school' as const,
        name: s.label,
        slug: s.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        description: 'Predefined educational institution in Ijero Ekiti',
        metadata: { address: s.address },
        isActive: true,
      })
    );
    if (schoolDocs.length > 0) {
      await FoundationPreset.insertMany(schoolDocs);
    }
  }
}

/**
 * GET /api/foundation-presets
 * Retrieves system foundation presets with optional category, month, and active filtering.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await ensureSeedPresets();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const slug = searchParams.get('slug');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const filter: Record<string, unknown> = {};
    if (!includeInactive) {
      filter.isActive = true;
    }
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

/**
 * POST /api/foundation-presets
 * Creates a new foundation preset (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await request.json();

    const {
      category,
      name,
      slug: customSlug,
      targetMonth,
      monthLabel,
      targetAudience,
      description,
      competitionType,
      defaultPoints,
      metadata,
      isActive = true,
    } = body;

    if (!category || !name) {
      return NextResponse.json(
        { success: false, error: 'Category and Name are required.' },
        { status: 400 }
      );
    }

    const slug = (
      customSlug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    ).trim();

    // Check duplicate
    const existing = await FoundationPreset.findOne({ category, slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A preset with slug "${slug}" already exists in ${category}.` },
        { status: 409 }
      );
    }

    const preset = await FoundationPreset.create({
      category,
      name: name.trim(),
      slug,
      targetMonth: targetMonth ? parseInt(targetMonth, 10) : undefined,
      monthLabel,
      targetAudience,
      description,
      competitionType,
      defaultPoints: defaultPoints !== undefined ? Number(defaultPoints) : 5,
      metadata: metadata || {},
      isActive: Boolean(isActive),
    });

    await logAuditEvent({
      action: 'PRESET_CREATED',
      performedBy: user.username,
      performedByRole: user.role,
      targetEntity: 'FoundationPreset',
      targetId: String(preset._id),
      details: { category, name, slug },
    });

    return NextResponse.json({
      success: true,
      message: 'Preset created successfully.',
      preset,
    });
  } catch (error) {
    console.error('[FOUNDATION_PRESETS_POST_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create preset',
      },
      { status: 500 }
    );
  }
}
