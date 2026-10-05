import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { previewNextPatronBarcode } from '@/lib/patron/barcode';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const preview = await previewNextPatronBarcode();

    return NextResponse.json({
      success: true,
      ...preview,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to preview next patron barcode',
      },
      { status: 500 }
    );
  }
}
