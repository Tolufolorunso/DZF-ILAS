import { CertificateTemplateType, ISignatory } from '@/models/Certificate';

export type { CertificateTemplateType, ISignatory };

export interface ICertificateData {
  _id: string;
  certificateCode: string;
  templateType: CertificateTemplateType;
  title: string;
  recipientName: string;
  recipientBarcode?: string;
  recipientCohort?: string;
  recipientCategory?: string;
  awardDescription: string;
  issueDate: string; // ISO date string
  primarySignatory: ISignatory;
  secondarySignatory: ISignatory;
  goldSealText?: string;
  isRevoked: boolean;
  issuedBy: string;
  library: string;
  createdAt?: string;
}

export interface ICreateCertificateInput {
  templateType: CertificateTemplateType;
  title: string;
  recipientName: string;
  recipientBarcode?: string;
  recipientCohort?: string;
  recipientCategory?: string;
  awardDescription: string;
  issueDate?: string | Date;
  primarySignatory?: ISignatory;
  secondarySignatory?: ISignatory;
  goldSealText?: string;
}

export interface IBatchGenerateCertificatesInput {
  sourceType: 'cohort' | 'competition' | 'patrons';
  cohortType?: string; // e.g. 'PIONEER'
  competitionSessionKey?: string;
  competitionCategory?: string;
  recipientBarcodes?: string[]; // optional selective list
  templateType?: CertificateTemplateType;
  title?: string;
  awardDescription?: string;
  issueDate?: string | Date;
  primarySignatory?: ISignatory;
  secondarySignatory?: ISignatory;
  goldSealText?: string;
}

export interface ICertificateTemplatePreset {
  id: CertificateTemplateType;
  name: string;
  subtitle: string;
  defaultTitle: string;
  defaultCitation: string;
  defaultSealText: string;
  accentColor: string;
  iconName: string;
}

export const CERTIFICATE_PRESETS: ICertificateTemplatePreset[] = [
  {
    id: 'digital_literacy',
    name: 'Digital Literacy Academy',
    subtitle: 'ICT & Computing Cohorts',
    defaultTitle: 'Certificate of Completion',
    defaultCitation:
      'For outstanding dedication, technical proficiency, and successful completion of the intensive Digital Literacy, Computing & Office Productivity Program at the Dzuels Educational Foundation.',
    defaultSealText: 'DZUELS EDUCATIONAL FOUNDATION • DIGITAL ACADEMY • OFFICIAL SEAL',
    accentColor: '#1d4670',
    iconName: 'AwardIcon',
  },
  {
    id: 'reading_competition',
    name: 'Reading Competition',
    subtitle: 'Academic Contest Awards',
    defaultTitle: 'Certificate of Achievement',
    defaultCitation:
      'In recognition of distinguished literary excellence, analytical depth, and exemplary performance in the Dzuels Educational Foundation Annual Reading Competition.',
    defaultSealText: 'DZUELS EDUCATIONAL FOUNDATION • READING COMPETITION • MERIT SEAL',
    accentColor: '#7a1515',
    iconName: 'TrophyIcon',
  },
  {
    id: 'library_merit',
    name: 'Library Academic Merit',
    subtitle: 'Reader Honor Roll & Scholars',
    defaultTitle: 'Certificate of Excellence',
    defaultCitation:
      'Awarded in commendation of extraordinary academic curiosity, distinguished library readership, and exemplary engagement with the Dzuels Educational Resource Center.',
    defaultSealText: 'DZUELS EDUCATIONAL FOUNDATION • LIBRARY RESOURCE CENTER • EXCELLENCE',
    accentColor: '#cca349',
    iconName: 'StarIcon',
  },
  {
    id: 'custom',
    name: 'Custom Citation',
    subtitle: 'Bespoke Foundation Awards',
    defaultTitle: 'Certificate of Recognition',
    defaultCitation:
      'Presented in recognition of outstanding commitment, distinguished character, and notable contribution to the Dzuels Educational Foundation academic community.',
    defaultSealText: 'DZUELS EDUCATIONAL FOUNDATION • OFFICIAL SEAL • 2026',
    accentColor: '#540a0a',
    iconName: 'CheckCircleIcon',
  },
];

export interface ICertificateVerificationResult {
  isValid: boolean;
  certificateCode: string;
  certificate?: ICertificateData;
  error?: string;
}
