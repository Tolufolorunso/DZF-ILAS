export interface SchoolOption {
  label: string;
  value: string;
  address: string;
}

export const IJERO_SCHOOL_OPTIONS: SchoolOption[] = [
  { value: '', label: 'Select School', address: '' },
  {
    label: 'Doherty Memorial Grammar School',
    value: 'Doherty Memorial Grammar School',
    address: 'doherty road, Ijero ekiti',
  },
  {
    label: 'Doherty Memorial N/P School',
    value: 'Doherty Memorial N/P School',
    address: 'doherty road, Ijero ekiti',
  },
  {
    label: 'Emmanuel Innovation Academy',
    value: 'Emmanuel Innovation Academy',
    address: 'emmanuel avenue, oke-oro road, Ijero ekiti',
  },
  {
    label: 'Emmanuel Innovation Academy N/P',
    value: 'Emmanuel Innovation Academy N/P',
    address: 'emmanuel avenue, oke-oro road, Ijero ekiti',
  },
  {
    label: 'CAC High school',
    value: 'CAC High school',
    address: 'stadium road odo oye street, Ijero ekiti',
  },
  {
    label: 'St. David CAC N/P school',
    value: 'St. David CAC N/P school',
    address: 'sawmil road odo-afa street, Ijero ekiti',
  },
  {
    label: 'Sure Foundation Model College',
    value: 'Sure Foundation Model College',
    address: 'Odo-Agbo Street, Ijero ekiti',
  },
  {
    label: 'Sure Foundation N/P School',
    value: 'Sure Foundation N/P School',
    address: 'Iwaro Street, Ijero ekiti',
  },
  {
    label: "St. Gabriel's Catholic secondary school",
    value: "St. Gabriel's Catholic secondary school",
    address: 'P.O.Box 11, GRA 1, Ijero ekiti',
  },
  {
    label: 'Jolad Model College',
    value: 'Jolad Model College',
    address: '9 ijurin street, Ijero ekiti',
  },
  {
    label: 'Jolad Model N/P School',
    value: 'Jolad Model N/P School',
    address: '9 ijurin street, Ijero ekiti',
  },
  {
    label: 'Mercy Model N/P School',
    value: 'Mercy Model N/P School',
    address: '17 iwaro street, Ijero ekiti',
  },
  {
    label: 'Dayo Abe Model College',
    value: 'Dayo Abe Model College',
    address: '17 iwaro street, Ijero ekiti',
  },
  {
    label: 'Faith Royal College',
    value: 'Faith Royal College',
    address: 'Oju Oro Street, Ijero Ekiti',
  },
  {
    label: 'St. Peter Catholic School',
    value: 'St. Peter Catholic School',
    address: 'Iwaro street, Ijero Ekiti',
  },
  {
    label: 'The Apostelic Pilot N/P School',
    value: 'The Apostelic Pilot N/P School',
    address: 'Iwaro street,ijero-ekiti',
  },
  {
    label: 'Pillar of Success School Secondary School',
    value: 'Pillar of Success School Secondary School',
    address: 'Odo Oye Street, Ijero Ekiti',
  },
  {
    label: 'Pillar of Success School N/P School',
    value: 'Pillar of Success School N/P School',
    address: 'Odo Oye Street, Ijero Ekiti',
  },
  {
    label: 'Everlead Secondary School',
    value: 'Everlead Secondary School',
    address: 'igboloko street, Ijero Ekiti',
  },
  {
    label: 'Everlead N/P School',
    value: 'Everlead N/P School',
    address: 'igboloko street, Ijero Ekiti',
  },
  {
    label: 'Prime Success Model School',
    value: 'Prime Success Model School',
    address: 'Secretariate Road, Ijero Ekiti',
  },
  {
    label: 'Christ Our Partner And Shepherd COPAS',
    value: 'Christ Our Partner And Shepherd COPAS',
    address: 'Beside Doherty, Ijero Ekiti',
  },
  {
    label: 'others',
    value: 'others',
    address: '',
  },
];

/**
 * Retrieve the known address for a predefined school.
 */
export function getSchoolAddress(schoolName: string): string {
  if (!schoolName) return '';
  const match = IJERO_SCHOOL_OPTIONS.find(
    (s) => s.value.toLowerCase() === schoolName.trim().toLowerCase()
  );
  return match?.address || '';
}

/**
 * Check if a school name belongs to the predefined directory.
 */
export function isPredefinedSchool(schoolName: string): boolean {
  if (!schoolName) return false;
  return IJERO_SCHOOL_OPTIONS.some(
    (s) => s.value && s.value !== 'others' && s.value.toLowerCase() === schoolName.trim().toLowerCase()
  );
}
