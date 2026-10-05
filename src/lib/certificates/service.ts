import { connectDB } from '@/lib/db';
import { Certificate, ICertificateDocument } from '@/models/Certificate';
import { Counter } from '@/models/Counter';
import { Cohort } from '@/models/Cohort';
import { Competition } from '@/models/Competition';
import { Patron } from '@/models/Patron';
import {
  ICertificateData,
  ICreateCertificateInput,
  IBatchGenerateCertificatesInput,
  ICertificateVerificationResult,
  CERTIFICATE_PRESETS,
} from './types';

/**
 * Format Mongoose certificate document into JSON-serializable ICertificateData
 */
export function serializeCertificate(doc: ICertificateDocument): ICertificateData {
  return {
    _id: doc._id.toString(),
    certificateCode: doc.certificateCode,
    templateType: doc.templateType,
    title: doc.title,
    recipientName: doc.recipientName,
    recipientBarcode: doc.recipientBarcode,
    recipientCohort: doc.recipientCohort,
    recipientCategory: doc.recipientCategory,
    awardDescription: doc.awardDescription,
    issueDate: doc.issueDate ? new Date(doc.issueDate).toISOString() : new Date().toISOString(),
    primarySignatory: {
      name: doc.primarySignatory?.name || 'Dr. T. Folorunso',
      title: doc.primarySignatory?.title || 'Director, Dzuels Educational Foundation',
      signatureSvg: doc.primarySignatory?.signatureSvg,
    },
    secondarySignatory: {
      name: doc.secondarySignatory?.name || 'Academy Lead',
      title: doc.secondarySignatory?.title || 'Lead Instructor / Head Librarian',
      signatureSvg: doc.secondarySignatory?.signatureSvg,
    },
    goldSealText: doc.goldSealText,
    isRevoked: Boolean(doc.isRevoked),
    issuedBy: doc.issuedBy,
    library: doc.library || 'Dzuels Educational Foundation',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
  };
}

/**
 * Atomically generates the next unique certificate serial code.
 * Example: 'DZF-CERT-2026-0001'
 */
export async function generateCertificateCode(year?: number): Promise<string> {
  await connectDB();
  const currentYear = year || new Date().getFullYear();
  const prefix = `DZF-CERT-${currentYear}-`;
  return Counter.getNextSequence(`certificate_code_${currentYear}`, prefix, 4);
}

/**
 * Creates and persists a single certificate record.
 */
export async function createCertificate(
  input: ICreateCertificateInput,
  issuedBy: string
): Promise<ICertificateData> {
  await connectDB();

  if (!input.recipientName || !input.recipientName.trim()) {
    throw new Error('Recipient name is required to generate a certificate.');
  }
  if (!input.title || !input.title.trim()) {
    throw new Error('Certificate award title is required.');
  }
  if (!input.awardDescription || !input.awardDescription.trim()) {
    throw new Error('Award description citation is required.');
  }

  const certificateCode = await generateCertificateCode();
  const preset = CERTIFICATE_PRESETS.find((p) => p.id === input.templateType);

  const doc = await Certificate.create({
    certificateCode,
    templateType: input.templateType || 'digital_literacy',
    title: input.title.trim(),
    recipientName: input.recipientName.trim(),
    recipientBarcode: input.recipientBarcode?.trim() || undefined,
    recipientCohort: input.recipientCohort?.trim() || undefined,
    recipientCategory: input.recipientCategory?.trim() || undefined,
    awardDescription: input.awardDescription.trim(),
    issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
    primarySignatory: input.primarySignatory || {
      name: 'Dr. T. Folorunso',
      title: 'Director, Dzuels Educational Foundation',
    },
    secondarySignatory: input.secondarySignatory || {
      name: 'Academy Lead',
      title: 'Lead Instructor / Head Librarian',
    },
    goldSealText:
      input.goldSealText?.trim() ||
      preset?.defaultSealText ||
      'DZUELS EDUCATIONAL FOUNDATION • OFFICIAL SEAL • 2026',
    issuedBy: issuedBy || 'Staff Member',
    isRevoked: false,
  });

  // If linked to a cohort student, mark certificate as received in Cohort
  if (input.recipientBarcode && input.recipientCohort) {
    await Cohort.updateMany(
      {
        barcode: input.recipientBarcode.trim(),
        cohortType: input.recipientCohort.trim(),
      },
      {
        $set: { receivedCertificate: true },
      }
    );
  }

  return serializeCertificate(doc);
}

/**
 * Batch generate certificates from a Cohort roster or Reading Competition results.
 */
export async function batchGenerateCertificates(
  input: IBatchGenerateCertificatesInput,
  issuedBy: string
): Promise<{ created: ICertificateData[]; total: number }> {
  await connectDB();

  const recipientsToProcess: Array<{
    name: string;
    barcode?: string;
    cohort?: string;
    category?: string;
  }> = [];

  if (input.sourceType === 'cohort') {
    const query: Record<string, unknown> = {
      active: true,
      isRemoved: false,
    };
    if (input.cohortType && input.cohortType !== 'ALL') {
      query.cohortType = input.cohortType;
    }
    if (input.recipientBarcodes && input.recipientBarcodes.length > 0) {
      query.barcode = { $in: input.recipientBarcodes };
    }

    const students = await Cohort.find(query).sort({ surname: 1, firstname: 1 }).lean();

    for (const student of students) {
      const name = `${student.surname}, ${student.firstname}${
        student.middlename ? ' ' + student.middlename : ''
      }`.trim();
      recipientsToProcess.push({
        name,
        barcode: student.barcode,
        cohort: student.cohortType,
      });
    }
  } else if (input.sourceType === 'competition') {
    const compQuery: Record<string, unknown> = {
      status: 'checked_in',
    };
    if (input.competitionSessionKey) {
      compQuery.sessionKey = input.competitionSessionKey;
    }
    if (input.competitionCategory && input.competitionCategory !== 'ALL') {
      compQuery.category = input.competitionCategory;
    }

    const entries = await Competition.find(compQuery).lean();
    const seen = new Set<string>();

    for (const entry of entries) {
      const key = entry.patronBarcode || entry.patronName;
      if (!seen.has(key)) {
        seen.add(key);
        recipientsToProcess.push({
          name: entry.patronName,
          barcode: entry.patronBarcode,
          category: entry.category,
        });
      }
    }
  } else if (input.sourceType === 'patrons') {
    if (input.recipientBarcodes && input.recipientBarcodes.length > 0) {
      const patrons = await Patron.find({
        barcode: { $in: input.recipientBarcodes },
      }).lean();
      for (const p of patrons) {
        recipientsToProcess.push({
          name: `${p.surname}, ${p.firstname}`.trim(),
          barcode: p.barcode,
        });
      }
    }
  }

  if (recipientsToProcess.length === 0) {
    throw new Error('No eligible recipient records found for the selected criteria.');
  }

  const preset = CERTIFICATE_PRESETS.find((p) => p.id === input.templateType) || CERTIFICATE_PRESETS[0];
  const templateType = input.templateType || 'digital_literacy';
  const title = input.title?.trim() || preset.defaultTitle;
  const awardDescription = input.awardDescription?.trim() || preset.defaultCitation;
  const issueDate = input.issueDate ? new Date(input.issueDate) : new Date();

  const createdList: ICertificateData[] = [];

  for (const r of recipientsToProcess) {
    const certificateCode = await generateCertificateCode();
    const doc = await Certificate.create({
      certificateCode,
      templateType,
      title,
      recipientName: r.name,
      recipientBarcode: r.barcode,
      recipientCohort: r.cohort || input.cohortType,
      recipientCategory: r.category || input.competitionCategory,
      awardDescription,
      issueDate,
      primarySignatory: input.primarySignatory || {
        name: 'Dr. T. Folorunso',
        title: 'Director, Dzuels Educational Foundation',
      },
      secondarySignatory: input.secondarySignatory || {
        name: 'Academy Lead',
        title: 'Lead Instructor / Head Librarian',
      },
      goldSealText: input.goldSealText?.trim() || preset.defaultSealText,
      issuedBy: issuedBy || 'Staff Member',
      isRevoked: false,
    });

    if (r.barcode && (r.cohort || input.cohortType)) {
      await Cohort.updateMany(
        {
          barcode: r.barcode,
          cohortType: r.cohort || input.cohortType,
        },
        {
          $set: { receivedCertificate: true },
        }
      );
    }

    createdList.push(serializeCertificate(doc));
  }

  return {
    created: createdList,
    total: createdList.length,
  };
}

/**
 * List certificates with pagination and search filtering.
 */
export async function listCertificates(query: {
  search?: string;
  templateType?: string;
  isRevoked?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  items: ICertificateData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  await connectDB();

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (query.templateType && query.templateType !== 'ALL') {
    filter.templateType = query.templateType;
  }

  if (query.isRevoked !== undefined) {
    filter.isRevoked = query.isRevoked;
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    filter.$or = [
      { certificateCode: { $regex: term, $options: 'i' } },
      { recipientName: { $regex: term, $options: 'i' } },
      { recipientBarcode: { $regex: term, $options: 'i' } },
      { recipientCohort: { $regex: term, $options: 'i' } },
      { title: { $regex: term, $options: 'i' } },
    ];
  }

  const [docs, total] = await Promise.all([
    Certificate.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Certificate.countDocuments(filter),
  ]);

  return {
    items: docs.map(serializeCertificate),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Retrieve single certificate by MongoDB _id or serial certificateCode.
 */
export async function getCertificate(idOrCode: string): Promise<ICertificateData | null> {
  await connectDB();
  const trimmed = idOrCode.trim();

  let doc = await Certificate.findOne({ certificateCode: trimmed.toUpperCase() });
  if (!doc && trimmed.match(/^[0-9a-fA-F]{24}$/)) {
    doc = await Certificate.findById(trimmed);
  }

  return doc ? serializeCertificate(doc) : null;
}

/**
 * Public certificate authenticity verification.
 */
export async function verifyCertificate(
  certificateCode: string
): Promise<ICertificateVerificationResult> {
  await connectDB();

  if (!certificateCode || !certificateCode.trim()) {
    return {
      isValid: false,
      certificateCode: '',
      error: 'Please provide a valid certificate serial code.',
    };
  }

  const code = certificateCode.trim().toUpperCase();
  const doc = await Certificate.findOne({ certificateCode: code });

  if (!doc) {
    return {
      isValid: false,
      certificateCode: code,
      error: `Certificate "${code}" was not found in the Dzuels Educational Foundation registry.`,
    };
  }

  if (doc.isRevoked) {
    return {
      isValid: false,
      certificateCode: code,
      certificate: serializeCertificate(doc),
      error: `Notice: Certificate "${code}" was officially revoked by the Foundation administration.`,
    };
  }

  return {
    isValid: true,
    certificateCode: code,
    certificate: serializeCertificate(doc),
  };
}

/**
 * Load eligible recipient preview from a Cohort or Competition session.
 */
export async function loadEligibleRecipients(
  sourceType: 'cohort' | 'competition',
  key?: string
): Promise<Array<{ barcode: string; name: string; detail: string; qualified?: boolean }>> {
  await connectDB();

  if (sourceType === 'cohort') {
    const query: Record<string, unknown> = { active: true, isRemoved: false };
    if (key && key !== 'ALL') {
      query.cohortType = key;
    }
    const students = await Cohort.find(query).sort({ surname: 1, firstname: 1 }).limit(100).lean();

    return students.map((s) => ({
      barcode: s.barcode,
      name: `${s.surname}, ${s.firstname}${s.middlename ? ' ' + s.middlename : ''}`,
      detail: `${s.cohortType} • ${s.schoolClass || 'Student'}`,
      qualified: s.receivedCertificate,
    }));
  }

  if (sourceType === 'competition') {
    const compQuery: Record<string, unknown> = { status: 'checked_in' };
    if (key && key !== 'ALL') {
      compQuery.sessionKey = key;
    }
    const entries = await Competition.find(compQuery).sort({ grade: -1 }).limit(100).lean();
    const seen = new Set<string>();
    const list: Array<{ barcode: string; name: string; detail: string; qualified?: boolean }> = [];

    for (const e of entries) {
      if (!seen.has(e.patronBarcode)) {
        seen.add(e.patronBarcode);
        list.push({
          barcode: e.patronBarcode,
          name: e.patronName,
          detail: `${e.category || 'Contestant'} • Grade: ${e.grade ?? '—'}%`,
          qualified: true,
        });
      }
    }
    return list;
  }

  return [];
}
