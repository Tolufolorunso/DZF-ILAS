import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import {
  getSystemSettings,
  generateAttendanceApiKey,
  updateAttendanceApiConfig,
} from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings/attendance-key
 * Retrieves current External Attendance API Key configuration.
 * Restricted to Admin and Asst Admin.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const settings = await getSystemSettings();
    return NextResponse.json({
      success: true,
      apiKey: settings.externalAttendanceApiKey || '',
      attributedStaff: settings.externalAttendanceAttributedStaff || 'Academy Instructor',
      generatedAt: settings.externalAttendanceKeyGeneratedAt || null,
    });
  } catch (error) {
    console.error('[ADMIN_GET_ATTENDANCE_KEY_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve attendance key configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/attendance-key
 * Generates, regenerates, or updates the External Attendance API Key.
 * Restricted to strictly Admin role.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Strictly Primary Administrator privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'generate';
    const attributedStaff = body.attributedStaff?.trim();
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      undefined;

    if (action === 'generate' || action === 'regenerate') {
      const result = await generateAttendanceApiKey({
        performedBy: user.username,
        performedByRole: user.role,
        attributedStaff,
        ipAddress,
      });

      return NextResponse.json({
        success: true,
        message: action === 'regenerate' ? 'API Key rotated successfully.' : 'API Key generated successfully.',
        ...result,
      });
    }

    if (action === 'update_staff') {
      if (!attributedStaff) {
        return NextResponse.json(
          { success: false, error: 'Attributed staff name cannot be empty.' },
          { status: 400 }
        );
      }

      const result = await updateAttendanceApiConfig({
        performedBy: user.username,
        performedByRole: user.role,
        attributedStaff,
        ipAddress,
      });

      return NextResponse.json({
        success: true,
        message: 'Attributed staff identity updated successfully.',
        ...result,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action "${action}". Expected "generate", "regenerate", or "update_staff".` },
      { status: 400 }
    );
  } catch (error) {
    console.error('[ADMIN_POST_ATTENDANCE_KEY_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process attendance key action',
      },
      { status: 500 }
    );
  }
}

