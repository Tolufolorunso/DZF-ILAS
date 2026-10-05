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
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const { image, barcode } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Image data URL or base64 string is required.' },
        { status: 400 }
      );
    }

    const publicId = barcode ? `patron_${barcode}_${Date.now()}` : `patron_${Date.now()}`;

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'library_patrons',
      public_id: publicId,
      transformation: [
        { width: 480, height: 480, crop: 'fill', gravity: 'face' },
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
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to upload photo to Cloudinary.',
      },
      { status: 500 }
    );
  }
}
