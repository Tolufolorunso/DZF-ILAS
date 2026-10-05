import { Counter } from '@/models/Counter';
import { Patron } from '@/models/Patron';

export interface BarcodeValidationResult {
  valid: boolean;
  error?: string;
  year?: number;
  sequence?: number;
}

/**
 * Validates a patron barcode against the institutional specification:
 * Exactly 8 numeric digits consisting of:
 * - 4-digit registration year (e.g., 2026, 2025, 2023)
 * - 4-digit incremental sequence (e.g., 0001 to 9999)
 *
 * @param barcode - Barcode string to validate
 * @returns BarcodeValidationResult with validation flag, parsed parts, or descriptive error
 */
export function validatePatronBarcode(barcode: unknown): BarcodeValidationResult {
  if (typeof barcode !== 'string') {
    return {
      valid: false,
      error: 'Barcode must be a text string.',
    };
  }

  const trimmed = barcode.trim();

  if (!trimmed) {
    return {
      valid: false,
      error: 'Barcode cannot be empty.',
    };
  }

  // Barcode must be exactly 8 digits
  if (!/^\d{8}$/.test(trimmed)) {
    return {
      valid: false,
      error: `Invalid barcode "${trimmed}". Patron barcodes must be exactly 8 numeric digits (YYYYNNNN).`,
    };
  }

  const year = parseInt(trimmed.slice(0, 4), 10);
  const sequence = parseInt(trimmed.slice(4, 8), 10);

  // Validate academic year range (1990 to 2099)
  if (year < 1990 || year > 2099) {
    return {
      valid: false,
      error: `Invalid registration year "${year}". Must be between 1990 and 2099.`,
    };
  }

  // Validate sequence (0001 to 9999)
  if (sequence < 1 || sequence > 9999) {
    return {
      valid: false,
      error: `Invalid sequence "${trimmed.slice(4, 8)}". Sequence must be between 0001 and 9999.`,
    };
  }

  return {
    valid: true,
    year,
    sequence,
  };
}

/**
 * Quick boolean check if a barcode is valid according to the YYYYNNNN spec.
 */
export function isValidPatronBarcode(barcode: unknown): boolean {
  return validatePatronBarcode(barcode).valid;
}

/**
 * Parses and returns formatted patron barcode metadata.
 */
export function parsePatronBarcode(barcode: string): {
  year: number;
  sequence: number;
  formatted: string;
} | null {
  const result = validatePatronBarcode(barcode);
  if (!result.valid || result.year === undefined || result.sequence === undefined) {
    return null;
  }

  return {
    year: result.year,
    sequence: result.sequence,
    formatted: `${result.year}-${String(result.sequence).padStart(4, '0')}`,
  };
}

/**
 * Atomically generates the next sequential patron barcode.
 * Format: Current Registration Year (4 digits) + 4-digit incremental sequence based on the last registered member.
 *
 * Example:
 * - Last registered member in DB is 20250583 (member #583).
 * - Next member registered in 2026 will be: 20260584 (year 2026 + member #584).
 * - Next member after that: 20260585.
 *
 * Uses MongoDB atomic counter upsert to prevent collisions during concurrent staff registrations.
 *
 * @param targetYear - Optional registration year (defaults to current calendar year)
 * @returns 8-digit sequential barcode string (e.g., '20260584')
 */
export async function generateNextPatronBarcode(targetYear?: number): Promise<string> {
  const year = targetYear || new Date().getFullYear();
  const sequenceKey = 'patron_member_sequence';

  // Check if counter document already exists
  const existingCounter = await Counter.findById(sequenceKey);

  if (!existingCounter) {
    // Look up the highest existing 4-digit sequence among all registered patrons
    const patrons = await Patron.find({ barcode: /^\d{8}$/ })
      .select('barcode')
      .lean();

    let maxSeq = 0;
    for (const p of patrons) {
      if (typeof p.barcode === 'string' && /^\d{8}$/.test(p.barcode)) {
        const seq = parseInt(p.barcode.slice(4), 10);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    // Initialize the counter with the highest existing sequence in the database
    await Counter.findByIdAndUpdate(
      sequenceKey,
      { $setOnInsert: { seq: maxSeq } },
      { upsert: true, new: true }
    );
  }

  // Atomically increment the sequence by 1 based on the last registered member
  const updatedCounter = await Counter.findByIdAndUpdate(
    sequenceKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequenceNumber = updatedCounter.seq;

  if (sequenceNumber > 9999) {
    throw new Error(
      `Maximum patron sequence limit (9999) reached. Institutional capacity limit reached.`
    );
  }

  const paddedSequence = String(sequenceNumber).padStart(4, '0');
  const generatedBarcode = `${year}${paddedSequence}`;

  return generatedBarcode;
}

/**
 * Previews the next sequential barcode without advancing the counter.
 * Useful for displaying the upcoming barcode in the registration UI.
 *
 * @param targetYear - Optional registration year (defaults to current calendar year)
 * @returns Object with preview barcode string, year, and next sequence number
 */
export async function previewNextPatronBarcode(targetYear?: number): Promise<{
  barcode: string;
  year: number;
  sequence: number;
}> {
  const year = targetYear || new Date().getFullYear();
  const sequenceKey = 'patron_member_sequence';

  const existingCounter = await Counter.findById(sequenceKey);

  let currentSeq = 0;

  if (existingCounter) {
    currentSeq = existingCounter.seq;
  } else {
    const patrons = await Patron.find({ barcode: /^\d{8}$/ })
      .select('barcode')
      .lean();

    for (const p of patrons) {
      if (typeof p.barcode === 'string' && /^\d{8}$/.test(p.barcode)) {
        const seq = parseInt(p.barcode.slice(4), 10);
        if (seq > currentSeq) {
          currentSeq = seq;
        }
      }
    }
  }

  const nextSeq = currentSeq + 1;
  const paddedSequence = String(nextSeq).padStart(4, '0');
  const barcode = `${year}${paddedSequence}`;

  return {
    barcode,
    year,
    sequence: nextSeq,
  };
}
