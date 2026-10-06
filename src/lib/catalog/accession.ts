import connectDB from '@/lib/db';
import { Cataloging } from '@/models/Cataloging';

export {
  type DeweyClass,
  DEWEY_CLASSES,
  validateClassification,
  getDeweyClassInfo,
} from './constants';

/**
 * Calculates the next Accession Control Number for a given classification code.
 * Follows the institutional format: "${classification}.${sequence}" (e.g. "800.718").
 */
export async function getNextControlNumber(classification: string): Promise<string> {
  await connectDB();
  const cleanClass = classification.trim();

  // Find all books sharing this exact classification prefix
  const existingBooks = await Cataloging.find({
    classification: cleanClass,
  })
    .select('controlNumber')
    .lean();

  let maxSequence = 0;

  for (const book of existingBooks) {
    if (!book.controlNumber) continue;
    // Extract suffix after dot
    const parts = book.controlNumber.split('.');
    if (parts.length >= 2) {
      const seqNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seqNum) && seqNum > maxSequence) {
        maxSequence = seqNum;
      }
    }
  }

  const nextSequence = maxSequence + 1;
  return `${cleanClass}.${nextSequence}`;
}

/**
 * Generates a default book copy barcode if one is not scanned from the physical book copy.
 * Format: "${classification}${sequence}${yearLastTwo}"
 */
export function generateDefaultBookBarcode(
  classification: string,
  controlNumber: string,
  publicationYear?: number
): string {
  const cleanClass = classification.replace(/\D/g, '').padEnd(3, '0').slice(0, 3);
  const parts = controlNumber.split('.');
  const seq = parts.length >= 2 ? parts[1].replace(/\D/g, '') : '1';
  const yearStr = publicationYear ? String(publicationYear).slice(-2) : String(new Date().getFullYear()).slice(-2);
  
  return `${cleanClass}${seq.padStart(3, '0')}${yearStr}`;
}
