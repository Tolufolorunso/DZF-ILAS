# Feature: Foundation Operational Calendar, PDF Ingestion & Multi-Stage Alert Pipeline

**From build-plan:** feature 23
**Build attempt:** 1
**Branch:** feature/foundation-operational-calendar-pdf-ingestion-and-multi-stage-alert-pipeline

## Goal
Provide a comprehensive institutional Foundation Operational Calendar system supporting multi-year schedules (e.g. 2026, 2027), dual visual representations (12-Month Matrix View & Monthly Agenda Stream), automated PDF yearly calendar upload & text extraction into an interactive preview/confirmation ingestion table, event editing/deletion, and a multi-stage background advance alert pipeline (1 month, 2 weeks, 1 week before events) integrated with the header notification bell.

## In scope
1. **Event Model Updates (`src/models/Event.ts`):**
   - Add `alertsSent` subdocument: `{ oneMonth?: boolean; twoWeeks?: boolean; oneWeek?: boolean }` with defaults `false`.
   - Add `category?: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general'`.
   - Add `academicYear?: number` (e.g. 2026, 2027), indexed alongside `eventDate`.
2. **Calendar PDF Ingestion & Parsing Engine (`src/lib/calendar/pdf-parser.ts`, `src/app/api/admin/calendar/parse-pdf/route.ts`):**
   - Server-side PDF text extraction using `unpdf`.
   - Heuristic parser extracting event dates across common formats (e.g., `January 15, 2027`, `15th March`, `2027-04-10`, `12/05/2027`), event titles, target audiences, and locations.
   - Returns structured milestone array for client-side review before database insertion.
3. **Batch Event Ingestion & Event Updates API:**
   - `POST /api/admin/events/batch`: Atomically persists an array of reviewed/edited events from the PDF ingestion table.
   - `PATCH /api/admin/events/[id]`: Updates details of an existing event (title, eventName, eventDate, location, targetAudience, arrivalTime, description, category).
4. **Multi-Stage Advance Notification Evaluator (`src/lib/calendar/alerts.ts`, `POST /api/admin/calendar/check-alerts/route.ts`):**
   - Evaluates all upcoming events against the current timestamp:
     - **30 days (1 month) prior:** dispatches `calendar_milestone` notification if `!alertsSent.oneMonth`.
     - **14 days (2 weeks) prior:** dispatches `calendar_milestone` notification if `!alertsSent.twoWeeks`.
     - **7 days (1 week) prior:** dispatches `calendar_milestone` notification if `!alertsSent.oneWeek`.
   - Dispatches in-app notifications to active staff linking to the calendar in `/dashboard/admin`.
   - Updates `alertsSent` flags on the event document to prevent duplicate notifications.
5. **Interactive Operational Calendar Component (`src/components/admin/OperationalCalendar.tsx`):**
   - Year selector (`2026`, `2027`, etc.) with quick switching.
   - Dual visual view toggle:
     - **12-Month Matrix Grid View:** Interactive 12-month calendar matrix with highlighted event days and day popovers.
     - **Chronological Agenda Stream View:** Month-by-month event stream with category pills, arrival time, audience, location, countdown tags, Edit, and Delete actions.
   - Countdown banner highlighting the next upcoming institutional milestone.
6. **Calendar PDF Ingestion Dialog (`src/components/admin/CalendarPdfUploadDialog.tsx`):**
   - Drag-and-drop or file picker for yearly calendar PDF.
   - Live extraction loader.
   - Editable review table allowing staff to adjust parsed dates, titles, locations, and audiences or add/remove rows before committing.
   - One-click "Confirm & Import to Calendar" action.
7. **Event Edit Dialog (`src/components/admin/EventEditDialog.tsx`):**
   - Dialog allowing staff to edit scheduled event attributes.
8. **Admin Control Center Integration:**
   - Mount `OperationalCalendar` in Tab 4 of `AdminControlCenterClient.tsx`, replacing the basic card grid.

## Out of scope
- Staff self-registration page and activation queue (Feature 24).
- POS thermal printer iframe overhaul (Feature 25).
- Third-party calendar synchronization (Google Calendar / Outlook iCal sync).

## Build loop
- Quality gates: Typecheck (`npx tsc --noEmit`) and build (`npm run build`).
- Work conducted on local branch: `feature/foundation-operational-calendar-pdf-ingestion-and-multi-stage-alert-pipeline`.

## Build steps
1. **Extend Event Model & Register Schema:**
   - Add `alertsSent` subdocument (`oneMonth`, `twoWeeks`, `oneWeek`), `category`, and `academicYear` to `src/models/Event.ts`.
   - Add index on `{ academicYear: 1, eventDate: 1 }`.
   - Update event types in `src/lib/admin/types.ts`.
   - *Done when:* TypeScript compiles cleanly with `alertsSent` recognized and indexed.
2. **Build Calendar PDF Parser & API Route:**
   - Create `src/lib/calendar/pdf-parser.ts` using `unpdf` and regex heuristics to parse dates and titles from PDF text streams.
   - Create `src/app/api/admin/calendar/parse-pdf/route.ts` handling `POST` multipart upload and returning parsed event proposals.
   - *Done when:* Endpoint returns structured event proposals from PDF file buffers.
3. **Build Batch Ingestion & Event Update Endpoints:**
   - Create `src/app/api/admin/events/batch/route.ts` supporting `POST` to bulk insert reviewed events with audit logging.
   - Add `PATCH` to `src/app/api/admin/events/[id]/route.ts` for updating event details.
   - *Done when:* Admin can update an event or bulk-insert multiple events via API.
4. **Implement Multi-Stage Advance Alert Evaluator:**
   - Create `src/lib/calendar/alerts.ts` evaluating upcoming events at 30-day, 14-day, and 7-day horizons and creating `Notification` records.
   - Create `POST /api/admin/calendar/check-alerts/route.ts` to trigger alert evaluations.
   - *Done when:* Evaluation correctly identifies events crossing 30d, 14d, and 7d thresholds and creates unread notifications without duplication.
5. **Build Calendar PDF Upload & Interactive Ingestion Modal (`CalendarPdfUploadDialog.tsx`):**
   - Create `src/components/admin/CalendarPdfUploadDialog.tsx` with file picker, loading indicator, editable review table, and "Confirm & Import" button.
   - *Done when:* Uploading a PDF displays parsed events in the editable table and allows editing before confirming.
6. **Build Operational Calendar & Event Edit Components (`OperationalCalendar.tsx`, `EventEditDialog.tsx`):**
   - Create `src/components/admin/OperationalCalendar.tsx` with Year Selector, 12-Month Matrix View, Agenda Stream, countdown banner, and action controls.
   - Create `src/components/admin/EventEditDialog.tsx` for updating event attributes.
   - Export new components from `src/components/admin/index.ts`.
   - *Done when:* Component renders calendar matrix and agenda views with responsive controls.
7. **Integrate into Admin Control Center & Final Verification:**
   - Integrate `OperationalCalendar` into Tab 4 of `AdminControlCenterClient.tsx`.
   - Run `npx tsc --noEmit` and `npm run build` to confirm zero regressions across all pages.
   - *Done when:* Typecheck and production build pass with 0 errors.

## Files / areas
- `src/models/Event.ts` - Extend Event schema with `alertsSent`, `category`, `academicYear`.
- `src/lib/admin/types.ts` - Add updated event and calendar types.
- `src/lib/calendar/pdf-parser.ts` - New PDF text extractor and date/milestone heuristic parser.
- `src/lib/calendar/alerts.ts` - New multi-stage alert evaluator (30d, 14d, 7d).
- `src/app/api/admin/calendar/parse-pdf/route.ts` - Endpoint for PDF calendar ingestion.
- `src/app/api/admin/calendar/check-alerts/route.ts` - Endpoint for evaluating milestone alerts.
- `src/app/api/admin/events/batch/route.ts` - Endpoint for bulk importing parsed events.
- `src/app/api/admin/events/[id]/route.ts` - Add PATCH for editing events.
- `src/components/admin/CalendarPdfUploadDialog.tsx` - PDF upload and editable preview table modal.
- `src/components/admin/EventEditDialog.tsx` - Event editing modal.
- `src/components/admin/OperationalCalendar.tsx` - Multi-year 12-month matrix and agenda stream component.
- `src/app/dashboard/admin/AdminControlCenterClient.tsx` - Tab 4 integration.

## Data / contracts
- **`Event` Model Extension:**
  ```ts
  {
    eventName: string;
    title?: string;
    eventDate: Date;
    academicYear?: number; // e.g. 2026, 2027
    location?: string;
    targetAudience?: string;
    arrivalTime?: string;
    description?: string;
    category?: 'assembly' | 'workshop' | 'competition' | 'holiday' | 'meeting' | 'general';
    alertsSent?: {
      oneMonth?: boolean;
      twoWeeks?: boolean;
      oneWeek?: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- **Alert Stages:**
  - 1 Month: 30 days prior (`alertsSent.oneMonth`)
  - 2 Weeks: 14 days prior (`alertsSent.twoWeeks`)
  - 1 Week: 7 days prior (`alertsSent.oneWeek`)

## Testing
- Logic testing: Verify PDF text parser extracts sample milestone lines into valid Date objects and titles. (PASSED - verified 5 distinct milestone formats, categories, and locations)
- Alert evaluation testing: Verify `alerts.ts` accurately triggers only the appropriate stage (1mo, 2wk, 1wk) without re-triggering. (PASSED - verified 3 alert horizons and confirmed zero duplicate alerts on second run)
- API testing: Verify `POST /api/admin/events/batch` inserts valid documents into MongoDB. (PASSED - successfully persisted and updated)
- Build verification: `npx tsc --noEmit` and `npm run build`. (PASSED - 0 errors, 42 routes compiled)

## Status
- Implementation complete and verified across all 7 steps.
- Ready for final check and completion review (`/complete`).

## Notes for the AI
- Handle PDF text extraction gracefully even when PDFs contain varied layouts or formatting.
- Ensure the preview table allows staff full control to edit or delete any parsed milestone before persisting to the DB.
- Prevent duplicate alerts across multiple evaluations by strictly recording `alertsSent` on each event.
- Ensure all components match the DZF design system aesthetic (Scholastic Navy, DZF Maroon, Academic Gold).

## Open questions
- None. Requirements and pipeline stages are well-defined and agreed upon.



<!-- blueprint:completion {"schemaVersion":1,"specBytes":10080,"specSha256":"8e91f0cb1347d7cf5db9587cf96cbed6246ae6a235c997c312b3b432cb1b5b94","branch":"refs/heads/feature/foundation-operational-calendar-pdf-ingestion-and-multi-stage-alert-pipeline","head":"f748347938a94c2def3c959c83580fcd89671195","baseRef":"refs/heads/main","baseCommit":"f748347938a94c2def3c959c83580fcd89671195","sourceTree":"cc47cbc77a24ca3d3b8da66a6057017e82181e81","absentOptional":[]} -->
