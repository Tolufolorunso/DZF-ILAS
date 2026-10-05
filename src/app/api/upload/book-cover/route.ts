import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getSessionUser } from '@/lib/auth/session';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { image, barcode, controlNumber } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Book cover image data URL or base64 string is required.' },
        { status: 400 }
      );
    }

    const identifier = barcode || controlNumber?.replace(/[^a-zA-Z0-9]/g, '_') || Date.now();
    const publicId = `book_${identifier}_${Date.now()}`;

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'library_books',
      public_id: publicId,
      transformation: [
        { width: 600, height: 900, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return NextResponse.json({
      success: true,
      secure_url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Book cover upload error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to upload book cover image.',
      },
      { status: 500 }
    );
  }
}
