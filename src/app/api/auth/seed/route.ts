import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth/password';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Database seeding endpoint is disabled in production environments.' },
        { status: 403 }
      );
    }

    await connectDB();

    const sessionUser = await getSessionUser(request);
    const isSuperOrAdmin = sessionUser && ['ima', 'country_manager', 'admin'].includes(sessionUser.role);

    const seedSecret = process.env.SEED_SECRET;
    const providedSecret = request.headers.get('x-seed-secret');
    const hasValidSecret = Boolean(seedSecret && providedSecret && seedSecret === providedSecret);

    // Check if an active administrator account already exists
    const existingAdmin = await User.findOne({
      role: { $in: ['admin', 'country_manager', 'ima'] },
      active: true,
    });

    // If an administrator already exists, only an authenticated administrator or matching seed secret may trigger seeding
    if (existingAdmin && !isSuperOrAdmin && !hasValidSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Active administrator account already exists. Re-seeding requires administrator authorization or a valid secret key.',
        },
        { status: 403 }
      );
    }

    const adminPasswordHash = await hashPassword('Admin@12345');
    const librarianPasswordHash = await hashPassword('Librarian@12345');

    // Upsert Default Admin
    const adminUser = await User.findOneAndUpdate(
      { username: 'admin' },
      {
        username: 'admin',
        name: 'DZF System Administrator',
        password: adminPasswordHash,
        phone: '08000000001',
        active: true,
        role: 'admin',
      },
      { upsert: true, new: true }
    );

    // Upsert Default Librarian
    const librarianUser = await User.findOneAndUpdate(
      { username: 'librarian' },
      {
        username: 'librarian',
        name: 'Lead Librarian',
        password: librarianPasswordHash,
        phone: '08000000002',
        active: true,
        role: 'librarian',
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Staff user accounts seeded successfully',
      seeded: [
        {
          username: adminUser.username,
          name: adminUser.name,
          role: adminUser.role,
        },
        {
          username: librarianUser.username,
          name: librarianUser.name,
          role: librarianUser.role,
        },
      ],
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error seeding user accounts',
      },
      { status: 500 }
    );
  }
}
