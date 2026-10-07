import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username and password are required',
        },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedUsername = String(username).toLowerCase().trim();
    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid username or password',
        },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account pending activation. Please contact the Foundation Administrator to activate your account.',
        },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid username or password',
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signToken({
      userId: user._id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        userImg: user.userImg,
      },
    });

    // Set secure HTTP-only cookie for web clients
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 2, // 2 days in seconds
    });

    return response;
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error during authentication',
      },
      { status: 500 }
    );
  }
}
