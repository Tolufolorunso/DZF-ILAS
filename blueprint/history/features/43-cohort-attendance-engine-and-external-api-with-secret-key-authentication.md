# Feature 43: Cohort Attendance Engine & External API with Secret Key Authentication

**From build-plan:** feature 43
**Build attempt:** 1
**Branch:** feature/cohort-attendance-engine-external-api-with-secret-key-authentication
**Status:** verified

## Goal

Provide a robust attendance tracking system for digital literacy cohorts on `/dashboard/cohorts` and expose a secure external REST API (`POST /api/cohorts/[cohortType]/attendance`) that allows third-party platforms or barcode scanners to mark individual or bulk student attendance authenticated via a secret API key with staff attribution, strictly without awarding patron gamification points.

## In scope

1. **System Governance & API Key Infrastructure (`/dashboard/admin` & `SystemSetting`):**
   - Extend `SystemSetting` schema with `externalAttendanceApiKey`, `externalAttendanceAttributedStaff`, and `externalAttendanceKeyGeneratedAt`.
   - Implement `POST /api/admin/settings/attendance-key` for generating, regenerating, and updating the secret API key and attributed staff name (Admin-only).
   - Add an **External Attendance API Key Governance** card in `/dashboard/admin` (`AdminControlCenterClient.tsx`) with key visibility toggle, copy-to-clipboard, regeneration with confirmation, attributed staff editing, and curl integration snippet.

2. **External & Internal Cohort Attendance REST API (`/api/cohorts/[cohortType]/attendance`):**
   - Implement `POST /api/cohorts/[cohortType]/attendance` supporting dual-mode authentication:
     - Header `X-DZF-API-Key: <key>` or `Authorization: Bearer <key>` matched against `SystemSetting.externalAttendanceApiKey`.
     - Fallback to active staff web session (`getSessionUser`).
   - Accept flexible payload:
     - Single check-in: `{ "barcode": "20260012", "date": "2026-11-06", "week": 3, "attended": true }`
     - Bulk check-in: `{ "barcodes": ["20260012", "20260015", ...], "date": "2026-11-06", "week": 3, "attended": true }`
   - Validate enrollment and active status in specified `cohortType`.
   - Update or append attendance record with `{ date, week, attended, markedBy }` where `markedBy` is `"API: <staff_name>"` or authenticated staff username.
   - Strictly award **0 leaderboard/patron gamification points** (`Patron.points` and `MonthlyActivity` remain untouched).
   - Implement `GET /api/cohorts/[cohortType]/attendance` returning session attendance details for a given date or week.

3. **Active Cohort Attendance Marking Studio (`/dashboard/cohorts`):**
   - Add a prominent **"Mark Attendance"** action button in the Cohort header / roster toolbar.
   - Display a lightweight API Key Integration chip / modal for instructors with endpoint info and one-click key copying.
   - Build **Cohort Attendance Studio Dialog**:
     - Session controls: Session Date selector (default: today) and Session Week selector (e.g. Week 1–12).
     - **Fast Barcode Scanner Tab:** Autofocused input for USB barcode scanners or manual entry with instant feedback chip, sound chime, running scan count, and bulk comma/newline paste support.
     - **Student Roster Check-In Tab:** Full student table for the selected session with individual Present/Absent switches, "Mark All Present", and "Mark All Absent" batch controls.
     - Persist session attendance and refresh cohort statistics and roster in real time.
   - Enhance student attendance history modal to allow modifying or toggling individual recorded weeks directly.

## Out of scope

- Feature 44: Laptop pairing and student roster laptop allocation (strictly reserved for Feature 44).
- Patron gamification points or leaderboard updates for cohort training attendance.
- Modifications to library book circulation or literacy class daily attendant scanner.

## Build loop

- `workflow.stepReview`: feature
- `workflow.checkpointCommits`: disabled

## Build steps

- [x] 1. **Extend Schemas & Admin API Key Governance Backend:**
  - Update `src/models/Cohort.ts` `ICohortAttendanceRecord` to include `markedBy?: string`.
  - Update `src/models/SystemSetting.ts` with `externalAttendanceApiKey`, `externalAttendanceAttributedStaff`, and `externalAttendanceKeyGeneratedAt`.
  - Update `src/lib/admin/service.ts` to return new settings and provide `generateAttendanceApiKey` and `updateAttendanceApiConfig`.
  - Create route `src/app/api/admin/settings/attendance-key/route.ts` with `GET` and `POST` handlers.
  - *Done when:* `npx tsc --noEmit` passes and API key generation/retrieval works cleanly.

- [x] 2. **Build Cohort Attendance REST API Route (`/api/cohorts/[cohortType]/attendance`):**
  - Implement `POST` and `GET` in `src/app/api/cohorts/[cohortType]/attendance/route.ts`.
  - Validate `X-DZF-API-Key` or `Authorization: Bearer <key>` against `SystemSetting.externalAttendanceApiKey` (fallback to staff session).
  - Handle single barcode and bulk barcode array payloads.
  - Record attendance on `Cohort` documents matching `{ cohortType, barcode, isRemoved: false }` with `markedBy`.
  - Ensure zero updates to `Patron.points` or `MonthlyActivity`.
  - Return structured JSON reporting marked students and unmatched barcodes.
  - *Done when:* Route compiles, validates API keys, updates cohort attendance, and handles both single and bulk payloads.

- [x] 3. **Admin Control Center Integration (`/dashboard/admin`):**
  - Add External Attendance API Key Governance section to `src/app/dashboard/admin/AdminControlCenterClient.tsx`.
  - Provide key visibility toggle, copy-to-clipboard, key regeneration with modal confirmation, attributed staff name input, and curl code snippet.
  - *Done when:* Admins can view, edit attributed staff, copy, and regenerate the external attendance API key in `/dashboard/admin`.

- [x] 4. **Cohort Attendance Marking Studio & Barcode Scanner (`/dashboard/cohorts`):**
  - Update `src/app/dashboard/cohorts/CohortClient.tsx`:
    - Add "Mark Attendance" button and Session Attendance modal with Date and Week pickers.
    - Implement Fast Barcode Scanner mode with live scan list, audio feedback, and instant check-in.
    - Implement Roster Check-In list with individual Present/Absent toggles and bulk mark all buttons.
    - Add API Key info dialog / drawer for easy external integration access.
    - Refresh cohort stats and student roster on save.
  - *Done when:* Staff can mark attendance by scanning barcodes or toggling roster rows for any date/week, with live UI feedback.

- [x] 5. **End-to-End Verification & Health Checks:**
  - Run `npx tsc --noEmit` and `npm run build`.
  - Verify API key authentication (reject invalid key, accept valid key).
  - Verify attendance marking records session without modifying patron points.
  - *Done when:* Typecheck and build pass cleanly with code 0.

## Files / areas

- `src/models/Cohort.ts` - Add `markedBy` to `ICohortAttendanceRecord` and schema.
- `src/models/SystemSetting.ts` - Add API key fields to `SystemSetting` interface and schema.
- `src/lib/admin/service.ts` - Settings DTO and key generation/rotation helpers.
- `src/app/api/admin/settings/attendance-key/route.ts` - New admin API key endpoint.
- `src/app/api/cohorts/[cohortType]/attendance/route.ts` - New attendance endpoint.
- `src/app/dashboard/admin/AdminControlCenterClient.tsx` - Admin UI for API key management.
- `src/app/dashboard/cohorts/CohortClient.tsx` - In-app attendance marking studio & scanner.
- `src/components/admin/AttendanceApiKeyGovernanceCard.tsx` - Admin key governance card.
- `src/components/cohorts/CohortAttendanceStudioModal.tsx` - Interactive attendance modal & scanner.
- `src/components/cohorts/CohortApiKeyInfoModal.tsx` - Instructor API key modal.

## Data / contracts

- **`SystemSetting` extensions:**
  - `externalAttendanceApiKey: { type: String, trim: true, default: '' }`
  - `externalAttendanceAttributedStaff: { type: String, trim: true, default: 'Academy Instructor' }`
  - `externalAttendanceKeyGeneratedAt: { type: Date }`

- **`Cohort.attendance` item extension:**
  - `date?: Date`
  - `week?: number`
  - `attended: boolean`
  - `markedBy?: string` (e.g. `"API: Academy Instructor"` or `"oreofe"`)

- **API Request: `POST /api/cohorts/[cohortType]/attendance`:**
  - Headers: `X-DZF-API-Key: <key>` or `Authorization: Bearer <key>`
  - Body:
    ```json
    {
      "barcodes": ["20260012", "20260015"],
      "date": "2026-11-06",
      "week": 3,
      "attended": true
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "cohortType": "alpha-2026",
      "date": "2026-11-06T00:00:00.000Z",
      "week": 3,
      "totalSubmitted": 2,
      "markedCount": 2,
      "records": [
        { "barcode": "20260012", "name": "John Doe", "status": "marked", "attended": true }
      ],
      "unmatched": []
    }
    ```

## Testing

- Typecheck: `npx tsc --noEmit` (Passed with code 0)
- Production Build: `npm run build` (Passed with code 0, 44 routes generated)

## Notes for the AI

- Zero AI attribution in Git commits or PRs (no `Co-Authored-By` or AI tool signatures).
- Never award patron leaderboard points for cohort attendance (strict domain invariant).
- Preserve existing Google Sheets two-way sync and patron photo display.

