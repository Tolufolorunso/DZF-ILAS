import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/rbac';
import { logAuditEvent } from '@/lib/admin/service';
import { Cataloging } from '@/models/Cataloging';
import { Patron } from '@/models/Patron';
import { Attendance } from '@/models/Attendance';
import { Library } from '@/models/Library';

export const dynamic = 'force-dynamic';

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(val: unknown): string {
  if (!val) return '';
  try {
    const d = new Date(val as string | number | Date);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  } catch {
    return '';
  }
}

/**
 * GET /api/admin/backup
 * Downloads database collections as CSV or JSON format (admin only).
 * Query params: entity (books|patrons|attendance|circulation|all), format (csv|json)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Administrator privileges required.' },
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const entity = (searchParams.get('entity') || 'books').toLowerCase();
    const format = (searchParams.get('format') || 'json').toLowerCase();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (entity === 'all') {
      if (format !== 'json') {
        return NextResponse.json(
          {
            success: false,
            error: 'Full database snapshot bundles must be downloaded in JSON format.',
          },
          { status: 400 }
        );
      }

      const [books, patrons, attendance, circulation] = await Promise.all([
        Cataloging.find({}).lean(),
        Patron.find({}).lean(),
        Attendance.find({}).lean(),
        Library.find({}).lean(),
      ]);

      const bundle = {
        metadata: {
          system: 'DZF-ILAS',
          version: '1.0',
          generatedAt: new Date().toISOString(),
          exportedBy: user.username,
        },
        counts: {
          books: books.length,
          patrons: patrons.length,
          attendance: attendance.length,
          circulation: circulation.length,
        },
        data: {
          books,
          patrons,
          attendance,
          circulation,
        },
      };

      await logAuditEvent({
        action: 'DATA_BACKUP_SNAPSHOT_EXPORTED',
        performedBy: user.username,
        performedByRole: user.role,
        targetEntity: 'AllCollections',
        details: { format: 'json', totalRecords: books.length + patrons.length + attendance.length + circulation.length },
      });

      return new NextResponse(JSON.stringify(bundle, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="dzf-ilas-full-backup-${timestamp}.json"`,
          'Cache-Control': 'no-store, no-cache',
        },
      });
    }

    if (entity === 'books') {
      const records = await Cataloging.find({}).sort({ barcode: 1 }).lean();

      await logAuditEvent({
        action: 'DATA_BACKUP_EXPORTED',
        performedBy: user.username,
        performedByRole: user.role,
        targetEntity: 'Cataloging',
        details: { entity, format, count: records.length },
      });

      if (format === 'json') {
        return new NextResponse(JSON.stringify(records, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="dzf-ilas-books-${timestamp}.json"`,
          },
        });
      }

      const headers = [
        'Barcode',
        'Main Title',
        'Subtitle',
        'Main Author',
        'Additional Authors',
        'Publisher',
        'Publication Year',
        'Dewey Classification',
        'Copies Total',
        'Copies Available',
        'Checked Out',
        'Shelf Location',
        'Acquired Date',
      ];

      const rows = records.map((b) => [
        escapeCsv(b.barcode),
        escapeCsv(b.title?.mainTitle),
        escapeCsv(b.title?.subtitle),
        escapeCsv(b.author?.mainAuthor),
        escapeCsv((b.author?.additionalAuthors || []).join('; ')),
        escapeCsv(b.publicationInfo?.publisher),
        escapeCsv(b.publicationInfo?.year),
        escapeCsv(b.classification),
        escapeCsv(b.copiesTotal),
        escapeCsv(b.copiesAvailable),
        escapeCsv(b.isCheckedOut ? 'Yes' : 'No'),
        escapeCsv(b.shelfLocation),
        escapeCsv(formatDate(b.createdAt)),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dzf-ilas-books-${timestamp}.csv"`,
        },
      });
    }

    if (entity === 'patrons') {
      const records = await Patron.find({}).sort({ barcode: 1 }).lean();

      await logAuditEvent({
        action: 'DATA_BACKUP_EXPORTED',
        performedBy: user.username,
        performedByRole: user.role,
        targetEntity: 'Patron',
        details: { entity, format, count: records.length },
      });

      if (format === 'json') {
        return new NextResponse(JSON.stringify(records, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="dzf-ilas-patrons-${timestamp}.json"`,
          },
        });
      }

      const headers = [
        'Barcode',
        'First Name',
        'Surname',
        'Middle Name',
        'Patron Type',
        'Gender',
        'Contact Phone',
        'Email',
        'School Name',
        'Class Grade',
        'Parent Name',
        'Parent Phone',
        'Points',
        'Active',
        'Registration Date',
      ];

      const rows = records.map((p) => [
        escapeCsv(p.barcode),
        escapeCsv(p.firstname),
        escapeCsv(p.surname),
        escapeCsv(p.middlename),
        escapeCsv(p.patronType),
        escapeCsv(p.gender),
        escapeCsv(p.phoneNumber),
        escapeCsv(p.email),
        escapeCsv(p.studentSchoolInfo?.schoolName),
        escapeCsv(p.studentSchoolInfo?.currentClass),
        escapeCsv(p.parentInfo?.parentName),
        escapeCsv(p.parentInfo?.parentPhoneNumber),
        escapeCsv(p.points || 0),
        escapeCsv(p.active !== false ? 'Yes' : 'No'),
        escapeCsv(formatDate(p.createdAt)),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dzf-ilas-patrons-${timestamp}.csv"`,
        },
      });
    }

    if (entity === 'attendance') {
      const records = await Attendance.find({}).sort({ createdAt: -1 }).limit(10000).lean();

      await logAuditEvent({
        action: 'DATA_BACKUP_EXPORTED',
        performedBy: user.username,
        performedByRole: user.role,
        targetEntity: 'Attendance',
        details: { entity, format, count: records.length },
      });

      if (format === 'json') {
        return new NextResponse(JSON.stringify(records, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="dzf-ilas-attendance-${timestamp}.json"`,
          },
        });
      }

      const headers = [
        'Record ID',
        'Class Date',
        'Attendance Time',
        'Patron Barcode',
        'Patron Name',
        'Class Type',
        'Class Name',
        'Points Credited',
        'Marked By',
        'Created At',
      ];

      const rows = records.map((a) => [
        escapeCsv(String(a._id)),
        escapeCsv(formatDate(a.classDate)),
        escapeCsv(formatDate(a.attendanceTime)),
        escapeCsv(a.patronBarcode),
        escapeCsv(a.patronName),
        escapeCsv(a.classType),
        escapeCsv(a.className),
        escapeCsv(a.points || 0),
        escapeCsv(a.markedBy || 'Staff'),
        escapeCsv(formatDate(a.createdAt)),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dzf-ilas-attendance-${timestamp}.csv"`,
        },
      });
    }

    if (entity === 'circulation') {
      const records = await Library.find({}).sort({ issueDate: -1 }).limit(10000).lean();

      await logAuditEvent({
        action: 'DATA_BACKUP_EXPORTED',
        performedBy: user.username,
        performedByRole: user.role,
        targetEntity: 'Library',
        details: { entity, format, count: records.length },
      });

      if (format === 'json') {
        return new NextResponse(JSON.stringify(records, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="dzf-ilas-circulation-${timestamp}.json"`,
          },
        });
      }

      const headers = [
        'Loan ID',
        'Book Barcode',
        'Book Title',
        'Patron Barcode',
        'Status',
        'Event Title',
        'Issue Date',
        'Due Date',
        'Return Date',
        'Renewals Count',
      ];

      const rows = records.map((l) => [
        escapeCsv(String(l._id)),
        escapeCsv(l.bookBarcode),
        escapeCsv(l.bookTitle),
        escapeCsv(l.patronBarcode),
        escapeCsv(l.status),
        escapeCsv(l.eventTitle || ''),
        escapeCsv(formatDate(l.issueDate)),
        escapeCsv(formatDate(l.dueDate)),
        escapeCsv(formatDate(l.returnDate)),
        escapeCsv(l.renewalsCount || 0),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dzf-ilas-circulation-${timestamp}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid entity "${entity}". Supported: books, patrons, attendance, circulation, all.` },
      { status: 400 }
    );
  } catch (error) {
    console.error('[ADMIN_BACKUP_EXPORT_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export backup data',
      },
      { status: 500 }
    );
  }
}
