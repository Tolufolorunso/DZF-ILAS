import * as jose from 'jose';
import { getCohortStudentsForSync, getCohortGroupByType } from './service';

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

export interface GoogleSheetsSyncResult {
  success: boolean;
  cohortType: string;
  sheetTitle: string;
  syncedStudentsCount: number;
  certifiedCount: number;
  removedCount: number;
  activeCount: number;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  spreadsheetUrl: string;
  syncedAt: string;
  message?: string;
}

export interface GoogleSheetsConnectionStatus {
  connected: boolean;
  serviceAccountConfigured: boolean;
  clientEmail?: string;
  spreadsheetId?: string;
  spreadsheetTitle?: string;
  spreadsheetUrl?: string;
  error?: string;
}

/**
 * Format private key string to handle escaped newlines
 */
function getFormattedPrivateKey(): string {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  return rawKey.replace(/\\n/g, '\n').trim();
}

/**
 * Get Google Service Account OAuth2 Access Token using jose JWT assertion
 */
export async function getGoogleServiceAccountToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if valid for more than 2 minutes
  if (cachedAccessToken && tokenExpiresAt - now > 120) {
    return cachedAccessToken;
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKeyPem = getFormattedPrivateKey();

  if (!clientEmail || !privateKeyPem) {
    throw new Error('Google Service Account credentials (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY) are not configured.');
  }

  try {
    const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');

    const jwt = await new jose.SignJWT({
      scope: 'https://www.googleapis.com/auth/spreadsheets',
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(clientEmail)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(privateKey);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google OAuth token exchange failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedAccessToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600);

    return cachedAccessToken;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to authenticate Google Service Account: ${message}`);
  }
}

/**
 * Test connectivity to Google Sheets and retrieve spreadsheet metadata
 */
export async function checkGoogleSheetsConnection(): Promise<GoogleSheetsConnectionStatus> {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !process.env.GOOGLE_PRIVATE_KEY || !sheetId) {
    return {
      connected: false,
      serviceAccountConfigured: false,
      clientEmail: clientEmail || undefined,
      spreadsheetId: sheetId || undefined,
      error: 'Missing Google Service Account credentials or GOOGLE_SHEET_ID in environment',
    };
  }

  try {
    const token = await getGoogleServiceAccountToken();
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        connected: false,
        serviceAccountConfigured: true,
        clientEmail,
        spreadsheetId: sheetId,
        error: `Google Sheets API error (${res.status}): ${errText}`,
      };
    }

    const data = (await res.json()) as { properties?: { title?: string } };
    return {
      connected: true,
      serviceAccountConfigured: true,
      clientEmail,
      spreadsheetId: sheetId,
      spreadsheetTitle: data.properties?.title || 'Dzuels Cohort Spreadsheet',
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      serviceAccountConfigured: true,
      clientEmail,
      spreadsheetId: sheetId,
      error: message,
    };
  }
}

interface SheetTabInfo {
  sheetId: number;
  title: string;
}

/**
 * Fetch list of sheet tabs in the spreadsheet
 */
async function getSpreadsheetTabs(spreadsheetId: string, token: string): Promise<{ title: string; tabs: SheetTabInfo[] }> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch spreadsheet tabs (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as {
    properties?: { title?: string };
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  };

  const tabs: SheetTabInfo[] = (data.sheets || []).map((s) => ({
    sheetId: s.properties?.sheetId || 0,
    title: s.properties?.title || '',
  }));

  return {
    title: data.properties?.title || 'Cohort Academy',
    tabs,
  };
}

/**
 * Ensure a tab with given title exists, creating it if necessary
 */
async function ensureSheetTab(
  spreadsheetId: string,
  tabTitle: string,
  token: string
): Promise<{ sheetId: number; isNew: boolean; spreadsheetTitle: string }> {
  const { title: spreadsheetTitle, tabs } = await getSpreadsheetTabs(spreadsheetId, token);
  const existingTab = tabs.find((t) => t.title.toLowerCase() === tabTitle.toLowerCase());

  if (existingTab) {
    return { sheetId: existingTab.sheetId, isNew: false, spreadsheetTitle };
  }

  // Create new tab
  const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: tabTitle,
              gridProperties: {
                rowCount: 100,
                columnCount: 15,
                frozenRowCount: 1,
              },
            },
          },
        },
      ],
    }),
  });

  if (!addRes.ok) {
    const errorText = await addRes.text();
    throw new Error(`Failed to create sheet tab "${tabTitle}" (${addRes.status}): ${errorText}`);
  }

  const result = (await addRes.json()) as {
    replies?: Array<{ addSheet?: { properties?: { sheetId?: number } } }>;
  };

  const newSheetId = result.replies?.[0]?.addSheet?.properties?.sheetId || 0;
  return { sheetId: newSheetId, isNew: true, spreadsheetTitle };
}

/**
 * Synchronize a cohort's complete student roster to Google Sheets
 */
export async function syncCohortRosterToGoogleSheets(cohortType: string): Promise<GoogleSheetsSyncResult> {
  const normalizedType = cohortType.trim().toLowerCase();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is missing.');
  }

  const token = await getGoogleServiceAccountToken();
  const cohortGroup = await getCohortGroupByType(normalizedType);
  const tabName = cohortGroup?.displayName || normalizedType;

  // 1. Ensure worksheet tab exists
  const { sheetId, spreadsheetTitle } = await ensureSheetTab(spreadsheetId, tabName, token);

  // 2. Fetch live students from DB
  const rawStudents = await getCohortStudentsForSync(normalizedType);

  // Compute maximum weeks recorded in attendance
  let maxWeeks = 1;
  rawStudents.forEach((st) => {
    if (st.attendance && st.attendance.length > maxWeeks) {
      maxWeeks = st.attendance.length;
    }
  });

  const nowIso = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });

  // 3. Prepare tabular rows
  const headerRow = [
    'Barcode',
    'Surname',
    'First Name',
    'Middle Name',
    'School Class',
    'Attended Weeks',
    'Total Weeks',
    'Attendance %',
    'Certified Graduate',
    'Enrollment Status',
    'Enrolled Date',
    'Last Synced (Lagos)',
  ];

  let certifiedCount = 0;
  let removedCount = 0;
  let activeCount = 0;

  const dataRows = rawStudents.map((st) => {
    const attendedWeeks = (st.attendance || []).filter((a) => a.attended).length;
    const totalWeeks = Math.max(st.attendance?.length || 0, maxWeeks);
    const attendancePct = totalWeeks > 0 ? Math.round((attendedWeeks / totalWeeks) * 100) : 0;

    if (st.receivedCertificate) certifiedCount++;
    if (st.isRemoved) removedCount++;
    else if (st.active) activeCount++;

    return [
      st.barcode,
      st.surname,
      st.firstname,
      st.middlename || '',
      st.schoolClass || '',
      attendedWeeks,
      totalWeeks,
      `${attendancePct}%`,
      st.receivedCertificate ? 'YES (Certified)' : 'NO',
      st.isRemoved ? 'REMOVED' : st.active ? 'ACTIVE' : 'INACTIVE',
      st.createdAt ? new Date(st.createdAt).toISOString().split('T')[0] : '',
      nowIso,
    ];
  });

  const allRows = [headerRow, ...dataRows];

  // 4. Overwrite values in tab
  // Clear existing content up to row 500
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(tabName)}'!A1:L500:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(tabName)}'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allRows,
      }),
    }
  );

  if (!writeRes.ok) {
    const errorText = await writeRes.text();
    throw new Error(`Failed to write rows to sheet tab "${tabName}" (${writeRes.status}): ${errorText}`);
  }

  // 5. Apply styling and cell highlights (Scholastic Navy header, Certified Green, Removed Soft Red)
  const formattingRequests: Array<Record<string, unknown>> = [];

  // Header row format: Navy background #17324d, white bold text
  formattingRequests.push({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 12,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.09, green: 0.20, blue: 0.30 },
          textFormat: {
            foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            bold: true,
            fontSize: 10,
          },
          horizontalAlignment: 'CENTER',
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
    },
  });

  // Freeze header row
  formattingRequests.push({
    updateSheetProperties: {
      properties: {
        sheetId,
        gridProperties: {
          frozenRowCount: 1,
        },
      },
      fields: 'gridProperties.frozenRowCount',
    },
  });

  // Highlight rows per specification
  dataRows.forEach((row, idx) => {
    const rowIndex = idx + 1; // 0 is header
    const isCertified = row[8] === 'YES (Certified)';
    const isRemoved = row[9] === 'REMOVED';

    if (isCertified) {
      // Deep Forest Green row per Section 5 spec: { red: 0.18, green: 0.49, blue: 0.20 }
      formattingRequests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 12,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.90, green: 0.96, blue: 0.90 }, // soft green tint for row
              textFormat: {
                foregroundColor: { red: 0.11, green: 0.37, blue: 0.13 },
                bold: false,
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      });
    } else if (isRemoved) {
      // Soft Red row per Section 5 spec: { red: 1.0, green: 0.82, blue: 0.82 }
      formattingRequests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 12,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 1.0, green: 0.82, blue: 0.82 },
              textFormat: {
                foregroundColor: { red: 0.72, green: 0.11, blue: 0.11 },
                bold: false,
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      });
    }
  });

  // Set column widths for readability
  formattingRequests.push({
    updateDimensionProperties: {
      range: {
        sheetId,
        dimension: 'COLUMNS',
        startIndex: 0,
        endIndex: 12,
      },
      properties: {
        pixelSize: 135,
      },
      fields: 'pixelSize',
    },
  });

  if (formattingRequests.length > 0) {
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: formattingRequests }),
      });
    } catch (formatErr) {
      console.warn('Google Sheets formatting warning (non-fatal):', formatErr);
    }
  }

  return {
    success: true,
    cohortType: normalizedType,
    sheetTitle: tabName,
    syncedStudentsCount: dataRows.length,
    certifiedCount,
    removedCount,
    activeCount,
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    syncedAt: new Date().toISOString(),
    message: `Successfully synchronized ${dataRows.length} student(s) in "${tabName}" to Google Sheets.`,
  };
}

/**
 * Synchronize all active cohorts to Google Sheets
 */
export async function syncAllActiveCohortsToGoogleSheets(): Promise<{
  success: boolean;
  results: GoogleSheetsSyncResult[];
  totalSynced: number;
  spreadsheetUrl: string;
}> {
  const token = await getGoogleServiceAccountToken();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID is not configured.');
  }

  await getSpreadsheetTabs(spreadsheetId, token);
  const results: GoogleSheetsSyncResult[] = [];
  let totalSynced = 0;

  // Get active cohort types from DB
  const { getAllCohortGroups } = await import('./service');
  const groups = await getAllCohortGroups();

  for (const group of groups) {
    if (group.active && group.stats.totalStudents > 0) {
      try {
        const res = await syncCohortRosterToGoogleSheets(group.cohortType);
        results.push(res);
        totalSynced += res.syncedStudentsCount;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({
          success: false,
          cohortType: group.cohortType,
          sheetTitle: group.displayName || group.cohortType,
          syncedStudentsCount: 0,
          certifiedCount: 0,
          removedCount: 0,
          activeCount: 0,
          spreadsheetId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
          syncedAt: new Date().toISOString(),
          message: `Failed: ${message}`,
        });
      }
    }
  }

  return {
    success: results.some((r) => r.success),
    results,
    totalSynced,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}
