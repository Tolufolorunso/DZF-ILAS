import { extractText } from 'unpdf';

export interface IParsedCalendarEvent {
  id: string;
  eventName: string;
  eventDate: string; // 'YYYY-MM-DD'
  academicYear: number;
  category: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
  location: string;
  targetAudience: string;
  arrivalTime: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function inferCategory(text: string): 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general' {
  const lower = text.toLowerCase();
  if (/(holiday|vacation|break|closure|easter|christmas|ramadan|eid|new year|labor day|independence)/i.test(lower)) {
    return 'holiday';
  }
  if (/(competition|olympiad|tournament|quiz|sports|inter-house|championship|match)/i.test(lower)) {
    return 'competition';
  }
  if (/(workshop|training|seminar|masterclass|bootcamp|professional dev|orientation)/i.test(lower)) {
    return 'workshop';
  }
  if (/(meeting|board|agm|briefing|conference|council|session|executive|consultation)/i.test(lower)) {
    return 'meeting';
  }
  if (/(assembly|convocation|commencement|induction|matriculation|ceremony|valedictory)/i.test(lower)) {
    return 'assembly';
  }
  return 'general';
}

function inferAudience(text: string): string {
  const match = text.match(/(?:audience|for|target audience):\s*([^,|;]+)/i);
  if (match) return match[1].trim();

  if (/all\s+staff/i.test(text)) return 'All Staff';
  if (/students?\s*(?:and|&)\s*staff/i.test(text)) return 'Students & Staff';
  if (/students?/i.test(text)) return 'Students';
  if (/parents?/i.test(text)) return 'Parents & Guardians';
  if (/executives?|management|board/i.test(text)) return 'Management & Board';
  return 'All Foundation Staff';
}

function inferLocation(text: string): string {
  const match = text.match(/(?:location|venue|room|hall|campus):\s*([^,|;]+)/i);
  if (match) return match[1].trim();

  if (/main\s+auditorium|hall|auditorium/i.test(text)) return 'Main Auditorium';
  if (/conference\s+room/i.test(text)) return 'Conference Room A';
  if (/sports\s+complex|field/i.test(text)) return 'Sports Pavilion';
  if (/virtual|zoom|teams|online/i.test(text)) return 'Virtual (Online)';
  if (/campus/i.test(text)) return 'Foundation Central Campus';
  return 'Main Campus';
}

function inferTime(text: string): string {
  const match = text.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\b/);
  if (match) return match[1].trim();
  return '09:00 AM';
}

function cleanTitle(raw: string): string {
  let cleaned = raw
    .replace(/(?:location|venue|audience|time|target audience):\s*[^,|;]+/gi, '')
    .replace(/\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?|\d{1,2}\s*(?:AM|PM|am|pm))\b/g, '')
    .replace(/^[–—:|\-,.\s]+/, '')
    .replace(/[–—:|\-,.\s]+$/, '')
    .trim();

  // If title was pipe-separated, the first segment is usually the title
  if (cleaned.includes('|')) {
    const parts = cleaned.split('|').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      cleaned = parts[0];
    }
  }

  return cleaned.replace(/[–—:|\-,.\s]+$/, '').trim();
}

/**
 * Parses raw text extracted from an operational calendar PDF into structured event items.
 */
export function parseCalendarText(rawText: string, defaultYear: number = new Date().getFullYear()): IParsedCalendarEvent[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && !/^(page\s+\d+|confidential|operational\s+calendar)$/i.test(l));

  const events: IParsedCalendarEvent[] = [];
  let itemCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Regex 1: Day First e.g. "15th February 2027" or "15 Feb 2027"
    const dayFirstMatch = line.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:[,\s]+(\d{4}))?\b/i
    );

    // Regex 2: Month First e.g. "January 15, 2027" or "Jan 15th"
    const monthFirstMatch = line.match(
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?!\d)(?:\s*[-–—]\s*\d{1,2}(?:st|nd|rd|th)?)?(?:[,\s]+(\d{4}))?\b/i
    );

    // Regex 3: ISO / Slash / Dash e.g. "2027-01-15" or "15/01/2027"
    const numericMatch = line.match(/\b(?:(\d{4})[-/](\d{1,2})[-/](\d{1,2})|(\d{1,2})[-/](\d{1,2})[-/](\d{4}))\b/);

    let parsedDate: Date | null = null;
    let matchedText = '';
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    if (dayFirstMatch) {
      const dayNum = parseInt(dayFirstMatch[1], 10);
      const monthStr = dayFirstMatch[2].toLowerCase();
      const monthNum = MONTH_NAMES[monthStr] ?? 0;
      const yearNum = dayFirstMatch[3] ? parseInt(dayFirstMatch[3], 10) : defaultYear;

      parsedDate = new Date(Date.UTC(yearNum, monthNum, dayNum));
      matchedText = dayFirstMatch[0];
      confidence = dayFirstMatch[3] ? 'high' : 'medium';
    } else if (monthFirstMatch) {
      const monthStr = monthFirstMatch[1].toLowerCase();
      const monthNum = MONTH_NAMES[monthStr] ?? 0;
      const dayNum = parseInt(monthFirstMatch[2], 10);
      const yearNum = monthFirstMatch[3] ? parseInt(monthFirstMatch[3], 10) : defaultYear;

      parsedDate = new Date(Date.UTC(yearNum, monthNum, dayNum));
      matchedText = monthFirstMatch[0];
      confidence = monthFirstMatch[3] ? 'high' : 'medium';
    } else if (numericMatch) {
      let yearNum = defaultYear;
      let monthNum = 0;
      let dayNum = 1;

      if (numericMatch[1]) {
        // YYYY-MM-DD
        yearNum = parseInt(numericMatch[1], 10);
        monthNum = parseInt(numericMatch[2], 10) - 1;
        dayNum = parseInt(numericMatch[3], 10);
      } else if (numericMatch[6]) {
        // DD/MM/YYYY or MM/DD/YYYY
        yearNum = parseInt(numericMatch[6], 10);
        monthNum = parseInt(numericMatch[5], 10) - 1;
        dayNum = parseInt(numericMatch[4], 10);
      }
      parsedDate = new Date(Date.UTC(yearNum, monthNum, dayNum));
      matchedText = numericMatch[0];
      confidence = 'high';
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      // Extract title and details from the remainder of this line or subsequent line if short
      let remainder = line.replace(matchedText, '').trim();

      // If the remainder is empty or very short, peek at next line
      if (remainder.length < 3 && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}[-/])/i.test(nextLine)) {
          remainder = nextLine;
          i++; // advance
        }
      }

      const eventTitle = cleanTitle(remainder);
      if (eventTitle.length >= 3) {
        const year = parsedDate.getUTCFullYear();
        const isoDate = parsedDate.toISOString().split('T')[0];

        events.push({
          id: `preview-${itemCounter++}`,
          eventName: eventTitle,
          eventDate: isoDate,
          academicYear: year,
          category: inferCategory(line + ' ' + remainder),
          location: inferLocation(line + ' ' + remainder),
          targetAudience: inferAudience(line + ' ' + remainder),
          arrivalTime: inferTime(line + ' ' + remainder),
          description: `Extracted operational calendar milestone: ${eventTitle}`,
          confidence,
        });
      }
    }
  }

  // Sort chronologically by date
  return events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

/**
 * Extracts raw text from an uploaded PDF file buffer and returns structured parsed events.
 */
export async function extractAndParseCalendarPdf(
  buffer: Uint8Array | ArrayBuffer,
  defaultYear?: number
): Promise<{ totalPages: number; events: IParsedCalendarEvent[]; rawTextSnippet: string }> {
  const { text, totalPages } = await extractText(buffer, { mergePages: true });
  const rawText = typeof text === 'string' ? text : '';

  const events = parseCalendarText(rawText, defaultYear);

  return {
    totalPages,
    events,
    rawTextSnippet: rawText.slice(0, 500),
  };
}
