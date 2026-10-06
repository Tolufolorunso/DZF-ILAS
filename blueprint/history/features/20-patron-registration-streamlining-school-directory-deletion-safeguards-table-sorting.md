# Feature: Patron Registration Streamlining, School Directory, Deletion Safeguards & Table Sorting

**From build-plan:** feature 20
**Build attempt:** 1
**Branch:** feature/patron-registration-streamlining-school-directory-deletion-safeguards-table-sorting
**Status:** verified

## Goal

Streamline the patron registration workflow by removing the legacy cohort assignment field, integrating an official 22-institution Ijero Ekiti school directory with auto-address population and manual fallback, introducing typed confirmation security guards (`DELETE`) for both single and bulk patron/catalog monograph deletions with active-loan protections, and adding interactive column sorting with visual up/down arrows to the patron directory table (defaulting to barcode order).

## In scope

1. **Predefined School Directory & Address Auto-Fill (`src/lib/patron/schools.ts`):**
   - Define a shared constant of 22 educational institutions in Ijero Ekiti plus an `"others"` option, storing both school name and standard address.
   - Provide helper utilities to find school address by selected school name.
2. **Patron Registration Streamlining (`src/app/dashboard/patrons/register/PatronRegisterClient.tsx`):**
   - Remove the *"Assign Academy cohort"* form field and all associated registration state/props.
   - Replace the open text input for School Name with a dropdown populated with the 22 Ijero Ekiti schools + `"others"`.
   - When a predefined school is selected, auto-populate the School Address field.
   - When `"others"` is selected, reveal a text field for staff to manually enter the school name, keeping the address field editable.
3. **Patron Edit Profile Modal Consistency (`src/components/patrons/PatronEditModal.tsx`):**
   - Update the School Name field to use the school directory dropdown with manual fallback and address auto-fill for existing patrons.
4. **Typed Deletion Security Guards (`src/app/dashboard/patrons/PatronListClient.tsx` & `src/app/dashboard/catalog/CatalogListClient.tsx`):**
   - Single Patron Deletion: Require staff to type `DELETE` into a confirmation text input before the Delete button becomes active.
   - Single Monograph Deletion: Require staff to type `DELETE` into a confirmation text input before the Delete Book button becomes active.
   - Safeguard persists existing active loan checks (`isCheckedOut`, active loans in `Library` ledger, active `Hold` queues).
5. **Admin Bulk Patron Deletion (`src/app/api/patrons/bulk/route.ts` & `src/app/dashboard/patrons/PatronListClient.tsx`):**
   - Add a secure `DELETE` endpoint at `/api/patrons/bulk` restricted to `admin` role.
   - Enforce server-side active-loan checks: block deletion of any selected patron who has outstanding borrowed items (`Library.find({ patronId: { $in: ids }, status: 'borrowed' })`).
   - Add "Delete Selected (<count>)" action in `PatronListClient.tsx` toolbar when rows are selected by an admin.
   - Require typing `DELETE` in the bulk deletion modal to confirm.
6. **Interactive Table Column Sorting (`src/app/dashboard/patrons/PatronListClient.tsx`):**
   - Set default sort order to `barcode` ascending/descending.
   - Support one-click column sorting on:
     - Patron Name (`firstname` + `surname`)
     - Barcode ID (`barcode`)
     - School / Level (`currentClass` / `schoolName`)
     - Status (`active`)
     - Gender (`gender`)
   - Display prominent up/down arrow indicators (▲ / ▼) on column headers to indicate active sort direction and sortable state.

## Out of scope

- Feature 21 thermal label formatting (Xprinter XP-365B layout updates and date-range bulk printing studio).
- Changes to circulation checkout/return business logic or gamification rules.
- Public route modifications outside the staff dashboard.

## Build loop

- Step review: `feature` (one review packet after all small implementation steps are complete).
- Checkpoint commits: `disabled`.

## Build steps

- [x] 1. **Create School Directory Constants:** Add `src/lib/patron/schools.ts` defining the 22 Ijero Ekiti school options, address mappings, and lookup helpers.
      *Done when:* `IJERO_SCHOOL_OPTIONS` is exported and type-safe across client components.
- [x] 2. **Streamline Patron Registration:** Update `src/app/dashboard/patrons/register/PatronRegisterClient.tsx` to remove the cohort assignment dropdown and replace the school input with the directory select + manual fallback and auto-address fill.
      *Done when:* Registration form renders without cohort selector, auto-fills address on school selection, and supports manual entry when "others" is chosen.
- [x] 3. **Align Patron Edit Modal:** Update `src/components/patrons/PatronEditModal.tsx` to support the school directory dropdown with manual fallback and address auto-fill.
      *Done when:* Editing an existing student allows selecting from the school directory or custom school with address synchronization.
- [x] 4. **Implement Bulk Patron Deletion API:** Create `/api/patrons/bulk/route.ts` with `admin` RBAC and active loan verification before executing bulk removal.
      *Done when:* API deletes selected patrons who have no active loans and returns a 400 error with patron names if any selected patron has borrowed books.
- [x] 5. **Add Typed Confirmation to Deletion Dialogs:** Update `src/app/dashboard/patrons/PatronListClient.tsx` (single & bulk) and `src/app/dashboard/catalog/CatalogListClient.tsx` (single) to require typing `DELETE` before the delete confirmation button enables.
      *Done when:* Delete button remains disabled until `DELETE` is typed exactly into the confirmation input in all deletion dialogs.
- [x] 6. **Implement Interactive Table Column Sorting:** Update `src/app/dashboard/patrons/PatronListClient.tsx` to default sorting by `barcode` and enable interactive sorting with up/down arrow indicators on Name, Barcode ID, School/Level, Status, and Gender.
      *Done when:* Clicking table headers toggles ascending/descending sort with visible arrow icons, correctly ordering the list.
- [x] 7. **End-to-End Verification:** Run typecheck, lint, build, and automated verification scripts for school directory resolution, bulk deletion guards, and sorting logic.
      *Done when:* `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass with zero errors.

## Files / areas

- `src/lib/patron/schools.ts` (new)
- `src/app/dashboard/patrons/register/PatronRegisterClient.tsx`
- `src/components/patrons/PatronEditModal.tsx`
- `src/app/api/patrons/bulk/route.ts` (new)
- `src/app/dashboard/patrons/PatronListClient.tsx`
- `src/app/dashboard/catalog/CatalogListClient.tsx`

## Data / contracts

- **Bulk Delete API:**
  - `DELETE /api/patrons/bulk`
  - Body: `{ patronIds: string[] }`
  - Header: `Cookie: ils_token=...` or `Authorization: Bearer <token>`
  - Response: `{ success: true, deletedCount: number }` or `{ success: false, error: string, blockedPatrons?: string[] }`
- **School Directory Structure:**
  ```ts
  export interface SchoolOption {
    label: string;
    value: string;
    address: string;
  }
  ```

## Testing

- Unit/verification script testing:
  - School directory lookup and address resolution.
  - Bulk deletion loan protection (refusing delete when active loan exists).
  - Client-side sorting comparator across numeric barcodes, strings, and school levels.
- Full verification: `npx tsc --noEmit && npm run lint && npm run build`.

## Notes for the AI

- Do not call `setState` inside `useEffect` during modal initialization to avoid ESLint `react-hooks/set-state-in-effect`. Use key-based resetting or prop derivation.
- Confirmation input comparison must be case-sensitive and trimmed: `confirmationInput.trim() === 'DELETE'`.
- Ensure `DZFDataTable` header click handlers integrate smoothly with `onSort` and arrow visual indicators.
- Preserve all existing RBAC constraints: only `admin` can perform single or bulk patron deletion.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7898,"specSha256":"15f89bb289fdc7a973282c37c0d90bc5c65cd33dacd1e8a58f3b4cdaf4f43039","branch":"refs/heads/feature/patron-registration-streamlining-school-directory-deletion-safeguards-table-sorting","head":"c9342499e27c58d7d04da69509d8722d9be7021c","baseRef":"refs/heads/main","baseCommit":"c9342499e27c58d7d04da69509d8722d9be7021c","sourceTree":"9bb1124af02b93f4272b50ca146a15233017474e","absentOptional":[]} -->
