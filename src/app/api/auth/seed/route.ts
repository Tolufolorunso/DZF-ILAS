import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth/password';

export async function POST() {
  try {
    await connectDB();

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
