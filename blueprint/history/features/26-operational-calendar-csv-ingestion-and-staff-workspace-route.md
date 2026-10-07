# Feature: Operational Calendar CSV Ingestion & Staff Workspace Route

**From build-plan:** feature 26
**Build attempt:** 1
**Branch:** feature/operational-calendar-csv-ingestion-and-staff-workspace-route
**Status:** verified

## Goal

Provide a robust operational calendar CSV ingestion engine for institutional administrators, smart multi-date and multi-stage milestone extraction, schema enrichment for participant and focal person attribution, and a dedicated read-only staff operational calendar workspace route at `/dashboard/calendar` positioned directly under Leaderboard in the AppShell navigation.

## In scope

1. **Event Schema & Types Enrichment**:
   - Enrich `src/models/Event.ts` with `participants?: string`, `focalPerson?: string`, `remarks?: string`.
   - Update `IEventItemDTO` in `src/lib/admin/types.ts` with `participants`, `focalPerson`, `remarks`.
   - Update `listEvents`, `createEvent`, `updateEventDetails`, and `createEventsBatch` in `src/lib/admin/service.ts` to persist and return `participants`, `focalPerson`, and `remarks`.
   - Update API route handlers `src/app/api/admin/events/route.ts` and `src/app/api/admin/events/batch/route.ts` to accept, sanitize, and persist these enriched fields.

2. **CSV Parser & Smart Multi-Date Milestone Extraction Engine**:
   - Create `src/lib/calendar/csv-parser.ts` supporting standard RFC 4180 CSV syntax (quoted fields, multiline cells, escaped quotes).
   - Case-insensitive header mapping for:
     - `Date` / `Event Date` / `Date(s)`
     - `Event` / `Event Name` / `Title` / `Activity`
     - `Participants` / `Target Audience` / `Attendees` / `Audience`
     - `Focal Person` / `FocalPerson` / `Lead` / `PM` / `Coordinator`
     - `Remarks` / `Note` / `Notes` / `Details`
   - Smart date parsing:
     - Standard dates: `January 4th`, `Jan 24, 2027`, `2027-02-17`, `17th February`.
     - Date ranges: `Oct 12-14, 2026`, `Feb 6 - Feb 9`.
     - Multi-stage date streams in single cells (e.g. `February 17th– Finale Feb. 6 th – Stage1&2 Jnr Elem Feb.9th – Stage1&2 Snr Elem`). Decomposes into individual milestone entries linked to the row's main activity.
     - Title fallbacks: When the `Event` column is empty or missing, derive a title from the stage text, `Remarks`, or default to `"Foundation Milestone"`.
     - Category inference: Infer category (`assembly`, `workshop`, `competition`, `holiday`, `meeting`, `general`) based on keywords in title, remarks, or date string.
   - API Route: Create `src/app/api/admin/calendar/parse-csv/route.ts` taking `multipart/form-data` with `file` and `targetYear`, returning `{ success: true, eventsCount, events, targetYear }`.

3. **Admin CSV Upload & Interactive Review Dialog**:
   - Create `src/components/admin/CalendarCsvUploadDialog.tsx` with:
     - File selection and drag-and-drop supporting `.csv` files.
     - Target Year selector.
     - Template guidance info and sample downloadable structure.
     - Interactive review table of parsed milestones with editable fields (Title, Date, Category, Participants, Focal Person, Remarks), add/delete row controls, and validation.
     - Direct batch commit via `POST /api/admin/events/batch`.
   - In `src/components/admin/OperationalCalendar.tsx`:
     - Add `📊 Import Calendar CSV` button to admin action bar.
     - Enrich agenda milestone cards and matrix popover with chips/badges for `Participants`, `Focal Person`, and `Remarks`.

4. **Staff Operational Calendar Workspace Route (`/dashboard/calendar`)**:
   - Add `readOnly?: boolean` prop to `OperationalCalendar.tsx`. When `readOnly=true`:
     - Hide administration controls (CSV/PDF import, run alerts, schedule/edit/delete event buttons).
     - Retain full interactive 12-month visual matrix, agenda view, month jumps, year selector, category filtering, and search.
   - Create `src/app/dashboard/calendar/page.tsx`:
     - Staff workspace page rendering `AppShell` with `activeNavId="calendar"`.
     - Displays `OperationalCalendar` in `readOnly` mode with academic SaaS styling.
   - Update `src/components/layout/AppShell.tsx`:
     - Add `{ id: 'calendar', label: 'Operational Calendar', icon: <CalendarIcon size={20} /> }` directly under `Leaderboard & Stats` (`analytics`) in `workspaceItems`.
     - Update path detection for `/dashboard/calendar` and router navigation.

## Out of scope

- Rebranding of the platform to DZF-ILAS (reserved for Feature 27).
- Robots.txt SEO indexing rules and `/transcomm` indexing policies (reserved for Feature 27).
- Staff birth month/day additions (reserved for Feature 27).
- Removal of fallback mock data across other views (reserved for Feature 27).
- Modifying Google Sheets sync or cohort data models.

## Build loop

- **Review Cadence:** Feature (`workflow.stepReview: "feature"`). All steps build continuously; review packet presented at end of feature.
- **Checkpoint Commits:** Disabled (`workflow.checkpointCommits: "disabled"`).
- **Verification:** `npx tsc --noEmit` and targeted verification script checking CSV parsing, API endpoints, schema persistence, and UI routes.

## Build steps

- [x] Step 1: **Enrich Event Schema, Types, Service & Batch Import APIs**
  - Update `src/models/Event.ts` to include `participants`, `focalPerson`, and `remarks` fields.
  - Update `IEventItemDTO` in `src/lib/admin/types.ts` with `participants`, `focalPerson`, `remarks`.
  - Update `listEvents`, `createEvent`, `updateEventDetails`, and `createEventsBatch` in `src/lib/admin/service.ts` to accept, persist, and return these fields.
  - Update `src/app/api/admin/events/route.ts` and `src/app/api/admin/events/batch/route.ts` to handle the enriched fields.
  - *Done when:* `npx tsc --noEmit` passes and a test script confirms MongoDB stores and retrieves `participants`, `focalPerson`, and `remarks` correctly.

- [x] Step 2: **Implement Resilient Calendar CSV Parser & Ingestion Route**
  - Create `src/lib/calendar/csv-parser.ts` with RFC 4180 parsing, header normalization, single date, date range, and multi-stage date stream extraction, and title fallback heuristics.
  - Create `src/app/api/admin/calendar/parse-csv/route.ts` enforcing admin authentication, validating uploaded CSV files, and returning parsed milestone candidates.
  - *Done when:* A verification script feeds single-date and multi-stage CSV sample strings (including the user's sample data with empty titles) into the parser and API, verifying all milestones are correctly extracted with dates, categories, participants, focal persons, and remarks.

- [x] Step 3: **Build Interactive CSV Upload Review Dialog & Enrich Admin Calendar Cards**
  - Create `src/components/admin/CalendarCsvUploadDialog.tsx` with file upload, CSV format guidance/template download, interactive editable review table, and batch submission.
  - Add `📊 Import Calendar CSV` button in `src/components/admin/OperationalCalendar.tsx` opening the dialog.
  - Update agenda list cards and matrix day popovers in `OperationalCalendar.tsx` to display `Participants`, `Focal Person`, and `Remarks`.
  - Add `readOnly?: boolean` prop to `OperationalCalendar.tsx` allowing it to run in staff read-only display mode.
  - *Done when:* `npx tsc --noEmit` passes and `OperationalCalendar` compiles cleanly with the new CSV dialog and enriched event card details.

- [x] Step 4: **Implement Dedicated Staff Workspace Route & AppShell Navigation**
  - Add `calendar` NavItem directly below `Leaderboard & Stats` in `AppShell.tsx`, with path mapping and navigation handling.
  - Create `src/app/dashboard/calendar/page.tsx` rendering `OperationalCalendar` in `readOnly` mode within `AppShell`.
  - *Done when:* Navigating to `/dashboard/calendar` renders the operational calendar without administrative action buttons, while `/dashboard/admin?tab=calendar` retains full CSV/PDF import and scheduling controls.

- [x] Step 5: **End-to-End Verification & Verification Script**
  - Run full TypeScript compilation (`npx tsc --noEmit`).
  - Run comprehensive verification script testing CSV parsing with edge cases (multi-stage dates, missing event titles, quoted multiline cells), batch ingestion into DB, read-only permissions, and route rendering.
  - *Done when:* All checks exit with code 0 and no console errors.

## Files / areas

- `src/models/Event.ts` - Add `participants`, `focalPerson`, `remarks` schema fields.
- `src/lib/admin/types.ts` - Update `IEventItemDTO` with enriched attributes.
- `src/lib/admin/service.ts` - Update event CRUD and batch operations.
- `src/app/api/admin/events/route.ts` - Handle enriched event attributes.
- `src/app/api/admin/events/batch/route.ts` - Handle batch creation with enriched attributes.
- `src/lib/calendar/csv-parser.ts` - Resilient CSV parser and multi-stage date extraction engine.
- `src/app/api/admin/calendar/parse-csv/route.ts` - CSV upload and parse API endpoint.
- `src/components/admin/CalendarCsvUploadDialog.tsx` - Interactive CSV upload and review table modal.
- `src/components/admin/OperationalCalendar.tsx` - Support `readOnly` mode, CSV dialog trigger, enriched event badges.
- `src/components/layout/AppShell.tsx` - Add Operational Calendar under Leaderboard in Workspace navigation.
- `src/app/dashboard/calendar/page.tsx` - Dedicated staff operational calendar workspace route.

## Data / contracts

- **Enriched Event Document (`src/models/Event.ts`):**
  ```ts
  participants?: string;
  focalPerson?: string;
  remarks?: string;
  ```
- **Parsed Calendar Event (`src/lib/calendar/csv-parser.ts`):**
  ```ts
  export interface IParsedCsvEvent {
    id: string;
    eventName: string;
    eventDate: string; // 'YYYY-MM-DD'
    academicYear: number;
    category: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
    location: string;
    targetAudience: string;
    arrivalTime: string;
    description: string;
    participants?: string;
    focalPerson?: string;
    remarks?: string;
    confidence: 'high' | 'medium' | 'low';
  }
  ```
- **CSV Parse API Contract (`POST /api/admin/calendar/parse-csv`):**
  - Request: `multipart/form-data` with `file: File (.csv)` and `targetYear?: number`.
  - Response (200):
    ```json
    {
      "success": true,
      "eventsCount": 12,
      "events": [
        {
          "id": "csv-evt-...",
          "eventName": "Spelling Bee - Elementary (Stage 1&2 Jnr Elem)",
          "eventDate": "2027-02-06",
          "academicYear": 2027,
          "category": "competition",
          "location": "DZF Learning Center",
          "targetAudience": "Library Members",
          "participants": "Library Members",
          "focalPerson": "Librarian PM: Nifemi",
          "remarks": "PM to Suggest gifts",
          "confidence": "high"
        }
      ],
      "targetYear": 2027
    }
    ```
- **Workspace Route Contract:**
  - Route: `/dashboard/calendar`
  - Access: Authenticated staff (all roles: Admin, Asst Admin, ICT, Librarian, Intern, etc.).
  - Mode: Read-only calendar matrix & agenda timeline without management controls.

## Testing

- Logic tests via node verification script:
  - RFC 4180 parsing with commas, quotes, linebreaks.
  - Multi-date extraction heuristic from real user sample data:
    - `"January 4th Organization Resumes All team members CM"`
    - `"February 17th– Finale Feb. 6 th – Stage1&2 Jnr Elem Feb.9th – Stage1&2 Snr Elem"`
    - Empty event title fallback behavior.
  - REST API endpoint verification for `/api/admin/calendar/parse-csv` and `/api/admin/events/batch`.
  - Typecheck verification: `npx tsc --noEmit`.

## Notes for the AI

- Follow strict zero AI attribution policy: no `Co-Authored-By` or AI tool signatures in commits or PRs.
- Do not modify or leak Phase 8 Feature 27 tasks (DZF-ILAS rebranding, staff birthdays, robots.txt SEO rules). Keep scope strictly focused on Feature 26.
- Ensure the CSV parser gracefully handles varied line breaks (`\r\n`, `\n`) and missing column values.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":11933,"specSha256":"b17cc40f68a15f2dea12c7d149af606917811edabe20fdbb0b1eddf7e1dc3c06","branch":"refs/heads/feature/operational-calendar-csv-ingestion-and-staff-workspace-route","head":"d055933a8dd234a50386ef4d988b8a516c6c8f14","baseRef":"refs/heads/main","baseCommit":"d055933a8dd234a50386ef4d988b8a516c6c8f14","sourceTree":"1df10a56e72f2fe5f2ec53c1fe0b28a5b7bce86d","absentOptional":[]} -->
