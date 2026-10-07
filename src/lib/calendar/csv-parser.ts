/**
 * Resilient Operational Calendar CSV Parser & Multi-Stage Milestone Extractor
 * Designed for Dzuels Foundation operational calendar milestones.
 */

export interface IParsedCsvEvent {
  id: string;
  eventName: string;
  eventDate: string; // 'YYYY-MM-DD'
  academicYear: number;
  category: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
  location: string;
  targetAudience: string;
  arrivalTime: string;
  description?: string;
  participants?: string;
  focalPerson?: string;
  remarks?: string;
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

/**
 * Standard RFC 4180 CSV parser handling multiline cells, quotes, and commas.
 */
export function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;

  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted section
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',' || char === '\t' || char === ';') {
        currentRecord.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRecord.push(currentField.trim());
        records.push(currentRecord);
        currentRecord = [];
        currentField = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRecord.push(currentField.trim());
        records.push(currentRecord);
        currentRecord = [];
        currentField = '';
        i++;
        continue;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // Push last field & record if text didn't end with a newline
  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    records.push(currentRecord);
  }

  return records.filter((r) => r.some((field) => field.trim().length > 0));
}

/**
 * Normalize header labels to standard operational calendar column keys.
 */
function mapHeaderColumns(headerRow: string[]): {
  dateIdx: number;
  eventIdx: number;
  participantsIdx: number;
  focalPersonIdx: number;
  remarksIdx: number;
} {
  let dateIdx = -1;
  let eventIdx = -1;
  let participantsIdx = -1;
  let focalPersonIdx = -1;
  let remarksIdx = -1;

  headerRow.forEach((col, idx) => {
    const clean = col.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.includes('date') || clean === 'when' || clean === 'day') {
      if (dateIdx === -1) dateIdx = idx;
    } else if (clean.includes('event') || clean.includes('title') || clean.includes('activity') || clean === 'name') {
      if (eventIdx === -1) eventIdx = idx;
    } else if (clean.includes('participant') || clean.includes('attendee') || clean.includes('audience')) {
      if (participantsIdx === -1) participantsIdx = idx;
    } else if (
      clean.includes('focal') ||
      clean.includes('lead') ||
      clean.includes('pm') ||
      clean.includes('coordinator') ||
      clean.includes('person')
    ) {
      if (focalPersonIdx === -1) focalPersonIdx = idx;
    } else if (clean.includes('remark') || clean.includes('note') || clean.includes('detail') || clean.includes('comment')) {
      if (remarksIdx === -1) remarksIdx = idx;
    }
  });

  // Sensible default column index fallbacks if headers are absent or non-standard:
  // Date, Event, Participants, Focal Person, Remarks
  if (dateIdx === -1) dateIdx = 0;
  if (eventIdx === -1 && headerRow.length > 1) eventIdx = 1;
  if (participantsIdx === -1 && headerRow.length > 2) participantsIdx = 2;
  if (focalPersonIdx === -1 && headerRow.length > 3) focalPersonIdx = 3;
  if (remarksIdx === -1 && headerRow.length > 4) remarksIdx = 4;

  return { dateIdx, eventIdx, participantsIdx, focalPersonIdx, remarksIdx };
}

/**
 * Infer activity category from text clues.
 */
export function inferCategory(
  text: string
): 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general' {
  const lower = text.toLowerCase();
  if (
    /(holiday|vacation|break|closure|easter|christmas|ramadan|eid|new year|labor day|independence|resumes|resumption)/i.test(
      lower
    )
  ) {
    return 'holiday';
  }
  if (
    /(competition|olympiad|tournament|quiz|sports|inter-house|championship|match|spelling bee|bee|stage\s*1|stage\s*2|finale)/i.test(
      lower
    )
  ) {
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

/**
 * Clean and format stage labels.
 */
function cleanStageLabel(raw: string): string {
  return raw
    .replace(/^[–—:|\-,.\s]+/, '')
    .replace(/[–—:|\-,.\s]+$/, '')
    .trim();
}

interface ExtractedDateStage {
  dateStr: string; // 'YYYY-MM-DD'
  stageLabel?: string;
  year: number;
}

/**
 * Parses dates, date ranges, and multi-stage date streams from a date cell.
 * E.g.: "February 17th– Finale Feb. 6 th – Stage1&2 Jnr Elem Feb.9th – Stage1&2 Snr Elem"
 */
function extractDateStages(rawDateText: string, targetYear: number): ExtractedDateStage[] {
  const text = rawDateText.trim();
  if (!text) return [];

  const results: ExtractedDateStage[] = [];

  // Match:
  // Pattern A: Month followed by Day (e.g. "February 17th", "Feb. 6 th", "Feb.9th", "January 4th", "Jan 24, 2027")
  // Pattern B: Day followed by Month (e.g. "17th February", "4 Jan 2027")
  // Pattern C: Subsequent Day with ordinal suffix (e.g. "9th", "6 th") not preceded by words like Stage/Grade/Level
  const monthNamesPattern =
    'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';

  // 1. Month then Day: "Feb. 6 th", "Feb.9th", "January 4th"
  const monthDayRegex = new RegExp(
    `\\b(${monthNamesPattern})\\.?\\s*(\\d{1,2})\\s*(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?`,
    'gi'
  );

  // 2. Day then Month: "17th February", "4 Jan"
  const dayMonthRegex = new RegExp(
    `\\b(\\d{1,2})\\s*(?:st|nd|rd|th)?\\s+(${monthNamesPattern})\\.?(?:\\s*,?\\s*(\\d{4}))?`,
    'gi'
  );

  const matches: Array<{
    monthName: string;
    day: number;
    year?: number;
    index: number;
    length: number;
  }> = [];

  let match: RegExpExecArray | null;

  while ((match = monthDayRegex.exec(text)) !== null) {
    const rawMonth = match[1].toLowerCase().substring(0, 3);
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : undefined;
    if (day >= 1 && day <= 31 && MONTH_NAMES[rawMonth] !== undefined) {
      matches.push({
        monthName: rawMonth,
        day,
        year,
        index: match.index,
        length: match[0].length,
      });
    }
  }

  while ((match = dayMonthRegex.exec(text)) !== null) {
    const day = parseInt(match[1], 10);
    const rawMonth = match[2].toLowerCase().substring(0, 3);
    const year = match[3] ? parseInt(match[3], 10) : undefined;
    if (day >= 1 && day <= 31 && MONTH_NAMES[rawMonth] !== undefined) {
      // Avoid duplicate match at same index
      if (!matches.some((m) => Math.abs(m.index - match!.index) < 4)) {
        matches.push({
          monthName: rawMonth,
          day,
          year,
          index: match.index,
          length: match[0].length,
        });
      }
    }
  }

  // Sort matched dates by position in string
  matches.sort((a, b) => a.index - b.index);

  // If no word-month pattern matched, check ISO format 'YYYY-MM-DD' or 'DD/MM/YYYY'
  if (matches.length === 0) {
    const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);
      const isoDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return [{ dateStr: isoDate, year: y }];
    }

    const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (slashMatch) {
      const d = parseInt(slashMatch[1], 10);
      const m = parseInt(slashMatch[2], 10) - 1;
      let y = parseInt(slashMatch[3], 10);
      if (y < 100) y += 2000;
      const isoDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return [{ dateStr: isoDate, year: y }];
    }
  }

  if (matches.length === 0) {
    return [];
  }

  // Multi-stage extraction: text following each date match belongs to that date stage
  for (let idx = 0; idx < matches.length; idx++) {
    const current = matches[idx];
    const next = matches[idx + 1];

    const stageStartIndex = current.index + current.length;
    const stageEndIndex = next ? next.index : text.length;
    const rawStageText = text.substring(stageStartIndex, stageEndIndex);
    const stageLabel = cleanStageLabel(rawStageText);

    const monthNum = MONTH_NAMES[current.monthName] ?? 0;
    const year = current.year || targetYear;
    const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(current.day).padStart(2, '0')}`;

    results.push({
      dateStr,
      stageLabel: stageLabel.length > 0 ? stageLabel : undefined,
      year,
    });
  }

  return results;
}

/**
 * Synthesizes a clean event title when empty or enriched by sub-stages.
 */
function buildEventTitle(
  mainEventTitle: string,
  stageLabel?: string,
  remarks?: string
): string {
  const cleanMain = mainEventTitle.trim();
  const cleanStage = stageLabel ? cleanStageLabel(stageLabel) : '';

  if (cleanMain && cleanStage) {
    // If main event title already contains the stage label, don't duplicate
    if (cleanMain.toLowerCase().includes(cleanStage.toLowerCase())) {
      return cleanMain;
    }
    return `${cleanMain} - ${cleanStage}`;
  }

  if (cleanMain) {
    return cleanMain;
  }

  if (cleanStage) {
    return cleanStage;
  }

  // Fallback from remarks if event is empty
  if (remarks && remarks.trim().length > 0) {
    const trimmed = remarks.trim();
    const firstSentence = trimmed.split(/[.\n;]/)[0].trim();
    if (firstSentence.length > 0 && firstSentence.length <= 60) {
      return firstSentence;
    }
    if (firstSentence.length > 60) {
      return firstSentence.substring(0, 57) + '...';
    }
  }

  return 'Foundation Operational Milestone';
}

/**
 * Main parser entry point. Takes raw CSV text and targetYear, returns structured events.
 */
export function extractAndParseCalendarCsv(
  csvContent: string,
  targetYear: number = new Date().getFullYear()
): {
  events: IParsedCsvEvent[];
  rawRowsCount: number;
} {
  const records = parseCsvRecords(csvContent);
  if (records.length === 0) {
    return { events: [], rawRowsCount: 0 };
  }

  // Look for header row in top 3 lines
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(3, records.length); i++) {
    const rowStr = records[i].join(' ').toLowerCase();
    if (rowStr.includes('date') || rowStr.includes('event')) {
      headerRowIdx = i;
      break;
    }
  }

  const headerRow = records[headerRowIdx];
  const colMap = mapHeaderColumns(headerRow);
  const dataRows = records.slice(headerRowIdx + 1);

  const parsedEvents: IParsedCsvEvent[] = [];
  let eventCounter = 1;

  for (const row of dataRows) {
    const rawDate = row[colMap.dateIdx] || '';
    const rawEvent = row[colMap.eventIdx] || '';
    const rawParticipants = row[colMap.participantsIdx] || '';
    const rawFocalPerson = row[colMap.focalPersonIdx] || '';
    const rawRemarks = row[colMap.remarksIdx] || '';

    if (!rawDate.trim() && !rawEvent.trim() && !rawRemarks.trim()) {
      continue;
    }

    const stages = extractDateStages(rawDate, targetYear);

    if (stages.length === 0) {
      // If we couldn't parse any explicit date, skip or attempt fallback if year was given
      continue;
    }

    for (const stage of stages) {
      const finalTitle = buildEventTitle(rawEvent, stage.stageLabel, rawRemarks);
      const combinedContext = `${finalTitle} ${stage.stageLabel || ''} ${rawRemarks} ${rawParticipants}`;
      const category = inferCategory(combinedContext);

      parsedEvents.push({
        id: `csv-evt-${eventCounter++}-${Date.now().toString(36)}`,
        eventName: finalTitle,
        eventDate: stage.dateStr,
        academicYear: stage.year,
        category,
        location: 'DZF Learning Center',
        targetAudience: rawParticipants.trim() || 'All Team Members & Patrons',
        arrivalTime: '09:00 AM',
        description: rawRemarks.trim() || undefined,
        participants: rawParticipants.trim() || undefined,
        focalPerson: rawFocalPerson.trim() || undefined,
        remarks: rawRemarks.trim() || undefined,
        confidence: stage.stageLabel ? 'high' : 'medium',
      });
    }
  }

  // Sort chronologically
  parsedEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  return {
    events: parsedEvents,
    rawRowsCount: dataRows.length,
  };
}
