import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Session is invalid or expired.',
        },
        { status: 401 }
      );
    }

    await connectDB();
    const userDoc = await User.findById(sessionUser.userId).select('-password');

    if (!userDoc || !userDoc.active) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found or deactivated.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc._id.toString(),
        username: userDoc.username,
        name: userDoc.name,
        role: userDoc.role,
        phone: userDoc.phone,
        active: userDoc.active,
        userImg: userDoc.userImg,
        createdAt: userDoc.createdAt,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error resolving session profile',
      },
      { status: 500 }
    );
  }
}
