import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { Notification } from '@/models/Notification';
import { hashPassword } from '@/lib/auth/password';
import { ALL_ROLES } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/admin/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Public staff self-registration endpoint.
 * Creates an inactive staff account (active: false) and dispatches an account_pending
 * notification to administrators for review and activation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    const { name, username, password, phone, requestedRole, dateOfBirth, birthMonth, birthDay } = body;

    // Validate Full Name
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full Name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    // Validate Username
    const normalizedUsername = String(username || '')
      .toLowerCase()
      .trim();
    if (!normalizedUsername || !/^[a-z0-9_]{3,25}$/.test(normalizedUsername)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username must be 3-25 characters long and contain only lowercase letters, numbers, and underscores.',
        },
        { status: 400 }
      );
    }

    // Validate Password
    if (!password || String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Validate Phone Number
    const trimmedPhone = String(phone || '').trim();
    if (!trimmedPhone || trimmedPhone.length < 7) {
      return NextResponse.json(
        { success: false, error: 'Valid contact phone number is required.' },
        { status: 400 }
      );
    }

    // Validate Birth Month & Day (month and day only, no year)
    let parsedBirthMonth: number | undefined = undefined;
    let parsedBirthDay: number | undefined = undefined;

    if (birthMonth !== undefined && birthMonth !== null && birthMonth !== '') {
      const m = parseInt(String(birthMonth), 10);
      if (isNaN(m) || m < 1 || m > 12) {
        return NextResponse.json(
          { success: false, error: 'Birth Month must be between 1 (January) and 12 (December).' },
          { status: 400 }
        );
      }
      parsedBirthMonth = m;
    }

    if (birthDay !== undefined && birthDay !== null && birthDay !== '') {
      const d = parseInt(String(birthDay), 10);
      if (isNaN(d) || d < 1 || d > 31) {
        return NextResponse.json(
          { success: false, error: 'Birth Day must be between 1 and 31.' },
          { status: 400 }
        );
      }
      parsedBirthDay = d;
    }

    if (parsedBirthMonth && parsedBirthDay) {
      const maxDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][parsedBirthMonth - 1];
      if (parsedBirthDay > maxDays) {
        return NextResponse.json(
          { success: false, error: `Invalid day ${parsedBirthDay} for the selected month (maximum is ${maxDays}).` },
          { status: 400 }
        );
      }
    }

    // Validate Role (defaults to 'intern' if unspecified or invalid)
    let assignedRole: UserRole = 'intern';
    if (requestedRole && ALL_ROLES.includes(requestedRole as UserRole)) {
      assignedRole = requestedRole as UserRole;
    }

    await connectDB();

    // Check for existing username
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Username "${normalizedUsername}" is already in use. Please select a different username.`,
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create inactive user account
    const newUser = await User.create({
      name: String(name).trim(),
      username: normalizedUsername,
      password: hashedPassword,
      phone: trimmedPhone,
      role: assignedRole,
      active: false, // Inactive by default; requires administrator activation
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      birthMonth: parsedBirthMonth,
      birthDay: parsedBirthDay,
    });

    // Alert all active administrators regarding new pending staff registration
    try {
      const adminUsers = await User.find({
        role: { $in: ['admin', 'country_manager', 'ima'] },
        active: true,
      }).select('username');

      if (adminUsers.length > 0) {
        const notifications = adminUsers.map((admin) => ({
          recipientUsername: admin.username,
          senderUsername: normalizedUsername,
          type: 'account_pending' as const,
          title: `Pending Staff Registration: ${newUser.name}`,
          message: `${newUser.name} (@${normalizedUsername}) submitted a registration application for the role "${assignedRole}". Account activation required.`,
          link: '/dashboard/admin',
          read: false,
        }));

        await Notification.insertMany(notifications);
      }

      await logAuditEvent({
        action: 'STAFF_SELF_REGISTERED',
        performedBy: normalizedUsername,
        performedByRole: assignedRole,
        targetEntity: 'User',
        targetId: newUser._id.toString(),
        details: {
          name: newUser.name,
          username: normalizedUsername,
          role: assignedRole,
          active: false,
        },
      });
    } catch (notifErr) {
      console.warn('[REGISTRATION_NOTIF_ERROR]', notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Staff registration submitted successfully. Your account is currently inactive and pending verification & activation by the Foundation Administrator.',
        user: {
          id: newUser._id.toString(),
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          active: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[STAFF_REGISTER_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error during registration',
      },
      { status: 500 }
    );
  }
}
