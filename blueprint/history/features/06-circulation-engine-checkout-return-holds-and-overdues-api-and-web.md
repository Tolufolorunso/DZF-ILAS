# Feature: Circulation Engine (Checkout, Return, Holds & Overdues API & Web)

**From build-plan:** feature 6
**Build attempt:** 1
**Branch:** feature/circulation-engine-checkout-return-holds-and-overdues-api-and-web
**Status:** verified

## Goal
Build the library loan circulation engine featuring high-speed barcode scanner checkout, check-in/return, renewals, overdues tracking, circulation history audit ledger, and dual-mode REST APIs for web attendants and mobile companion devices.

## In scope
- **Circulation Domain Logic & Database Synchronization:**
  - Complete synchronization across `Library` (transaction ledger), `Cataloging` (book copy availability & checkout history), `Patron` (borrowed status, points balance, and item history), and `MonthlyActivity` (monthly borrower statistics).
  - **Check-Out Validation & Processing:**
    - Fast dual-barcode lookup: Patron barcode (`YYYYNNNN`) and Book barcode (`800...`).
    - Pre-condition checks:
      1. Patron exists, `active: true`, and `isDeleted: false`.
      2. Patron has a valid passport photo on file (`image_url`).
      3. Strict 1-book loan rule: `hasBorrowedBook === false` (rejects with descriptive message if patron already has an active loan).
      4. Monthly borrowing quota: Maximum 4 books per calendar month per patron.
      5. Catalog item exists, `isCheckedOut === false`, and `copiesAvailable > 0`.
    - Post-checkout actions:
      1. Set `Cataloging.isCheckedOut = true`, `checkedOutBy = patron._id`, `checkedOutAt = now`, `copiesAvailable = copiesAvailable - 1`, set `lastBorrowedBy`, push to `patronsCheckedOutHistory`.
      2. Set `Patron.hasBorrowedBook = true`, update `lastBorrowedItem`, push to `itemsCheckedOutHistory`, `$inc: { points: 10 }`.
      3. Create `Library` loan record: `status: 'borrowed'`, `issueDate: now`, `dueDate: now + dueDays` (default: 2 days), `issuedBy: staffUser._id`.
      4. Upsert `MonthlyActivity`: increment `booksCheckedOut: 1`, `totalPoints: 10`.
  - **Check-In / Return Processing:**
    - Book barcode lookup with borrower validation.
    - Post-return actions:
      1. Set `Cataloging.isCheckedOut = false`, clear `checkedOutBy` & `checkedOutAt`, `copiesAvailable = copiesAvailable + 1`, mark `returnedAt` on latest `patronsCheckedOutHistory` entry and in `lastBorrowedBy`.
      2. Set `Patron.hasBorrowedBook = false`, mark `returnedAt` on matching `itemsCheckedOutHistory` entry, clear `lastBorrowedItem`, `$inc: { points: 15 }`.
      3. Set `Library.status = 'returned'`, `returnDate = now`, `receivedBy: staffUser._id`.
      4. Upsert `MonthlyActivity`: increment `booksReturned: 1`, `totalPoints: 15`.
  - **Loan Renewals:**
    - Extends `dueDate` by standard renewal period (+2 days).
    - Limit: Maximum 2 renewals per loan.
    - Increments `renewalsCount` on `Library`, updates `dueDate` on `Cataloging` and `Patron` records.
  - **Overdues Engine:**
    - Real-time detection of all active loans where `dueDate < now`.
    - Computes `overdueDays = Math.ceil((today - dueDate) / 86400000)`.
    - Priority sorting by delinquency duration.
- **REST API Endpoints:**
  - `POST /api/circulations/check-out` - Validated book checkout.
  - `POST /api/circulations/check-in` - Book return processing with return points.
  - `POST /api/circulations/renew` - Loan renewal with max-renewal validation.
  - `GET /api/circulations/overdues` - Active overdue loans sorted by delinquency.
  - `GET /api/circulations/history` - Filterable audit log of loans (status, date range, search).
  - `GET /api/circulations/stats` - Live counts: Active loans, Overdue loans, Returns today, Monthly checkouts.
  - `GET /api/circulations/lookup` - Instant scanner resolution for barcode input (auto-detects patron vs book, returning identity card or catalog status).
- **Web UI & Circulation Terminal (`/circulations`):**
  - **Desk Terminal Tab:**
    - Scanner auto-submit input with keyboard shortcut and manual entry.
    - Two-stage checkout / single-scan return workflow:
      - Scan patron barcode -> loads patron card (photo, active loan status, grade, points).
      - Scan book barcode -> loads book preview (cover, title, author, Dewey class, availability).
      - Submit Checkout button (awards +10 points, displays due date).
      - If a borrowed book barcode is scanned directly -> prompts instant Check-In with confirmation (awards +15 points).
  - **Active Loans & Overdues Tab:**
    - Comprehensive data table querying all 20+ live active loans from `dzuelsDB`.
    - Status pills: `Borrowed` (amber), `Overdue` (crimson with overdue days count).
    - Quick actions on each row: **Return Book** and **Renew (+2 Days)**.
  - **Circulation History Tab:**
    - Audit table with search, status filters (`all`, `borrowed`, `returned`, `overdue`), and pagination.
  - **AppShell Integration:**
    - Wire `circulations` in `AppShell` to `/circulations` with active state badge.

## Out of scope
- Student book summary submission and librarian grading queue (Phase 3, Feature 7).
- Barcode attendance scanning for daily visitors and academy classes (Phase 3, Feature 8).
- Reading competition scoring and proctor rubrics (Phase 3, Feature 11).
- Overdue fine payments or monetary collections (the foundation operates on patron points and academic privileges, not cash fines).

## Build loop
- **Step review:** `feature` (one consolidated review packet after completing small implementation steps).
- **Checkpoint commits:** `disabled`.
- **Merge approval:** Stop for explicit approval before squash merging into `main`.

## Build steps
- [x] 1. **Circulation Synchronization Core & Domain Services**
   - Implement `src/lib/circulation/loan.ts` encapsulating checkout validation, checkin processing, renewal rules, and dual collection synchronization (`Library`, `Cataloging`, `Patron`, `MonthlyActivity`).
   - Implement overdue delinquency calculator and point crediting engine.
   - *Done when:* Calling core functions verifies patron photo, loan limits, and updates all related MongoDB documents atomically.

- [x] 2. **Circulation REST API Endpoints**
   - Implement `POST /api/circulations/check-out`, `POST /api/circulations/check-in`, and `POST /api/circulations/renew`.
   - Implement `GET /api/circulations/overdues`, `GET /api/circulations/history`, `GET /api/circulations/stats`, and `GET /api/circulations/lookup`.
   - Enforce staff authentication (`librarian`, `admin`, `ict`) and mobile bearer token compatibility.
   - *Done when:* `GET /api/circulations/overdues` returns existing active overdue records and `GET /api/circulations/stats` returns accurate counts with 200 OK.

- [x] 3. **Scanner Desk Terminal Component**
   - Implement `src/components/circulations/ScannerTerminal.tsx` with auto-focusing barcode scanner input, live patron verification card (photo, grade, points, eligibility), and book preview card.
   - Support both auto-checkout sequence (Patron -> Book) and instant single-scan return (Book scan).
   - Add visual error banners for ineligible patrons (already has borrowed book, no photo, inactive).
   - *Done when:* Scanning a patron barcode populates the patron passport card, and scanning an available book enables checkout with one click.

- [x] 4. **Active Loans, Overdues & History Data Tables**
   - Implement `src/components/circulations/ActiveLoansTable.tsx` and `src/components/circulations/CirculationHistoryTable.tsx` using `DZFDataTable`, `DZFBadge`, and quick action buttons for Return and Renew.
   - Include prominent overdue indicators (`Overdue by X days`) and renewal counters.
   - *Done when:* Table renders live database loans with functional Return and Renew actions that update the UI without page reload.

- [x] 5. **Circulation Management Page (`/circulations`) & AppShell Navigation**
   - Build `src/app/circulations/page.tsx` and `src/app/circulations/CirculationClient.tsx` combining summary metric cards, Desk Terminal, Active Loans, and History in a sleek tabbed interface.
   - Wire `circulations` route in `src/components/layout/AppShell.tsx`.
   - *Done when:* Visiting `/circulations` displays real database loans, summary metrics, and full scanner terminal workflow.

- [x] 6. **End-to-End Verification & Production Build**
   - Run type safety: `npx tsc --noEmit`.
   - Run linter: `npm run lint`.
   - Run production compilation: `npm run build`.
   - *Done when:* All checks exit with 0 errors and all circulation routes compile cleanly.

## Files / areas
- `src/lib/circulation/loan.ts` (Core loan, return, renewal, and point calculation logic)
- `src/app/api/circulations/check-out/route.ts` (Book checkout API)
- `src/app/api/circulations/check-in/route.ts` (Book return API)
- `src/app/api/circulations/renew/route.ts` (Loan renewal API)
- `src/app/api/circulations/overdues/route.ts` (Overdue loans query API)
- `src/app/api/circulations/history/route.ts` (Loan history & audit logs API)
- `src/app/api/circulations/stats/route.ts` (Circulation summary metrics API)
- `src/app/api/circulations/lookup/route.ts` (Scanner auto-detect barcode lookup API)
- `src/components/circulations/ScannerTerminal.tsx` (Desk terminal scanner component)
- `src/components/circulations/ActiveLoansTable.tsx` (Active loans and overdues table)
- `src/components/circulations/CirculationHistoryTable.tsx` (Historical audit log table)
- `src/components/circulations/index.ts` (Circulation components barrel export)
- `src/app/circulations/page.tsx` (Circulation desk server component)
- `src/app/circulations/CirculationClient.tsx` (Circulation desk client component)
- `src/components/layout/AppShell.tsx` (Navigation item route mapping)

## Data / contracts
- **Loan Rules:**
  - Maximum 1 book borrowed per patron at a time (`hasBorrowedBook: false`).
  - Maximum 4 books borrowed per calendar month.
  - Default loan duration: 2 days (`dueDays: 2`).
  - Maximum 2 renewals per loan.
- **Points Economy:**
  - Checkout: +10 points awarded to patron.
  - Return: +15 points awarded to patron.
  - Renewal: 0 points.
- **Role Permissions:**
  - Checkout, checkin, renewal, and overdues restricted to `admin`, `librarian`, and `ict` staff roles.

## Testing
- Automated code checks: `npx tsc --noEmit` and `npm run lint`.
- Production build: `npm run build`.
- Live API validation: Query `GET /api/circulations/overdues` and verify active loans from MongoDB.

## Notes for the AI
- Zero placeholders: Query real `dzuelsDB.catalogings` and `dzuelsDB.patrons` (which already contain 20 active checkouts in the live database).
- Synchronize all 4 collections (`Library`, `Cataloging`, `Patron`, `MonthlyActivity`) so no split-brain states occur.
- Provide instant barcode scanner feedback with auto-submit and clear visual cues.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10737,"specSha256":"6ccae05a3b3c2b689eee2d5f34c6d0bf3498d5faead35ed814eefaf2f6f958b0","branch":"refs/heads/feature/circulation-engine-checkout-return-holds-and-overdues-api-and-web","head":"e0eaada6777b07d15857389eda5a917924b9e0df","baseRef":"refs/heads/main","baseCommit":"e0eaada6777b07d15857389eda5a917924b9e0df","sourceTree":"05388e06cb3a3062b69dd9510804df23b048b436","absentOptional":[]} -->
