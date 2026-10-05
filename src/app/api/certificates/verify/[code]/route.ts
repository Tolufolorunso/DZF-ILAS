import { NextRequest, NextResponse } from 'next/server';
import { verifyCertificate } from '@/lib/certificates/service';

interface RouteContext {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/certificates/verify/[code]
 * Public endpoint to verify certificate authenticity by serial code.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params;
    const result = await verifyCertificate(code);

    if (!result.isValid) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          certificateCode: result.certificateCode,
          certificate: result.certificate,
          error: result.error || 'Certificate not verified.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      isValid: true,
      certificateCode: result.certificateCode,
      data: result.certificate,
      message: 'Certificate authenticity verified by Dzuels Educational Foundation.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
