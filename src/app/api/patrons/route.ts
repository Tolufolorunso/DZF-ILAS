import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patron } from '@/models/Patron';
import { Cohort } from '@/models/Cohort';
import { getSessionUser } from '@/lib/auth/session';
import { generateNextPatronBarcode } from '@/lib/patron/barcode';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const patronType = searchParams.get('patronType')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    await connectDB();

    const query: Record<string, unknown> = {
      isDeleted: { $ne: true },
    };

    if (patronType && patronType !== 'all') {
      query.patronType = patronType;
    }

    if (status === 'active') {
      query.active = true;
    } else if (status === 'inactive') {
      query.active = false;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { barcode: searchRegex },
        { firstname: searchRegex },
        { surname: searchRegex },
        { phoneNumber: searchRegex },
        { 'studentSchoolInfo.schoolName': searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, patrons] = await Promise.all([
      Patron.countDocuments(query),
      Patron.find(query)
        .sort({ registeredDate: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      patrons,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error fetching patron directory',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Staff session required to register patrons.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      firstname,
      surname,
      middlename,
      email,
      phoneNumber,
      gender,
      address,
      dateOfBirth,
      patronType = 'student',
      studentSchoolInfo,
      parentInfo,
      employerInfo,
      image_url,
      cohortId,
    } = body;

    // Basic required fields
    if (!firstname?.trim() || !surname?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Firstname and Surname are required.',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check duplicate phone number if provided
    if (phoneNumber?.trim()) {
      const existing = await Patron.findOne({
        phoneNumber: phoneNumber.trim(),
        isDeleted: { $ne: true },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `A patron with phone number "${phoneNumber.trim()}" already exists (${existing.firstname} ${existing.surname}, Barcode: ${existing.barcode}).`,
          },
          { status: 409 }
        );
      }
    }

    // Role-based Cohort enrollment check
    if (cohortId) {
      const allowedRoles = ['admin', 'ict'];
      if (!allowedRoles.includes(sessionUser.role)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Permission denied: Only Admin or ICT staff may enroll students into Academy Cohorts.',
          },
          { status: 403 }
        );
      }
    }

    // Atomically generate the next sequential barcode based on the last registered member
    const barcode = await generateNextPatronBarcode();

    const newPatron = new Patron({
      firstname: firstname.trim(),
      surname: surname.trim(),
      middlename: middlename?.trim() || undefined,
      email: email?.trim()?.toLowerCase() || undefined,
      phoneNumber: phoneNumber?.trim() || '08000000000',
      gender: gender || 'male',
      address: address?.trim() || undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      patronType,
      barcode,
      library: 'AAoJ',
      active: true,
      points: 0,
      registeredBy: sessionUser.username,
      registeredDate: new Date(),
      studentSchoolInfo: patronType === 'student' ? studentSchoolInfo : undefined,
      parentInfo: patronType === 'student' ? parentInfo : undefined,
      employerInfo: ['teacher', 'staff', 'guest'].includes(patronType) ? employerInfo : undefined,
      image_url: image_url?.secure_url
        ? {
            secure_url: image_url.secure_url,
            public_id: image_url.public_id || 'manual_upload',
          }
        : undefined,
    });

    await newPatron.save();

    // If cohort was specified by Admin/ICT, enroll student into the cohort
    if (cohortId) {
      try {
        await Cohort.findByIdAndUpdate(cohortId, {
          $addToSet: {
            students: {
              patronId: newPatron._id,
              barcode: newPatron.barcode,
              name: `${newPatron.firstname} ${newPatron.surname}`,
              gender: newPatron.gender,
              enrolledAt: new Date(),
              completed: false,
            },
          },
        });
      } catch (cohortErr) {
        console.error('Failed to link student to cohort:', cohortErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Patron registered successfully with barcode assignment.',
        patron: newPatron,
      },
      { status: 201 }
    );
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error creating patron record',
      },
      { status: 500 }
    );
  }
}
