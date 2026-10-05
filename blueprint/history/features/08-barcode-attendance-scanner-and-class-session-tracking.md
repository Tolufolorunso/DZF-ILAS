# Feature: Barcode Attendance Scanner & Class Session Tracking (Web & API)

**From build-plan:** feature 8
**Build attempt:** 1
**Branch:** feature/barcode-attendance-scanner-and-class-session-tracking
**Status:** verified

## Goal
Build the high-speed barcode attendance scanner system and class session tracking workspace for daily academic library reading visitors and digital academy cohorts, featuring sub-second hardware scanner auto-submission, audio feedback chimes, camera scanner support, atomic gamification scoring across Patron and MonthlyActivity records, and dual-mode REST APIs for web staff and Android mobile floor scanners.

## In scope
- **Data Model & Attendance Service Engine:**
  - Update `Attendance` schema `classType` enum to support `'library' | 'cohort' | 'literacy' | 'reading_club' | 'book_discussion' | 'workshop' | 'other'`.
  - Normalize `classDate` to start-of-day UTC to prevent date-boundary and timezone collision bugs.
  - Compound unique constraint enforcement: `{ patronBarcode: 1, className: 1, classDate: 1 }` ensuring each patron is scanned only once per class session per calendar day.
  - High-speed scan validation:
    1. Patron exists, is active (`active === true`), and not soft-deleted.
    2. Duplicate check: If patron already checked in today for this class, return HTTP 409 Conflict with the exact previous check-in timestamp and patron details, avoiding duplicate scoring.
  - Atomic multi-collection scoring on attendance:
    1. Create `Attendance` record with `patronId`, `patronBarcode`, `patronName`, `classType`, `className`, `classDate`, `attendanceTime = now`, `markedBy = staffName`, `points`, `notes`, `library = 'AAoJ'`.
    2. Atomically increment `Patron.points` by `points`.
    3. Atomically upsert `MonthlyActivity` for current `monthYear` (`YYYY-MM`):
       - Increment `classesAttended` by 1.
       - Increment `pointsFromAttendance` by `points`.
       - Increment `totalPoints` by `points`.
       - Increment `activityScore` by `points`.
    4. If the session corresponds to an enrolled cohort in `Cohort` collection, sync the attendance entry in `Cohort.attendance`.
  - Reversal / Undo logic:
    - Atomically remove `Attendance` record.
    - Decrement `Patron.points` by awarded `points`.
    - Decrement `MonthlyActivity` counters (`classesAttended`, `pointsFromAttendance`, `totalPoints`, `activityScore`).
- **REST API Endpoints:**
  - `POST /api/attendance/scan` - High-speed scan logging endpoint supporting cookie auth (Web) and Bearer tokens (Android mobile scanner).
  - `GET /api/attendance` - Filterable, paginated audit list of attendance records (`page`, `limit`, `date`, `startDate`, `endDate`, `classType`, `className`, `barcode`, `search`).
  - `GET /api/attendance/stats` - Live metrics for today: Total check-ins today, library visitors today, academy class check-ins today, unique patrons today, total points awarded today.
  - `GET /api/attendance/sessions` - List of active session types, available classes/cohorts, and default point configurations.
  - `DELETE /api/attendance/[id]` - Undo/delete a mistaken attendance check-in with point rollback.
- **Web UI & Attendance Workspace (`/attendance`):**
  - **Metric Stat Cards:**
    - Today's Total Check-ins (Scholastic Navy with check icon).
    - Library Visitors Today (Maroon with book icon).
    - Academy Class Attendance Today (Academic Gold with user-check icon).
    - Unique Patrons Today (Emerald green with users icon).
    - Attendance Points Awarded Today (Amber with star/trophy icon).
  - **Interactive Scanner Interface (`ScannerInterface.tsx`):**
    - Active Session Config Bar:
      - Session Type selector: General Library Visit (`library`), Digital Literacy Cohort (`literacy` / `cohort`), Reading Club (`reading_club`), Book Discussion (`book_discussion`), STEM Workshop (`workshop`).
      - Session / Class Name picker: e.g. "General Reading Room", "cohort-1", "cohort-2", "Early Elementary (Primary 1-3)", "Upper Elementary (Primary 4-6)".
      - Session Date: Defaults to Today with calendar override option.
      - Session Points: Defaults to 5 pts (academy class) or 2 pts (general reading), adjustable by staff.
    - High-Speed Barcode Input:
      - Embedded `DZFBarcodeInput` with auto-focus retention and auto-submission on hardware scanner input.
      - Real-time pulse indicator indicating scanner readiness.
      - Built-in Web Audio API sound synthesis: High-pitch pleasant chime on successful check-in, low buzz warning on duplicate scan, alert tone on invalid barcode.
      - Sound toggle button (Mute / Unmute).
    - Instant Scan Result Card:
      - Patron passport photo (Cloudinary image or default avatar).
      - Full name, barcode, patron type pill (`student`, `teacher`, `staff`, `guest`), class/grade (`SS2`, `P5`), and total accumulated points.
      - Scan confirmation badge: "Check-in Confirmed" with exact time and points awarded (+5 pts).
    - Duplicate Warning Alert:
      - Notice: "Patron already checked in for [Session] today at [Time]".
    - Manual Search Fallback Modal:
      - Search patron by name or barcode for patrons without physical cards, with 1-click check-in.
    - Mobile Camera Scanner Modal / Drawer:
      - Camera view with barcode targeting box for mobile devices and laptops without hardware guns.
  - **Live Attendance Feed & Session Stream:**
    - Real-time table/list of today's check-ins with patron avatar, name, barcode, session name, timestamp, and instant "Undo" button.
  - **Historical Attendance Audit Ledger Tab:**
    - Filterable table using `DZFDataTable` with date range filters, session type filters, search, and CSV export.
  - **AppShell Navigation Integration:**
    - Wire `/attendance` route in `src/components/layout/AppShell.tsx` for sidebar item click and active route highlighting.

## Out of scope
- Automated monthly leaderboard ranking calculation and trophy podium display (Feature 9).
- Automated two-way Google Sheets cloud synchronization (Feature 10).
- Student self-service check-in kiosk without staff supervision.

## Build loop
- **Step review:** `feature` (one consolidated review packet after completing small implementation steps).
- **Checkpoint commits:** `disabled`.
- **Merge approval:** Stop for explicit approval before squash merging into `main`.

## Build steps
- [x] 1. **Attendance Schema Enhancements & Domain Service Engine**
   - Update `src/models/Attendance.ts` to include `'library'` and `'cohort'` in `ClassType` enum.
   - Implement `src/lib/attendance/service.ts` encapsulating:
     - `recordAttendanceScan(input)` with patron lookup, duplicate detection, atomic `Attendance` creation, `Patron.points` increment, `MonthlyActivity` counters upsert, and optional `Cohort.attendance` sync.
     - `undoAttendance(attendanceId)` with atomic score decrement.
     - `getAttendanceLogs(filters)` with pagination, date normalization, and search.
     - `getAttendanceStats(date)` with live breakdown and counts.
     - `getActiveSessions()` returning available session types and cohort presets.
   - *Done when:* Domain service passes unit verification: records scan, rejects duplicates with 409, awards points to Patron & MonthlyActivity atomically, and rolls back cleanly on undo.

- [x] 2. **Dual-Mode Attendance REST API Endpoints**
   - Implement `POST /api/attendance/scan` (supporting cookie session & Bearer token for mobile app).
   - Implement `GET /api/attendance` (paginated audit query).
   - Implement `GET /api/attendance/stats` (today's live metrics).
   - Implement `GET /api/attendance/sessions` (session types and active cohorts).
   - Implement `DELETE /api/attendance/[id]` (undo attendance check-in).
   - *Done when:* Endpoints return expected JSON schemas, enforce authentication guards, and return 409 on duplicate scan.

- [x] 3. **High-Speed Scanner Interface & Audio Feedback Component**
   - Implement `src/components/attendance/ScannerInterface.tsx`:
     - Session configuration bar (session type, class name, date, points).
     - Auto-focused `DZFBarcodeInput` with hardware scanner compatibility.
     - Web Audio API tone generator (success chime, duplicate alert, error beep).
     - Instant feedback card with patron passport photo, name, barcode, class, points awarded.
     - Duplicate scan notification alert with previous check-in time.
     - Quick manual search fallback modal (`ManualCheckinModal.tsx`).
     - Camera scanner drawer (`CameraScannerModal.tsx`).
   - *Done when:* Scanning a barcode triggers instant validation, plays audio feedback, and displays the patron passport card without full page reload.

- [x] 4. **Live Feed & Historical Audit Ledger Components**
   - Implement `src/components/attendance/AttendanceLiveFeed.tsx` for real-time stream of today's check-ins with 1-click undo.
   - Implement `src/components/attendance/AttendanceHistoryTable.tsx` using `DZFDataTable`, date picker, session filters, search, and CSV export.
   - *Done when:* Live feed updates dynamically after each scan, and history table lists records with accurate filters.

- [x] 5. **Attendance Workspace Page (`/attendance`) & AppShell Navigation**
   - Build `src/app/attendance/page.tsx` and `src/app/attendance/AttendanceClient.tsx` featuring metric stat cards, session scanner tab, and audit history tab.
   - Update `src/components/layout/AppShell.tsx` navigation so clicking "Barcode Scanner" routes to `/attendance` and active route highlights properly.
   - *Done when:* Navigating to `/attendance` renders the complete workspace and stat cards query real database counts.

- [x] 6. **End-to-End Verification & Production Build**
   - Run type safety: `npx tsc --noEmit`.
   - Run linter: `npm run lint`.
   - Run production compilation: `npm run build`.
   - Execute integration test verifying scan, duplicate prevention, points crediting, and undo rollback.
   - *Done when:* All checks exit with 0 errors and all routes compile cleanly.

## Files / areas
- `src/models/Attendance.ts` - Update `ClassType` enum to include `'library' | 'cohort'`.
- `src/lib/attendance/service.ts` - Core attendance domain logic, validation, duplicate prevention, atomic points crediting, and undo.
- `src/app/api/attendance/scan/route.ts` - High-speed scan endpoint (Web & Android).
- `src/app/api/attendance/route.ts` - Filterable, paginated attendance query endpoint.
- `src/app/api/attendance/stats/route.ts` - Live daily statistics and session breakdown endpoint.
- `src/app/api/attendance/sessions/route.ts` - Session types and active classes endpoint.
- `src/app/api/attendance/[id]/route.ts` - Delete/undo attendance record endpoint.
- `src/components/attendance/ScannerInterface.tsx` - High-speed hardware scanner UI with auto-focus, Web Audio chimes, and result card.
- `src/components/attendance/AttendanceLiveFeed.tsx` - Today's live check-in stream with undo actions.
- `src/components/attendance/AttendanceHistoryTable.tsx` - Historical audit ledger with filters and CSV export.
- `src/components/attendance/ManualCheckinModal.tsx` - Fallback manual patron search and check-in modal.
- `src/components/attendance/CameraScannerModal.tsx` - Mobile/tablet camera scanner modal.
- `src/app/attendance/page.tsx` - Server page for `/attendance`.
- `src/app/attendance/AttendanceClient.tsx` - Client workspace managing session state, scanner, live feed, and tabs.
- `src/components/layout/AppShell.tsx` - Navigation routing and active state for `/attendance`.

## Data / contracts
- **Attendance Scan Request Contract (`POST /api/attendance/scan`):**
  ```json
  {
    "barcode": "202302",
    "classType": "literacy",
    "className": "cohort-1",
    "classDate": "2026-10-05",
    "points": 5,
    "notes": ""
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Attendance recorded successfully (+5 points awarded).",
    "attendance": {
      "_id": "...",
      "patronBarcode": "202302",
      "patronName": "Tolulope Folorunso",
      "classType": "literacy",
      "className": "cohort-1",
      "classDate": "2026-10-05T00:00:00.000Z",
      "attendanceTime": "2026-10-05T08:30:00.000Z",
      "points": 5,
      "markedBy": "Staff Member"
    },
    "patron": {
      "_id": "...",
      "barcode": "202302",
      "firstname": "Tolulope",
      "surname": "Folorunso",
      "patronType": "student",
      "class": "SS2",
      "points": 45,
      "photo": null
    }
  }
  ```
- **Duplicate Response (409 Conflict):**
  ```json
  {
    "success": false,
    "error": "Patron already marked present for cohort-1 today at 08:30.",
    "alreadyMarked": true,
    "existingAttendance": {
      "_id": "...",
      "attendanceTime": "2026-10-05T08:30:00.000Z",
      "className": "cohort-1"
    },
    "patron": {
      "barcode": "202302",
      "name": "Tolulope Folorunso",
      "photo": null
    }
  }
  ```

## Testing
- Integration script testing:
  - Valid scan increments Patron points and updates MonthlyActivity counters.
  - Immediate subsequent scan with same barcode & className returns 409 duplicate conflict without incrementing points.
  - Undo deletion reverts Patron points and MonthlyActivity counters.
- Typecheck: `npx tsc --noEmit`.
- Lint: `npm run lint`.
- Build: `npm run build`.

## Notes for the AI
- Reuse `DZFBarcodeInput` from `src/components/ui/DZFBarcodeInput.tsx` to get seamless hardware scanner auto-submission and auto-focus retention.
- Synthesize audio chimes using native Web Audio API (`AudioContext`) to provide instant audio feedback without external audio files.
- Ensure all dates are normalized to start-of-day UTC so date filters and compound unique constraints work reliably regardless of client timezone.
- Maintain compatibility with dual auth: use `getAuthSession(req)` which supports both web cookies and Bearer tokens.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":13865,"specSha256":"5b06e3f34dd2cc8dca4ac84e1af5f58b1d2b6122ab0026c3791825c1bd4ae5d9","branch":"refs/heads/feature/barcode-attendance-scanner-and-class-session-tracking","head":"1d77004ce3a30ee2396087370e2b16327d742da6","baseRef":"refs/heads/main","baseCommit":"1d77004ce3a30ee2396087370e2b16327d742da6","sourceTree":"d9ae8dc6dab51080550e692eef883688c9bc2d41","absentOptional":[]} -->
