import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { FoundationPreset } from '@/models/FoundationPreset';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/foundation-presets/[id]
 * Updates an existing foundation preset (admin only).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid preset ID format.' },
        { status: 400 }
      );
    }

    await connectDB();
    const body = await request.json();

    const allowedFields = [
      'name',
      'targetMonth',
      'monthLabel',
      'targetAudience',
      'description',
      'competitionType',
      'defaultPoints',
      'metadata',
      'isActive',
    ];

    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const updated = await FoundationPreset.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Preset not found.' },
        { status: 404 }
      );
    }

    await logAuditEvent({
      action: 'PRESET_UPDATED',
      performedBy: user.username,
      performedByRole: user.role,
      targetEntity: 'FoundationPreset',
      targetId: id,
      details: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Preset updated successfully.',
      preset: updated,
    });
  } catch (error) {
    console.error('[FOUNDATION_PRESET_PATCH_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update preset',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/foundation-presets/[id]
 * Permanently removes a foundation preset (admin only).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid preset ID format.' },
        { status: 400 }
      );
    }

    await connectDB();
    const deleted = await FoundationPreset.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Preset not found.' },
        { status: 404 }
      );
    }

    await logAuditEvent({
      action: 'PRESET_DELETED',
      performedBy: user.username,
      performedByRole: user.role,
      targetEntity: 'FoundationPreset',
      targetId: id,
      details: { name: deleted.name, category: deleted.category },
    });

    return NextResponse.json({
      success: true,
      message: `Preset "${deleted.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error('[FOUNDATION_PRESET_DELETE_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete preset',
      },
      { status: 500 }
    );
  }
}
