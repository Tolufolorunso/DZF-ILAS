# Feature: Cohort Academy & Google Sheets Cloud Synchronization

**From build-plan:** feature 10  
**Build attempt:** 1  
**Status:** verified  
**Branch:** feature/cohort-academy-and-google-sheets-cloud-synchronization  

---

## Goal

Build the centralized Cohort Academy management platform (`/cohorts`) and companion dual-mode REST API for Dzuels Educational Foundation digital skills cohorts (e.g. Pioneer Cohort, Digital Literacy, Office Suite, Coding). Enable cohort batch creation, student enrollment from registered patrons with barcode validation, weekly attendance tracking and certificate qualification toggles, and automated two-way cloud synchronization with Google Sheets ("DzEF ICT Training" spreadsheet) via Google Service Account credentials with visual row styling (certified green, removed soft red) and attendance percentage calculations.

---

## Design Reference

Follows Section 2.8 and Section 5 of [SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md](file:///c:/Users/oreofe/Desktop/dzuels/DZF-ILAS/SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md):
- **Page Canvas Atmosphere**: Warm academic aura radial gold `rgba(214, 167, 43, 0.16)` on `rgba(252, 248, 236, 0.95)` to `rgba(245, 247, 250, 0.98)`.
- **Kicker Accent**: Deep Gold / Bronze (`#8b5e0b`) overline text.
- **Headings & Main Titles**: Deep Scholastic Navy (`#17324d`).
- **Subtitle & Copy**: Slate Gray (`#465569`).
- **Active Cohort Badge**: Background `rgba(46, 125, 50, 0.12)`, Text `#1b5e20`, Border `rgba(46, 125, 50, 0.25)`.
- **Ended Cohort Badge**: Background `rgba(198, 40, 40, 0.12)`, Text `#b71c1c`, Border `rgba(198, 40, 40, 0.25)`.
- **Student Roster Card & Row**: Background `linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(244, 248, 252, 0.92))`, Border `rgba(23, 50, 77, 0.1)`.
- **Google Sheets Cell Styles**: Certified students formatted with deep green background (`#2e7d32`), removed students formatted with soft red background (`#ffcdd2`).

---

## In Scope

1. **Domain Service Layer (`src/lib/cohorts/service.ts`)**:
   - Query cohort groups with calculated aggregate statistics (total enrolled, active students, certified graduates, removed count, attendance rate).
   - Cohort group creation and metadata update (`cohortType`, `displayName`, `description`, `active`, `order`).
   - Student roster management in `Cohort`: enroll registered patron by barcode lookup (pulling `firstname`, `surname`, `middlename`, `schoolClass`), prevent duplicate enrollments within the same cohort.
   - Student status mutation: toggle certificate qualification (`receivedCertificate`), toggle active/removed state (`isRemoved`, `removedAt`), update school class.
   - Attendance history tracking for enrolled students (linking attendance records).

2. **Google Sheets Cloud Synchronization Engine (`src/lib/cohorts/googleSheets.ts`)**:
   - Zero-dependency Google Service Account authentication using `jose` (`RS256` assertion JWT exchange with `https://oauth2.googleapis.com/token`) using existing `.env` credentials (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`).
   - Automatic sheet tab management: ensure a dedicated worksheet tab exists for each cohort (e.g. `cohort-1`, `cohort-2`).
   - Format headers and write student roster rows: Barcode, Surname, First Name, Middle Name, School Class, Attendance Sessions, Attendance %, Certified, Status (Active/Removed), Enrollment Date, Last Sync Date.
   - Apply Google Sheets batch formatting: green highlight for certified graduates, red highlight for removed students, bold header styling.
   - Health and diagnostics check for Google Service Account connectivity with graceful error handling and offline fallback warnings.

3. **REST API Endpoints (`src/app/api/cohorts/`)**:
   - `GET /api/cohorts`: List all cohort groups with summary counters.
   - `POST /api/cohorts`: Create new cohort group (requires `admin` or `cohort_lead`).
   - `GET /api/cohorts/[cohortType]`: Get cohort details, stats, and full student roster.
   - `PUT /api/cohorts/[cohortType]`: Update cohort metadata.
   - `POST /api/cohorts/[cohortType]/students`: Enroll patron into cohort.
   - `PATCH /api/cohorts/[cohortType]/students/[barcode]`: Toggle certificate, toggle removed, or update class.
   - `DELETE /api/cohorts/[cohortType]/students/[barcode]`: Remove student from cohort.
   - `POST /api/cohorts/[cohortType]/sync`: Trigger Google Sheets push synchronization for the specific cohort.
   - `POST /api/cohorts/sync`: Trigger batch Google Sheets synchronization for all active cohorts.
   - `GET /api/cohorts/sync/status`: Query Google Sheets integration health and metadata.

4. **Web Management Interface (`/cohorts`)**:
   - Update `AppShell.tsx` navigation link from placeholder redirect to `/cohorts`.
   - `src/app/cohorts/page.tsx`: Server component with role authentication check.
   - `src/app/cohorts/CohortClient.tsx`: Full interactive dashboard:
     - Cohort batch switcher tabs with active/ended status badges.
     - Summary stat cards: Total Enrolled, Active Students, Certified Graduates, Attendance Rate, Cloud Sync Status.
     - "Sync to Google Sheets" action with live progress indicator, last synced timestamp, and direct link to open the live Google Spreadsheet.
     - Searchable, filterable student roster table (Filter by: All, Active, Certified, Removed; Search by: name, barcode, class).
     - "Enroll Student" modal with live patron barcode search autocomplete.
     - "Create Cohort" modal with batch configuration.
     - Student detail dialog to inspect attendance weeks, toggle certificate, or remove/restore student.

5. **Security & Validation**:
   - Dual-mode authentication: web HTTP-only cookie (`ils_token`) and Android mobile bearer token (`Authorization: Bearer <token>`).
   - Role-based authorization: `admin` and `cohort_lead` have full management access; other staff have read-only access.
   - Strict data validation on all inputs.

---

## Out of Scope

- Digital certificate PDF template generation and canvas rendering (deferred to Feature 12: Certificate Studio).
- Reading competition judging and session scoring (deferred to Feature 11).
- Non-staff patron self-registration for cohorts.

---

## Build Loop

- `workflow.stepReview: "feature"`: Present one complete review packet after all implementation steps pass.
- `workflow.checkpointCommits: "disabled"`: Keep changes on the working branch without intermediate commits until `/complete`.

---

## Build Steps

- [x] 1. **Cohort Service Layer & Data Operations (`src/lib/cohorts/service.ts`)**
  - Implement cohort groups retrieval, summary calculation, cohort creation/updating, patron enrollment with duplicate validation, student status toggling (certificate, removal), and attendance record aggregation.
  - *Done when:* Service functions are implemented with full TypeScript types and verified against the existing 7 cohort groups and 121 cohort students in `dzuelsDB`.

- [x] 2. **Google Sheets Cloud Sync Engine (`src/lib/cohorts/googleSheets.ts`)**
  - Implement zero-dependency Google Service Account token exchange using `jose`, spreadsheet tab creation/verification, student roster synchronization, cell styling (certified green, removed red), attendance percentage calculation, and connection health diagnostics.
  - *Done when:* Live test proves successful authentication with Google OAuth, reading sheet properties ("DzEF ICT Training"), and synchronizing cohort roster rows to Google Sheets with status reporting.

- [x] 3. **Cohort Management & Cloud Sync REST API Endpoints (`src/app/api/cohorts/...`)**
  - Create REST route handlers: `GET`/`POST` `/api/cohorts`, `GET`/`PUT` `/api/cohorts/[cohortType]`, `POST`/`PATCH`/`DELETE` `/api/cohorts/[cohortType]/students`, `POST` `/api/cohorts/[cohortType]/sync`, `POST` `/api/cohorts/sync`, and `GET` `/api/cohorts/sync/status`.
  - Include dual-mode auth verification and role guards (`admin` / `cohort_lead`).
  - *Done when:* Endpoints return standardized JSON responses (`{ success: true, data: ... }`), reject unauthorized requests, and successfully perform CRUD and sync operations.

- [x] 4. **Cohort Academy Web Workspace (`src/app/cohorts/...` & `AppShell.tsx`)**
  - Update `AppShell.tsx` navigation mapping to route `cohorts` to `/cohorts`.
  - Implement `src/app/cohorts/page.tsx` and `src/app/cohorts/CohortClient.tsx` featuring the academic aura canvas, cohort batch selector tabs, summary stat cards, searchable student roster table, enrollment modal with patron search, and one-click Google Sheets sync button with live feedback.
  - *Done when:* Navigating to `/cohorts` displays live cohort batches, student roster table with status pills, student search, enrollment modal, and interactive Google Sheets synchronization.

- [x] 5. **Quality, Typecheck & Verification Gate**
  - Run `npx tsc --noEmit` and `npm run lint` across the entire codebase to verify zero type regressions, clean code styling, and reliable runtime execution.
  - *Done when:* `npx tsc --noEmit` exits with 0 and all cohort management and sync features operate smoothly.

---

## Files / Areas

- `src/lib/cohorts/service.ts`: Cohort domain logic and MongoDB operations.
- `src/lib/cohorts/googleSheets.ts`: Google Service Account authentication and Google Sheets API v4 integration.
- `src/app/api/cohorts/route.ts`: List and create cohort groups.
- `src/app/api/cohorts/[cohortType]/route.ts`: Get and update cohort details.
- `src/app/api/cohorts/[cohortType]/students/route.ts`: Enroll students and query roster.
- `src/app/api/cohorts/[cohortType]/students/[barcode]/route.ts`: Update/remove student.
- `src/app/api/cohorts/[cohortType]/sync/route.ts`: Sync single cohort to Google Sheets.
- `src/app/api/cohorts/sync/route.ts`: Sync all active cohorts to Google Sheets.
- `src/app/api/cohorts/sync/status/route.ts`: Google Sheets connection status check.
- `src/components/layout/AppShell.tsx`: Navigation mapping for Cohort Academy.
- `src/app/cohorts/page.tsx`: Server page with authentication guard.
- `src/app/cohorts/CohortClient.tsx`: Interactive Cohort Academy web workspace.

---

## Data / Contracts

### CohortGroup Schema (`src/models/CohortGroup.ts`):
```typescript
{
  _id: ObjectId;
  cohortType: string; // unique, e.g. "cohort-1", "cohort-2"
  displayName: string; // e.g. "Pioneer Cohort"
  description: string;
  active: boolean;
  order: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Cohort Schema (`src/models/Cohort.ts`):
```typescript
{
  _id: ObjectId;
  barcode: string; // patron barcode, e.g. "20230001"
  firstname: string;
  surname: string;
  middlename?: string;
  schoolClass?: string;
  cohortType: string; // indexed, matches CohortGroup.cohortType
  receivedCertificate: boolean;
  active: boolean;
  isRemoved: boolean;
  removedAt?: Date;
  attendance: Array<{
    date?: Date;
    week?: number;
    attended: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Google Sheets Sync Contract:
- Tab name: `cohortType` (e.g. `cohort-1`)
- Headers: `Barcode | Surname | First Name | Middle Name | Class | Total Sessions | Attended Weeks | Attendance Rate (%) | Certificate Granted | Status | Enrolled Date | Last Synced`
- Rows: Student subdocuments sorted by barcode/surname
- Cell formatting:
  - Certified students: `#2e7d32` green highlight text/background.
  - Removed students: `#ffcdd2` light red highlight text/background.

---

## Testing

- Typecheck: `npx tsc --noEmit`
- Linter: `npm run lint`
- API verification: Test script / curl calls verifying cohort endpoints, student enrollment, attendance updates, and Google Sheets sync with verified token generation.
- Browser UI review: Validate `/cohorts` page layout, search filters, modals, and sync action.

---

## Notes for the AI

- Use `jose` with `GOOGLE_PRIVATE_KEY` and `GOOGLE_CLIENT_EMAIL` for Google OAuth token exchange. No need to install heavy external SDKs since `jose` and `fetch` provide clean native support.
- Handle private key formatting safely: ensure escaped `\n` characters in `.env` are replaced with real newlines (`replace(/\\n/g, '\n')`).
- Keep Google Sheets calls resilient: if Google API fails or spreadsheet is unavailable, capture the error clearly and return informative error messages so the user knows what happened without crashing the application.
- Maintain WCAG AA contrast standards and consistent styling with the existing Design System and Material UI components.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":12483,"specSha256":"278dc6d5b446a35487adfcb278e1ebfd804457b66648a5eb8b6bda1df0d12a6c","branch":"refs/heads/feature/cohort-academy-and-google-sheets-cloud-synchronization","head":"c5aa090607b167f4045818087dd1099de9216294","baseRef":"refs/heads/main","baseCommit":"c5aa090607b167f4045818087dd1099de9216294","sourceTree":"dd1cd6f596ba9d0301acc11afd671b8b4b64efbe","absentOptional":[]} -->
