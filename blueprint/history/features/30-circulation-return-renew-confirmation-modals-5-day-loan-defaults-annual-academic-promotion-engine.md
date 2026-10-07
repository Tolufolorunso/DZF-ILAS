# Feature: Circulation Return/Renew Confirmation Modals, 5-Day Loan Defaults & Annual Academic Promotion Engine

**From build-plan:** feature 30
**Build attempt:** 1
**Branch:** feature/circulation-return-renew-confirmation-modals-5-day-loan-defaults-annual-academic-promotion-engine
**Status:** verified

## Goal

Provide library staff with dedicated, contextual return and renewal confirmation modals in `/dashboard/circulations` preventing accidental check-ins and renewals, establish a global 5-day default loan period across circulation APIs and terminals, enforce optional patron phone numbers alongside mandatory parent/guardian contact numbers for students, and implement an automated annual August 31st student promotion engine with admin preview and execution controls.

## In scope

1. **Circulation Return Confirmation Modal (`ReturnConfirmModal.tsx`):**
   - Contextual overview: Book title, author, barcode, shelf location, cover image.
   - Borrower overview: Patron full name, barcode, class/grade, patron type, and passport photo.
   - Status evaluation: Current loan due date with prominent status badge:
     - On-Time (on or before due date): Green badge + "+3 Activity points awarded".
     - Late (1–2 days past due): Amber badge + "+1 Activity point awarded".
     - Overdue (3+ days past due): Red badge + "0 Activity points awarded".
   - Explicit confirmation CTA before invoking `/api/circulations/check-in`.

2. **Circulation Renewal Configuration Modal (`RenewalModal.tsx`):**
   - Contextual overview: Book title, barcode, patron name, barcode, current due date, and renewals used count (e.g. `0 of 2 renewals used`).
   - Extension days configuration: Numeric input defaulting to 5 days, with quick-pick chips (+3, +5, +7 days).
   - Live date preview: Real-time calculated new target due date preview.
   - Renewal limit guard: Disables submission and alerts when loan has already reached the maximum 2 renewals.
   - Explicit confirmation CTA invoking `/api/circulations/renew`.

3. **Circulation Workspace Integration:**
   - Integrate both dialogs into `src/components/circulations/ActiveLoansTable.tsx` replacing instant click executions.
   - Integrate both dialogs into `src/components/circulations/ScannerTerminal.tsx` for checked-out book scan states.

4. **5-Day Default Loan Period:**
   - Update default due days from 2 to 5 in `src/lib/circulation/loan.ts` (`executeCheckout` and `executeRenewal`).
   - Update default due days from 2 to 5 in `src/app/api/circulations/check-out/route.ts` and `src/app/api/circulations/renew/route.ts`.
   - Update default loan duration in `src/components/circulations/ScannerTerminal.tsx` to 5 days.

5. **Patron Phone Rules (Optional Patron Phone, Mandatory Parent Phone):**
   - Patron registration (`/dashboard/patrons/register`): Make patron `phoneNumber` optional; make parent `parentPhone` required for students.
   - Patron profile update modal (`PatronEditModal.tsx`): Make patron `phoneNumber` optional; make parent `parentPhoneNumber` required for students.
   - Patron API routes (`/api/patrons` and `/api/patrons/[id]`):
     - Enforce `parentInfo.parentPhoneNumber` presence when `patronType === 'student'`.
     - Allow optional `phoneNumber` (eliminate hardcoded `'08000000000'` fallback).

6. **Annual Academic Promotion Engine:**
   - Promotion ladder mapping in `src/lib/patron/promotion.ts`:
     - Primary: `Pry 1` -> `Pry 2` -> `Pry 3` -> `Pry 4` -> `Pry 5` -> `Pry 6` -> `JSS 1`
     - Junior Secondary: `JSS 1` -> `JSS 2` -> `JSS 3` -> `SS 1`
     - Senior Secondary: `SS 1` -> `SS 2` -> `SS 3` -> `out-of-school`
   - Invariants: Non-student patron types (`teacher`, `staff`, `guest`) and patrons already `out-of-school` remain completely untouched.
   - August 31st engine execution hook checking `SystemSetting.lastPromotionYear` to prevent duplicate annual runs.
   - Administrative preview and trigger in `/dashboard/admin`: Dry-run simulation breakdown and manual execution with audit logging.

## Out of scope

- Feature 31 daily actions live feed, undo engine, and real-time task progression.
- Automated SMS/WhatsApp notifications to parents (contact details stored for record and emergency contact).
- Altering user account roles or patron membership status during class promotions.

## Build loop

- Step review cadence: `feature` (one review packet after all small implementation steps are complete).
- Checkpoint commits: `disabled`.
- Final feature commit and squash merge managed by `/complete`.

## Build steps

- [x] **Step 1: Core Promotion Engine & Administrative API**
  - Create `src/lib/patron/promotion.ts` implementing `promoteClass(currentClass: string): string`, `simulateAcademicPromotion()`, and `executeAcademicPromotion()`.
  - Extend `src/models/SystemSetting.ts` and `src/lib/admin/types.ts` with `lastPromotionYear?: number` and `lastPromotionDate?: Date`.
  - Create API routes `GET /api/admin/promotions` (dry-run preview) and `POST /api/admin/promotions` (manual trigger) with Admin RBAC protection.
  - *Done when:* `npx tsc --noEmit` passes and promotion test helper accurately advances `Pry 6` -> `JSS 1`, `JSS 3` -> `SS 1`, `SS 3` -> `out-of-school`, while preserving non-students and `out-of-school`.

- [x] **Step 2: Patron Contact Validation (Optional Patron Phone, Mandatory Parent Phone)**
  - Update `src/app/api/patrons/route.ts` and `src/app/api/patrons/[id]/route.ts`:
    - Remove `'08000000000'` fallback; store `phoneNumber` as optional string.
    - Validate that `patronType === 'student'` requires a non-empty `parentInfo.parentPhoneNumber`.
  - Update `src/app/dashboard/patrons/register/PatronRegisterClient.tsx`:
    - Make patron contact phone optional; update field label.
    - Make parent phone required for student registrations with clear validation messaging.
  - Update `src/components/patrons/PatronEditModal.tsx`:
    - Make patron contact phone optional; update field label.
    - Make parent phone required for student updates with clear validation messaging.
  - *Done when:* Registering/updating a student without parent phone fails with a 400 error and client message, while registering/updating without patron phone succeeds.

- [x] **Step 3: Circulation 5-Day Default Loan Period & API Alignment**
  - Update `src/lib/circulation/loan.ts`: Default `dueDays` to 5 in `executeCheckout` and `executeRenewal`.
  - Update `src/app/api/circulations/check-out/route.ts`: Default `dueDays` to 5.
  - Update `src/app/api/circulations/renew/route.ts`: Default `extendDays` to 5.
  - Update `src/components/circulations/ScannerTerminal.tsx`: Default duration state to 5.
  - *Done when:* Loans checked out or renewed without explicit duration parameters receive a due date 5 calendar days in the future.

- [x] **Step 4: Circulation Return and Renewal Confirmation Modals**
  - Create `src/components/circulations/ReturnConfirmModal.tsx` showing book details, patron details, shelf location, due date, and On-Time vs. Overdue badges (+3, +1, or 0 points).
  - Create `src/components/circulations/RenewalModal.tsx` showing book, patron, current due date, renewals count, customizable extension days (default 5, chips +3, +5, +7), and new due date preview.
  - Integrate modals into `src/components/circulations/ActiveLoansTable.tsx` replacing instant return and renew button handlers.
  - Integrate modals into `src/components/circulations/ScannerTerminal.tsx` for checked-out book scan states.
  - Export new modals from `src/components/circulations/index.ts`.
  - *Done when:* Clicking Return or Renew on any active loan in `ActiveLoansTable` or `ScannerTerminal` opens the confirmation dialog with full contextual details before performing the API call.

- [x] **Step 5: Admin Promotion Preview & Trigger Console**
  - Add "Academic Promotion Engine" card in `src/app/dashboard/admin/AdminControlCenterClient.tsx`.
  - Wire preview modal displaying students per class transition, dry-run counts, and execution confirmation dialog.
  - Add check in admin/patron loader that verifies if August 31st has passed for current year and alerts admin if pending.
  - *Done when:* Admin can inspect promotion preview matrix and execute the annual class promotion from the admin dashboard.

## Files / areas

- `src/lib/patron/promotion.ts` (new)
- `src/models/SystemSetting.ts`
- `src/lib/admin/types.ts`
- `src/lib/admin/service.ts`
- `src/app/api/admin/promotions/route.ts` (new)
- `src/app/api/patrons/route.ts`
- `src/app/api/patrons/[id]/route.ts`
- `src/app/dashboard/patrons/register/PatronRegisterClient.tsx`
- `src/components/patrons/PatronEditModal.tsx`
- `src/lib/circulation/loan.ts`
- `src/app/api/circulations/check-out/route.ts`
- `src/app/api/circulations/renew/route.ts`
- `src/components/circulations/ScannerTerminal.tsx`
- `src/components/circulations/ActiveLoansTable.tsx`
- `src/components/circulations/ReturnConfirmModal.tsx` (new)
- `src/components/circulations/RenewalModal.tsx` (new)
- `src/components/circulations/index.ts`
- `src/components/admin/AcademicPromotionCard.tsx` (new)
- `src/components/admin/index.ts`
- `src/app/dashboard/admin/AdminControlCenterClient.tsx`

## Data / contracts

- **Promotion ladder contract:**
  - `Pry 1` -> `Pry 2`, `Pry 2` -> `Pry 3`, `Pry 3` -> `Pry 4`, `Pry 4` -> `Pry 5`, `Pry 5` -> `Pry 6`
  - `Pry 6` -> `JSS 1`
  - `JSS 1` -> `JSS 2`, `JSS 2` -> `JSS 3`
  - `JSS 3` -> `SS 1`
  - `SS 1` -> `SS 2`, `SS 2` -> `SS 3`
  - `SS 3` -> `out-of-school`
  - Any student whose class already equals `'out-of-school'` -> remains `'out-of-school'`.
  - Non-student patrons (`patronType !== 'student'`) -> untouched.
- **`SystemSetting` extension:**
  - `lastPromotionYear?: number`
  - `lastPromotionDate?: Date`
- **`POST /api/circulations/check-out`:**
  - `dueDays?: number` (defaults to 5)
- **`POST /api/circulations/renew`:**
  - `extendDays?: number` (defaults to 5)
- **Patron contact contract:**
  - `phoneNumber?: string` (optional, trimmed, null/undefined if empty)
  - `parentInfo.parentPhoneNumber: string` (required if `patronType === 'student'`)

## Testing

- Typecheck: `npx tsc --noEmit`
- Build check: `npm run build`
- Unit verification: Run a scratch verification test verifying promotion logic transitions and patron phone validation boundaries.

## Notes for the AI

- Preserve existing RBAC authorization: circulation checkout/return/renewal requires `['admin', 'librarian', 'ict']`; promotion execution requires `['admin']`.
- Keep modal layout accessible and responsive using Material UI dialog primitives with max-height and auto-scroll content containers to prevent viewport clipping.
- Do not modify non-student patron accounts during promotion execution.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10699,"specSha256":"c5f29cc65c8f76af65dcce08696c33d72d1be71e28db5d07f3912d888da38c76","branch":"refs/heads/feature/circulation-return-renew-confirmation-modals-5-day-loan-defaults-annual-academic-promotion-engine","head":"884ea466f398ec5aa09449f3a03c7a0a1b5b98b6","baseRef":"refs/heads/main","baseCommit":"884ea466f398ec5aa09449f3a03c7a0a1b5b98b6","sourceTree":"aea40cbb85e0624d3cf09a2f9289400987fc5856","absentOptional":[]} -->
