# Feature: Circulation Gamification, Monthly Student Loan Caps & Competition Event Tagging

**From build-plan:** feature 18
**Build attempt:** 1
**Branch:** feature/circulation-gamification-monthly-student-loan-caps-competition-event-tagging
**Status:** verified

## Goal

Enhance the DZF-ILAS circulation engine and staff dashboard with competition event tagging and configurable loan durations during checkout, enforce a strict monthly quota of 4 borrowed books for student patrons, award gamified activity points on check-in based on timely return (+3 on/before due date, +1 within 2 days late, 0 points after), introduce a dedicated Holds reservation queue, enhance overdues tracking and renewal controls, and remove the duplicate AppShell wrapper from the circulations workspace.

## In scope

- **Schema Extensions:**
  - Extend `ILibrary` and `LibrarySchema` in `src/models/Library.ts` with `eventTitle?: string` and `pointsAwarded: number` (default: 0).
  - Extend `IMonthlyActivity` and `MonthlyActivitySchema` in `src/models/MonthlyActivity.ts` with `circulationPoints: number` (default: 0).
  - Create `src/models/Hold.ts` to manage book hold reservations (`patronId`, `patronBarcode`, `patronName`, `bookId`, `bookBarcode`, `bookTitle`, `status`: `'waiting' | 'ready' | 'fulfilled' | 'cancelled'`, `notifiedAt`, `expiresAt`, `createdAt`).
- **Student Monthly Loan Quota (Hard Cap of 4 Books):**
  - Update `validateCheckoutEligibility` and `executeCheckout` in `src/lib/circulation/loan.ts` to enforce a hard cap of 4 borrowed books per calendar month strictly for patrons with `patronType === 'student'`.
  - Non-student patrons (teachers, staff, guests) remain unrestricted by the 4-book student cap, adhering to the 1-active-book-at-a-time rule.
  - Return clear, user-friendly 400 Bad Request error messages explaining the quota when a student exceeds 4 checkouts in the current calendar month.
- **Checkout Workflow Enhancements:**
  - Support optional `eventTitle` string (e.g., "Reading Competition 2026", "Literacy Gala", "Creative Writing Workshop") in `POST /api/circulations/check-out` and persist it on the `Library` loan record.
  - Support configurable `dueDays` (2, 5, 7, 14, 21, 30 days) passed from the client, calculating `dueDate` accurately.
  - Zero out checkout activity points so points are strictly earned through timely book returns.
- **Gamified Timely Return Activity Points on Check-In:**
  - Update `executeCheckIn` in `src/lib/circulation/loan.ts` and `POST /api/circulations/check-in`:
    - On or before due date (`returnDate <= dueDate`): award **+3 activity points**.
    - 1 to 2 days after due date (`1 <= daysLate <= 2`): award **+1 activity point**.
    - 3+ days after due date (`daysLate >= 3`): award **0 activity points** (overdue return).
  - Atomically credit awarded points to `patron.points` and `MonthlyActivity` (`totalPoints`, `pointsFromBooks`, `circulationPoints`).
  - Persist `pointsAwarded` on the `Library` loan document and return it in the API response.
- **Enhanced Holds Queue, Overdues & Renewal Controls:**
  - Create REST API endpoint `/api/circulations/holds` (GET active holds, POST create hold reservation, PATCH update/cancel/fulfill hold).
  - In `executeCheckIn`, detect if an active hold exists for the returned book, set hold status to `'ready'`, and notify staff in the response that the book is reserved for the next patron.
  - In `executeRenewal`, verify that no active waiting hold exists for the book before granting the renewal.
  - Create `src/components/circulations/HoldsQueueTable.tsx` and integrate it as a dedicated tab in `CirculationClient.tsx`.
  - Enhance overdues tracking in `ActiveLoansTable.tsx` with quick return and renewal triggers.
- **UI Shell & Presentation Polish:**
  - Remove duplicate `<AppShell>` wrapper from `src/app/dashboard/circulations/CirculationClient.tsx` since `src/app/dashboard/layout.tsx` already wraps the dashboard.
  - Update `ScannerTerminal.tsx` with an Event Title input field, Due Days selector, student loan quota status, and dynamic return points banner.
  - Update `ActiveLoansTable.tsx` and `CirculationHistoryTable.tsx` columns to display Event Title pills and points awarded.

## Out of scope

- Monograph acquisitions studio and Dewey Decimal classification editing (reserved for Feature 19).
- Modifying Android client mobile application code (REST APIs remain 100% backward compatible for mobile scanners).
- Financial fines or cash penalties for overdue items (the foundation uses gamified activity points and loan holds rather than monetary fines).
- Multi-branch cross-institutional catalog transfers (system operates on primary AAoJ repository).

## Build loop

- `stepReview: "feature"` (single review packet upon completing implementation steps).
- `checkpointCommits: "disabled"` (no intermediate step commits).
- Final verification with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and live automated API integration tests before `/complete`.

## Build steps

1. [x] **Data Model Extensions (`Library`, `MonthlyActivity`, `Hold`)**:
   - Update `src/models/Library.ts` to add `eventTitle?: string` and `pointsAwarded?: number` to `ILibrary`, `ILibraryDocument`, and `LibrarySchema`.
   - Update `src/models/MonthlyActivity.ts` to add `circulationPoints?: number` to `IMonthlyActivity`, `IMonthlyActivityDocument`, and `MonthlyActivitySchema`.
   - Create `src/models/Hold.ts` defining `IHold`, `IHoldDocument`, indexes, and Mongoose schema for book reservations.
   - Export `Hold` from `src/models/index.ts`.
   - _Done when:_ `npx tsc --noEmit` passes with no type errors across models.

2. [x] **Core Circulation Logic Updates (`src/lib/circulation/loan.ts`)**:
   - Update `validateCheckoutEligibility`:
     - Restrict the 4-book monthly limit specifically to patrons where `patron.patronType === 'student'`. Non-student patrons bypass this cap.
     - Check loans in the current calendar month directly or via `MonthlyActivity.booksCheckedOut`.
   - Update `executeCheckout`:
     - Accept optional `eventTitle?: string` and `dueDays?: number`.
     - Persist `eventTitle` and initialize `pointsAwarded: 0` on the created `Library` loan record.
     - Award 0 points on checkout (points are earned on timely return).
   - Update `executeCheckIn`:
     - Calculate timely return points: +3 for return on/before due date, +1 for return 1-2 days late, 0 for return 3+ days late.
     - Record `pointsAwarded` on the `Library` loan record.
     - Atomically credit `pointsAwarded` to `patron.points` and `MonthlyActivity` (`totalPoints`, `pointsFromBooks`, `circulationPoints`).
     - Check if an active waiting hold exists for the returned book, update hold status to `'ready'`, and return `holdNotice` in `CheckInResult`.
   - Update `executeRenewal`:
     - Verify if an active waiting hold exists for the book; block renewal if another patron is waiting.
   - Update `getActiveLoans` and `ActiveLoanDTO` to include `eventTitle?: string` and `pointsAwarded?: number`.
   - _Done when:_ TypeScript compiles cleanly and unit loan calculations return expected point values.

3. [x] **Circulation REST API Endpoints**:
   - Update `src/app/api/circulations/check-out/route.ts` to accept `eventTitle` and forward `dueDays`.
   - Update `src/app/api/circulations/check-in/route.ts` to return `pointsAwarded`, `daysLate`, and any `holdNotice`.
   - Update `src/app/api/circulations/history/route.ts` to include `eventTitle` and `pointsAwarded` in serialized loan records.
   - Create `src/app/api/circulations/holds/route.ts` supporting `GET` (list active holds with patron/book details) and `POST` (create new hold or fulfill/cancel existing hold).
   - _Done when:_ All 5 endpoints respond with proper status codes and error formats.

4. [x] **UI Layout Deduplication & ScannerTerminal Enhancements**:
   - In `src/app/dashboard/circulations/CirculationClient.tsx`, remove the outer `<AppShell>` wrapper and its props, rendering directly inside the parent dashboard layout.
   - In `src/components/circulations/ScannerTerminal.tsx`:
     - Add Event Title text input in the checkout form (optional, placeholder e.g. "Reading Competition 2026").
     - Add Due Days dropdown selector (2, 5, 7, 14, 21, 30 days).
     - Display clear error/warning banner when student monthly quota (4 books) is reached.
     - Display dynamic success toast on check-in with exact timely return points awarded (+3, +1, or 0).
   - _Done when:_ Terminal allows entering event title, selecting duration, and visual layout has no double AppShell header/sidebar.

5. [x] **Holds Queue View & Table Enhancements**:
   - Create `src/components/circulations/HoldsQueueTable.tsx` to list active reservations with patron name, book title, hold status badge, and cancel/fulfill buttons.
   - Add a 4th tab "Holds Queue" to `src/app/dashboard/circulations/CirculationClient.tsx` with live hold counts.
   - Update `src/components/circulations/ActiveLoansTable.tsx` and `CirculationHistoryTable.tsx` to show Event Title chips, points awarded, and days overdue pills.
   - _Done when:_ Staff can view holds, monitor overdues, and inspect competition event tags across all circulation tables.

6. [x] **Automated End-to-End Verification**:
   - Write and run a comprehensive verification script testing:
     - 4-book student monthly loan cap enforcement and rejection on 5th checkout.
     - Non-student checkout bypass of 4-book cap.
     - Event title preservation on checkout.
     - Timely return point calculation: on-time (+3), 1 day late (+1), 3 days late (0).
     - Patron and MonthlyActivity points aggregation.
     - Hold creation, check-in alert, and renewal block when a hold is waiting.
   - Run `npx tsc --noEmit` to verify type safety.
   - Run `npm run lint` and `npm run build` to confirm production build cleanliness.
   - _Done when:_ Verification script passes all checks with 0 errors and production build succeeds.

## Files / areas

- `src/models/Library.ts` - Add `eventTitle` and `pointsAwarded` to schema and interfaces.
- `src/models/MonthlyActivity.ts` - Add `circulationPoints` to schema and interfaces.
- `src/models/Hold.ts` - New Mongoose schema for book reservations.
- `src/models/index.ts` - Re-export `Hold`.
- `src/lib/circulation/loan.ts` - Student cap validation, timely return points, hold check.
- `src/app/api/circulations/check-out/route.ts` - Handle `eventTitle` and `dueDays`.
- `src/app/api/circulations/check-in/route.ts` - Return timely return points and hold alerts.
- `src/app/api/circulations/renew/route.ts` - Hold-aware loan renewal.
- `src/app/api/circulations/history/route.ts` - Expose `eventTitle` and `pointsAwarded`.
- `src/app/api/circulations/holds/route.ts` - New API route for book holds.
- `src/app/dashboard/circulations/CirculationClient.tsx` - Remove redundant `AppShell`, add Holds tab.
- `src/components/circulations/ScannerTerminal.tsx` - Event title input, due days selector, points feedback.
- `src/components/circulations/ActiveLoansTable.tsx` - Display event tags and overdue actions.
- `src/components/circulations/CirculationHistoryTable.tsx` - Display event tags and points awarded.
- `src/components/circulations/HoldsQueueTable.tsx` - New component for managing holds.

## Data / contracts

### Checkout Request / Response
- **Request (`POST /api/circulations/check-out`):**
  ```json
  {
    "patronBarcode": "20260001",
    "bookBarcode": "80024720",
    "dueDays": 7,
    "eventTitle": "Reading Competition 2026"
  }
  ```
- **Response Success (201 Created):**
  ```json
  {
    "success": true,
    "message": "Book checkout completed successfully.",
    "dueDate": "2026-10-13T16:00:00.000Z",
    "pointsAwarded": 0,
    "loan": { ... }
  }
  ```
- **Response Student Cap Exceeded (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "Monthly loan limit reached: Students are permitted a maximum of 4 book loans per calendar month. Patron has already borrowed 4 books this month."
  }
  ```

### Check-In Request / Response
- **Request (`POST /api/circulations/check-in`):**
  ```json
  {
    "bookBarcode": "80024720"
  }
  ```
- **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Book returned successfully.",
    "pointsAwarded": 3,
    "returnDate": "2026-10-06T16:30:00.000Z",
    "holdNotice": null
  }
  ```

### Holds Request / Response
- **Request (`POST /api/circulations/holds`):**
  ```json
  {
    "patronBarcode": "20260001",
    "bookBarcode": "80024720"
  }
  ```
- **Response Success (201 Created):**
  ```json
  {
    "success": true,
    "message": "Hold reservation placed successfully.",
    "hold": { ... }
  }
  ```

## Testing

- Logic and Integration Tests:
  - Create scratch script testing student 4-book limit, non-student bypass, event title persistence, timely return points (+3, +1, 0), and hold reservations.
- Verification Commands:
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run build`

## Notes for the AI

- Maintain proportional engineering: reuse existing Mongoose connection and Material UI design system tokens.
- No AI attribution in commit messages or pull requests.
- Ensure all endpoints remain dual-mode friendly (`ils_token` cookie and `Authorization: Bearer <token>`) for mobile Android scanners.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":13314,"specSha256":"6f7f64918632cf71a53e08a33142cd7a7c1a0447e80a0f7a5aed6d98e78bbcf0","branch":"refs/heads/feature/circulation-gamification-monthly-student-loan-caps-competition-event-tagging","head":"51170847b6626210441473aaab7056f9df3364a4","baseRef":"refs/heads/main","baseCommit":"51170847b6626210441473aaab7056f9df3364a4","sourceTree":"d3d32cde4812f7e3143918baa8eeaba3722d6f7f","absentOptional":[]} -->
