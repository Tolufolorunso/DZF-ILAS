export interface DeweyClass {
  code: string;
  name: string;
  description: string;
  category?: string;
}

export const DEWEY_CLASSES: DeweyClass[] = [
  // 000 Computer Science, Information & General Works
  { code: '000', name: 'Computer Science, Information & General Works', description: 'Computing, encyclopedias, bibliographies, library science', category: '000 Generalities' },
  { code: '004', name: 'Data Processing & Computer Science', description: 'Hardware, software, networks, artificial intelligence, algorithms', category: '000 Generalities' },
  { code: '020', name: 'Library & Information Sciences', description: 'Cataloging, archival management, digital repositories, research literacy', category: '000 Generalities' },

  // 100 Philosophy & Psychology
  { code: '100', name: 'Philosophy & Psychology', description: 'Metaphysics, epistemology, logic, ethics, human thought', category: '100 Philosophy' },
  { code: '150', name: 'Psychology & Behavioral Studies', description: 'Cognition, mental health, emotional development, counseling', category: '100 Philosophy' },
  { code: '170', name: 'Ethics & Moral Philosophy', description: 'Applied ethics, leadership values, civic responsibility', category: '100 Philosophy' },

  // 200 Religion
  { code: '200', name: 'Religion & Theology', description: 'Theology, scriptures, comparative religion, religious history', category: '200 Religion' },
  { code: '220', name: 'The Bible & Biblical Studies', description: 'Old & New Testament, commentaries, biblical narratives', category: '200 Religion' },
  { code: '290', name: 'Comparative & World Religions', description: 'Christianity, Islam, African Traditional Religion, spiritual philosophy', category: '200 Religion' },

  // 300 Social Sciences
  { code: '300', name: 'Social Sciences & Society', description: 'Sociology, anthropology, cultural studies, social structures', category: '300 Social Sciences' },
  { code: '320', name: 'Political Science & Civics', description: 'Government systems, governance, public policy, civil society', category: '300 Social Sciences' },
  { code: '330', name: 'Economics & Financial Literacy', description: 'Micro/macroeconomics, enterprise, monetary systems, commerce', category: '300 Social Sciences' },
  { code: '340', name: 'Law & Human Rights', description: 'Constitutional law, international jurisprudence, human rights treaties', category: '300 Social Sciences' },
  { code: '370', name: 'Education & Pedagogy', description: 'Curriculum development, teaching methods, educational technology', category: '300 Social Sciences' },

  // 400 Language
  { code: '400', name: 'Language & Linguistics', description: 'Linguistics, grammar, structural language, phonetics', category: '400 Language' },
  { code: '420', name: 'English Language', description: 'Grammar, vocabulary, phonology, writing composition', category: '400 Language' },
  { code: '440', name: 'French & Romance Languages', description: 'French grammar, conversation, Francophone communication', category: '400 Language' },
  { code: '490', name: 'African Languages & Dialects', description: 'Yoruba, Igbo, Hausa, indigenous linguistic preservation', category: '400 Language' },

  // 500 Science
  { code: '500', name: 'Pure & Natural Sciences', description: 'Natural philosophy, scientific inquiry, multidisciplinary research', category: '500 Science' },
  { code: '510', name: 'Mathematics', description: 'Arithmetic, algebra, geometry, calculus, statistics, probability', category: '500 Science' },
  { code: '530', name: 'Physics', description: 'Mechanics, electricity, optics, thermodynamics, modern physics', category: '500 Science' },
  { code: '540', name: 'Chemistry & Allied Sciences', description: 'Organic/inorganic chemistry, physical chemistry, biochemistry', category: '500 Science' },
  { code: '570', name: 'Biology & Life Sciences', description: 'Ecology, genetics, cellular biology, plant & animal anatomy', category: '500 Science' },

  // 600 Technology & Applied Sciences
  { code: '600', name: 'Technology & Applied Sciences', description: 'Applied sciences, industry, manufacturing, practical innovation', category: '600 Technology' },
  { code: '610', name: 'Medicine & Health Sciences', description: 'Human anatomy, public health, pharmacy, nutrition, nursing', category: '600 Technology' },
  { code: '620', name: 'Engineering & Applied Operations', description: 'Mechanical, electrical, civil, software engineering & robotics', category: '600 Technology' },
  { code: '630', name: 'Agriculture & Agronomy', description: 'Crop cultivation, animal husbandry, agricultural economics', category: '600 Technology' },
  { code: '650', name: 'Management & Business Operations', description: 'Accounting, marketing, leadership, administration, entrepreneurship', category: '600 Technology' },

  // 700 Arts & Recreation
  { code: '700', name: 'Arts & Recreation', description: 'Visual arts, architecture, music, sports, performing arts', category: '700 Arts' },
  { code: '720', name: 'Architecture & Spatial Design', description: 'Urban planning, architectural drawing, building aesthetics', category: '700 Arts' },
  { code: '780', name: 'Music & Musical Theory', description: 'Compositions, musical instruments, African rhythms, audio arts', category: '700 Arts' },
  { code: '790', name: 'Sports, Games & Entertainment', description: 'Physical education, athletics, team sports, creative recreation', category: '700 Arts' },

  // 800 Literature
  { code: '800', name: 'Literature & Rhetoric', description: 'Poetry, drama, essays, world literature, literary criticism', category: '800 Literature' },
  { code: '810', name: 'American Literature', description: 'American prose, novels, poetry, contemporary drama', category: '800 Literature' },
  { code: '820', name: 'English Literature', description: 'British classics, Shakespearean plays, Victorian prose', category: '800 Literature' },
  { code: '890', name: 'African & World Literatures', description: 'African fiction, Achebe, Soyinka, Adichie, African poetry & folktales', category: '800 Literature' },

  // 900 History & Geography
  { code: '900', name: 'History & Geography', description: 'World history, geography, exploration, cultural heritage', category: '900 History' },
  { code: '910', name: 'Geography & Travel', description: 'Physical geography, cartography, international travel memoirs', category: '900 History' },
  { code: '920', name: 'Biography & Memoirs', description: 'Autobiographies, life stories of leaders, inventors, scholars', category: '900 History' },
  { code: '960', name: 'History of Africa & Nigeria', description: 'Pre-colonial kingdoms, Nigerian independence, modern African history', category: '900 History' },
];

/**
 * Validates a Dewey Decimal classification code (e.g. "800", "510", "020", "890.15")
 */
export function validateClassification(classification: string): boolean {
  if (!classification || typeof classification !== 'string') return false;
  const trimmed = classification.trim();
  return /^\d{3}(\.\d+)?$/.test(trimmed);
}

/**
 * Look up a Dewey class by exact code or closest hundred parent
 */
export function getDeweyClassInfo(code: string): DeweyClass | undefined {
  if (!code) return undefined;
  const clean = code.trim();
  const exact = DEWEY_CLASSES.find((c) => c.code === clean);
  if (exact) return exact;

  // Fallback to hundreds class
  const hundreds = clean.slice(0, 1) + '00';
  return DEWEY_CLASSES.find((c) => c.code === hundreds);
}
