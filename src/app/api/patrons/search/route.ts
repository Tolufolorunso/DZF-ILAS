import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Patron } from '@/models/Patron';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return NextResponse.json({
        success: true,
        patrons: [],
        count: 0,
      });
    }

    await connectDB();

    // Escape regex special characters to prevent injection
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');

    const patrons = await Patron.find({
      $or: [
        { barcode: regex },
        { firstname: regex },
        { surname: regex },
        { phoneNumber: regex },
      ],
      isDeleted: { $ne: true },
    })
      .select('barcode firstname surname middlename gender patronType studentSchoolInfo dateOfBirth image_url points active')
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      patrons,
      count: patrons.length,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error executing patron search',
      },
      { status: 500 }
    );
  }
}
