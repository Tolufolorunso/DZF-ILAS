# Feature: Catalog Acquisition Studio & Monograph Lifecycle Management

**From build-plan:** feature 19
**Build attempt:** 1
**Branch:** feature/catalog-acquisition-studio-monograph-lifecycle-management
**Status:** verified

## Goal

Redesign the book acquisition studio with interactive Dewey Decimal classification hierarchy navigation, real-time live barcode copy preview with thermal spine label simulation, dynamic accession control sequence resolution, staff book metadata editing (`BookEditModal`), and safe monograph deletion restricted to administrators with active loan and waiting hold protection. Additionally, eliminate redundant nested `<AppShell>` wrappers from the catalog workspace pages.

## In scope

1. **Enhanced Dewey Decimal Classification System (`src/lib/catalog/constants.ts` & `src/lib/catalog/accession.ts`):**
   - Expand `DEWEY_CLASSES` to include 10 main hundreds classes plus rich division presets (e.g. 000 Computer Science, 020 Library & Info Sciences, 150 Psychology, 200 Religion, 300 Social Sciences, 330 Economics, 370 Education, 400 Languages, 420 English, 490 African Languages / Yoruba, 500 Natural Sciences, 510 Mathematics, 530 Physics, 540 Chemistry, 570 Biology, 600 Technology / Applied Sciences, 610 Medicine, 620 Engineering, 630 Agriculture, 700 Arts & Recreation, 800 Literature, 810 American Literature, 820 English Literature, 890 African Literature, 900 History & Geography, 960 African History).
   - Support custom decimal division inputs with strict format validation (`/^\d{3}(\.\d+)?$/`).
   - Automatically update accession number sequencing based on the selected class prefix.

2. **Redesigned Book Acquisition Studio (`BookAcquireClient.tsx`):**
   - Modernized multi-card layout with responsive sections:
     - Bibliographic Details (Main Title, Subtitle, Main Author, Additional Authors, Publisher, Place, Publication Year, ISBN, Language, Physical Description, Summary/Annotation, Genre Tags).
     - Classification & Holdings (Dewey Class picker with search & category badges, physical shelf location, copies count, optional custom scanned barcode).
     - Live Barcode & Accession Studio Card (Dynamic next control number, computed barcode, real-time visual 60×40mm thermal label mock preview with barcode bars, organisation header, call number, and metadata).
     - Cover image upload with Cloudinary integration and immediate preview.
   - Support multi-copy batch accession: creating corresponding `Inventory` copy entries linked by `bookId` when `copiesTotal > 1`.
   - Comprehensive error, validation, and loading states.

3. **Staff Book Metadata Editing (`BookEditModal.tsx` & `PUT /api/catalog/[id]`):**
   - Create `src/components/catalog/BookEditModal.tsx` allowing authorized staff (`admin`, `asst_admin`, `librarian`, `ict`) to update bibliographic metadata, Dewey classification, shelf location, total copies, genre tags, and cover image.
   - Wire "Edit Book" action button with pencil icon in `CatalogListClient.tsx` row actions and `BookDetailModal.tsx`.
   - Ensure role check in `src/lib/auth/rbac.ts` (`canManageCatalog`: `admin`, `asst_admin`, `librarian`, `ict`).

4. **Monograph Deletion with Active Loan & Hold Protection (`DELETE /api/catalog/[id]`):**
   - Strictly restricted to `admin` (and `asst_admin`).
   - Check `book.isCheckedOut`.
   - Check `Library` model for active loans (`status: 'borrowed'`).
   - Check `Hold` model for active reservations (`status: { $in: ['waiting', 'ready'] }`).
   - If active loans or holds exist, abort with `400 Bad Request` and descriptive error message detailing whether loans or holds block the deletion.
   - If clean, safely remove the monograph from `Cataloging` and clean up any associated `Inventory` records and fulfilled/cancelled historical holds.
   - In `CatalogListClient.tsx`, wire "Delete Book" action button with trash icon (visible only for Admin), with confirmation dialog.

5. **Layout Deduplication & Navigation Route Polish:**
   - Remove redundant `<AppShell>` from `src/app/dashboard/catalog/page.tsx` and `src/app/dashboard/catalog/acquire/page.tsx`.
   - Update redirects in `acquire/page.tsx` to target `/dashboard/catalog`.

## Out of scope

- RFID hardware gate integration.
- Public web OPAC discovery search (reserved for future public portal iterations).
- Mobile Android client scanner UI changes (APIs remain dual-mode compatible).

## Build loop

- `stepReview: "feature"` (single review packet upon completing implementation steps).
- `checkpointCommits: "disabled"` (no intermediate step commits).
- Final verification with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and automated live testing script before `/complete`.

## Build steps

1. [x] **Catalog RBAC Helpers & Deletion Safety Checks (`src/lib/auth/rbac.ts`, `src/app/api/catalog/[id]/route.ts`)**:
   - Add `canManageCatalog` (`admin`, `asst_admin`, `librarian`, `ict`) and `canDeleteBook` (`admin`, `asst_admin`) in `src/lib/auth/rbac.ts`.
   - Enhance `DELETE /api/catalog/[id]` to query both `Library` (status `borrowed`) and `Hold` (status `waiting` or `ready`). Return clear 400 Bad Request if books or holds are active.
   - Enhance `PUT /api/catalog/[id]` with `canManageCatalog` role check.
   - _Done when:_ API rejects unauthorized users with 403 Forbidden and rejects book deletion with 400 Bad Request when an active loan or hold exists.

2. [x] **Expanded Dewey Decimal Hierarchy & Presets (`src/lib/catalog/constants.ts`)**:
   - Add rich division subcategories (e.g. 510 Math, 820 English Lit, 490 African Lang, 960 African History) to `DEWEY_CLASSES`.
   - Update `validateClassification` to support 3-digit and decimal extensions.
   - _Done when:_ Dewey helper properly validates codes and provides rich search and division options.

3. [x] **Book Edit Modal Component (`src/components/catalog/BookEditModal.tsx`)**:
   - Build a comprehensive editing modal with tabs/sections for Bibliographic Info, Dewey Classification, Shelf Location, Copies, and Summary.
   - Connect to `PUT /api/catalog/[id]` and trigger parent state refresh upon successful update.
   - Export from `src/components/catalog/index.ts`.
   - _Done when:_ Authorized staff can edit any catalog record and see the updated values reflected in the catalog list.

4. [x] **Catalog List Actions & Delete Dialog (`src/app/dashboard/catalog/CatalogListClient.tsx`, `src/components/catalog/BookDetailModal.tsx`)**:
   - Add "Edit Book" action icon (visible for `admin`, `asst_admin`, `librarian`, `ict`).
   - Add "Delete Book" action icon (visible strictly for `admin`).
   - Implement confirmation dialog for book deletion with active loan warnings.
   - Add "Edit" and "Delete" action triggers inside `BookDetailModal.tsx`.
   - _Done when:_ Staff can trigger edit and delete directly from both the table row actions and the detail modal.

5. [x] **Acquisition Studio Redesign (`src/app/dashboard/catalog/acquire/BookAcquireClient.tsx`)**:
   - Redesign the acquisition studio with rich Dewey Decimal division selector.
   - Integrate a real-time live barcode copy and 60×40mm thermal spine label simulator.
   - Update `POST /api/catalog` to automatically initialize `Inventory` items for each copy acquired.
   - _Done when:_ Librarians can select Dewey divisions, view live label previews as they type, catalog multi-copy acquisitions, and print spine labels immediately.

6. [x] **Workspace Layout Deduplication & Route Fixes (`src/app/dashboard/catalog/page.tsx`, `src/app/dashboard/catalog/acquire/page.tsx`)**:
   - Remove redundant `<AppShell>` wrappers from `src/app/dashboard/catalog/page.tsx` and `src/app/dashboard/catalog/acquire/page.tsx`.
   - Update auth redirect fallback to `/dashboard/catalog`.
   - _Done when:_ Catalog views render with a single, clean app shell without duplicate sidebars or headers.

7. [x] **Automated Verification & Integrity Testing**:
   - Run a test script verifying:
     - Dewey validation and accession sequence resolution.
     - Book creation with inventory copy initialization.
     - Book update with authorized role.
     - Book deletion block when an active loan or hold exists.
     - Book deletion success when no loans or holds exist.
     - RBAC restrictions on delete for non-admin roles.
   - Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
   - _Done when:_ All checks pass with 0 errors and production build succeeds.

## Files / areas

- `src/lib/auth/rbac.ts` - Add `canManageCatalog` and `canDeleteBook` helpers.
- `src/lib/catalog/constants.ts` - Expand Dewey Decimal classes with divisions.
- `src/app/api/catalog/[id]/route.ts` - Active loan & hold guards on deletion, role guards on update.
- `src/app/api/catalog/route.ts` - Multi-copy inventory initialization.
- `src/components/catalog/BookEditModal.tsx` - New monograph editing modal.
- `src/components/catalog/BookDetailModal.tsx` - Wire Edit & Delete triggers.
- `src/components/catalog/index.ts` - Re-export `BookEditModal`.
- `src/app/dashboard/catalog/CatalogListClient.tsx` - Edit/Delete action columns and delete confirmation dialog.
- `src/app/dashboard/catalog/acquire/BookAcquireClient.tsx` - Redesigned studio with Dewey selector and live label simulation.
- `src/app/dashboard/catalog/page.tsx` - Remove duplicate `AppShell`.
- `src/app/dashboard/catalog/acquire/page.tsx` - Remove duplicate `AppShell` and update redirects.

## Data / contracts

### Update Book Request (`PUT /api/catalog/[id]`)
- **Request Body:**
  ```json
  {
    "mainTitle": "Things Fall Apart (Annotated Edition)",
    "subtitle": "An African Classic",
    "mainAuthor": "Chinua Achebe",
    "additionalAuthors": [],
    "publisher": "Heinemann African Writers Series",
    "place": "Ibadan",
    "year": 1958,
    "classification": "890",
    "shelfLocation": "Bay 2, Shelf A",
    "copiesTotal": 3,
    "indexTermGenre": ["Literature", "African Fiction"],
    "informationSummary": "The tragic fall of Okonkwo in Umuofia."
  }
  ```
- **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Catalog record updated successfully",
    "book": { ... }
  }
  ```

### Delete Book Request (`DELETE /api/catalog/[id]`)
- **Response Success (200 OK):**
  ```json
  {
    "success": true,
    "message": "Book \"Things Fall Apart\" removed from catalog successfully."
  }
  ```
- **Response Blocked by Active Loan (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "Cannot delete book: 1 copy is currently checked out on active loan in the circulation ledger."
  }
  ```
- **Response Blocked by Active Hold (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "Cannot delete book: 1 active hold reservation is waiting for this title."
  }
  ```

## Testing

- Logic and Integration Tests:
  - Create scratch verification script testing Dewey validation, accession generation, book update by librarian, deletion blocked by active loan/hold, and clean deletion by admin.
- Verification Commands:
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run build`

## Notes for the AI

- Maintain proportional engineering: reuse existing Material UI design system tokens (`dzfColors`, `DZFButton`, `DZFInput`, `DZFModal`).
- No AI attribution in commit messages or pull requests.
- Ensure all endpoints remain dual-mode friendly (`ils_token` cookie and `Authorization: Bearer <token>`) for mobile Android scanners.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":11411,"specSha256":"2abde58f6ef5ecf9ce099ef1336aca840e22b00cb5848ca9bda32273b4da9720","branch":"refs/heads/feature/catalog-acquisition-studio-monograph-lifecycle-management","head":"4956169e6a3022f86d73586c5e8a2f1e9a89fd98","baseRef":"refs/heads/main","baseCommit":"4956169e6a3022f86d73586c5e8a2f1e9a89fd98","sourceTree":"9351943825581e12f4f5699d23ed7fb4952709ab","absentOptional":[]} -->
