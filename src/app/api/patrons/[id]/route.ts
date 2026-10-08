import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Patron } from '@/models/Patron';
import { Library } from '@/models/Library';
import { getSessionUser } from '@/lib/auth/session';
import { canUpdatePatron, canDeletePatron } from '@/lib/auth/rbac';
import { recordDailyAction } from '@/lib/audit/dailyActionService';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Patron identifier is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    const patron = await Patron.findOne({
      ...query,
      isDeleted: { $ne: true },
    }).lean();

    if (!patron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      patron,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Error fetching patron' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    // RBAC: Only admin, asst_admin, and ict can update patron profiles
    if (!canUpdatePatron(sessionUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Forbidden: Only administrators and ICT staff have permission to update patron profiles.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    const existing = await Patron.findOne({ ...query, isDeleted: { $ne: true } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    const effectivePatronType = body.patronType || existing.patronType;
    if (effectivePatronType === 'student') {
      const parentPhone =
        body.parentInfo?.parentPhoneNumber !== undefined
          ? String(body.parentInfo.parentPhoneNumber || '').trim()
          : String(existing.parentInfo?.parentPhoneNumber || '').trim();

      if (!parentPhone) {
        return NextResponse.json(
          {
            success: false,
            error: 'Parent or guardian phone number is required for student profiles.',
          },
          { status: 400 }
        );
      }
    }

    let effectivePhone: string | undefined = undefined;
    if (body.phoneNumber !== undefined) {
      const trimmedPhone = String(body.phoneNumber || '').trim();
      effectivePhone = trimmedPhone || undefined;
      if (trimmedPhone && trimmedPhone !== existing.phoneNumber) {
        const dup = await Patron.findOne({
          _id: { $ne: existing._id },
          phoneNumber: trimmedPhone,
          isDeleted: { $ne: true },
        });
        if (dup) {
          return NextResponse.json(
            {
              success: false,
              error: `A patron with phone number "${trimmedPhone}" already exists (${dup.firstname} ${dup.surname}, Barcode: ${dup.barcode}).`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Allowed mutable profile fields - prevent mass-assignment of protected system fields (points, isDeleted, registeredBy, etc.)
    const updateData: Record<string, unknown> = {};

    if (body.firstname !== undefined) updateData.firstname = String(body.firstname).trim();
    if (body.surname !== undefined) updateData.surname = String(body.surname).trim();
    if (body.middlename !== undefined) updateData.middlename = String(body.middlename || '').trim();
    if (body.email !== undefined) updateData.email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    if (body.phoneNumber !== undefined) updateData.phoneNumber = effectivePhone;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.dateOfBirth !== undefined) {
      updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : undefined;
    }
    if (body.patronType !== undefined) updateData.patronType = body.patronType;
    if (body.studentSchoolInfo !== undefined) updateData.studentSchoolInfo = body.studentSchoolInfo;
    if (body.employerInfo !== undefined) updateData.employerInfo = body.employerInfo;
    if (body.parentInfo !== undefined) updateData.parentInfo = body.parentInfo;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (Array.isArray(body.messagePreferences)) updateData.messagePreferences = body.messagePreferences;
    if (typeof body.active === 'boolean') updateData.active = body.active;

    const updatedPatron = await Patron.findByIdAndUpdate(
      existing._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPatron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    await recordDailyAction({
      actionType: 'patron_update',
      actionTitle: `Updated patron profile for ${updatedPatron.firstname} ${updatedPatron.surname} (${updatedPatron.barcode})`,
      performedBy: sessionUser.username,
      performedByName: sessionUser.name,
      performedByRole: sessionUser.role,
      targetEntity: 'Patron',
      targetId: String(updatedPatron._id),
      reversiblePayload: {
        patronId: String(updatedPatron._id),
        previousState: existing.toObject(),
      },
      isReversible: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Patron profile updated successfully.',
      patron: updatedPatron,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Error updating patron profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    // RBAC: Only admin (and asst_admin) can delete patrons
    if (!canDeletePatron(sessionUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Forbidden: Only administrators have permission to delete patron records.',
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { barcode: id };

    const patron = await Patron.findOne(query);

    if (!patron) {
      return NextResponse.json(
        { success: false, error: 'Patron not found.' },
        { status: 404 }
      );
    }

    // Safety check: ensure patron does not have active unreturned loans
    const activeLoans = await Library.countDocuments({
      $or: [{ patronId: patron._id }, { patronBarcode: patron.barcode }],
      status: { $in: ['borrowed', 'overdue'] },
    });

    if (activeLoans > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete patron ${patron.firstname} ${patron.surname}: They have ${activeLoans} active or overdue book loan(s) that must be returned first.`,
        },
        { status: 400 }
      );
    }

    const isHard = request.nextUrl.searchParams.get('hard') === 'true';

    if (isHard) {
      await Patron.deleteOne({ _id: patron._id });
    } else {
      await Patron.updateOne(
        { _id: patron._id },
        { $set: { isDeleted: true, active: false } }
      );
    }

    await recordDailyAction({
      actionType: 'patron_delete',
      actionTitle: `Deleted patron ${patron.firstname} ${patron.surname} (${patron.barcode})`,
      performedBy: sessionUser.username,
      performedByName: sessionUser.name,
      performedByRole: sessionUser.role,
      targetEntity: 'Patron',
      targetId: String(patron._id),
      reversiblePayload: {
        patronId: String(patron._id),
        deletedPatron: patron.toObject(),
        wasHardDelete: isHard,
      },
      isReversible: true,
    });

    return NextResponse.json({
      success: true,
      message: isHard
        ? 'Patron record permanently removed.'
        : 'Patron deactivated successfully.',
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message || 'Error deleting patron' },
      { status: 500 }
    );
  }
}
