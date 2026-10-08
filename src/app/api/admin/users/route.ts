import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Lists staff accounts with filtering by status (pending/active/all), role, and search.
 * Restricted to administrators.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // 'pending' | 'active' | 'all'
    const roleFilter = searchParams.get('role');
    const search = searchParams.get('search');

    await connectDB();

    const query: Record<string, unknown> = {};

    if (status === 'pending') {
      query.active = false;
    } else if (status === 'active') {
      query.active = true;
    }

    if (roleFilter && roleFilter !== 'all') {
      query.role = roleFilter;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Compute metrics
    const [totalCount, pendingCount, activeCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: false }),
      User.countDocuments({ active: true }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: String(u._id),
      name: u.name,
      username: u.username,
      phone: u.phone,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        users: formattedUsers,
        metrics: {
          totalCount,
          pendingCount,
          activeCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET_ADMIN_USERS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to retrieve staff users' },
      { status: 500 }
    );
  }
}
