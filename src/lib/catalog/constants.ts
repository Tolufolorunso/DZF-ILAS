export interface DeweyClass {
  code: string;
  name: string;
  description: string;
}

export const DEWEY_CLASSES: DeweyClass[] = [
  { code: '000', name: 'Computer Science, Information & General Works', description: 'Computing, encyclopedias, bibliographies, library science' },
  { code: '100', name: 'Philosophy & Psychology', description: 'Metaphysics, ethics, logic, human behavior, psychology' },
  { code: '200', name: 'Religion', description: 'Theology, scriptures, comparative religion, religious history' },
  { code: '300', name: 'Social Sciences', description: 'Sociology, politics, education, law, economics, commerce' },
  { code: '400', name: 'Language', description: 'Linguistics, English, French, Yoruba, grammar, dictionaries' },
  { code: '500', name: 'Science', description: 'Mathematics, physics, chemistry, biology, earth sciences' },
  { code: '600', name: 'Technology & Applied Sciences', description: 'Medicine, engineering, agriculture, management, manufacturing' },
  { code: '700', name: 'Arts & Recreation', description: 'Visual arts, architecture, music, sports, games, performing arts' },
  { code: '800', name: 'Literature', description: 'Poetry, plays, novels, essays, African & world literature' },
  { code: '900', name: 'History & Geography', description: 'World history, geography, travel, biographies, genealogy' },
];

/**
 * Validates a Dewey Decimal classification code (e.g. "800", "510", "020")
 */
export function validateClassification(classification: string): boolean {
  if (!classification || typeof classification !== 'string') return false;
  const trimmed = classification.trim();
  return /^\d{3}(\.\d+)?$/.test(trimmed);
}
