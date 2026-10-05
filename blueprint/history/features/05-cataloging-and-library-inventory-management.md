# Feature: Cataloging & Library Inventory Management (Web & API)

**From build-plan:** feature 5
**Build attempt:** 1
**Branch:** feature/cataloging-and-library-inventory-management

**Status:** verified

## Goal
Build the library book catalog, acquisition wizard, Dewey Decimal classification system, accession control numbering, shelf location mapping, copy barcode labeling, 60mm × 40mm thermal book label studio, and companion mobile lookup REST endpoints for DZF-ILLS.

## In scope
- **Data Model & Cataloging Rules:**
  - Full bibliographic attributes on `Cataloging`: Main Title, Subtitle, Main Author, Additional Authors, Publication Info (Publisher, Place, Year), ISBN, Dewey Decimal Classification (`000`–`900` main classes with DDC sub-codes), Accession Control Number (`${classification}.${sequence}`, e.g., `800.718`), unique book barcode, language, physical description, summary, genres/index terms, total and available copy counts, and physical shelf location (e.g. "Bay 3, Shelf B", "Aisle 1").
  - Auto-generation of next Accession Control Number per classification code continuing from existing live records.
  - Equipment & Non-Book Asset Inventory on `Inventory`: item name, department (`ict`, `library`, `academy`, `admin`), quantity, condition (`new`, `good`, `fair`, `poor`, `damaged`), status (`available`, `checked_out`, `maintenance`, `lost`), unique asset barcode, and acquisition date.
- **REST API Endpoints:**
  - `GET /api/catalog` - Paginated and searchable book catalog with filters by Dewey classification, genre, and availability.
  - `GET /api/catalog/[id]` - Retrieve full book details by ObjectId or barcode.
  - `POST /api/catalog` - Create new catalog accession with Dewey classification, control number, and copy count.
  - `PUT /api/catalog/[id]` - Update catalog bibliographic details, copies, and shelf location.
  - `DELETE /api/catalog/[id]` - Soft-delete or archive catalog record (prevented if currently checked out).
  - `GET /api/catalog/search` - Ultra-fast lookup endpoint for barcode scanners and Android companion app (scans book barcode and returns matching title, author, copies available, and shelf location).
  - `GET /api/inventory` - Paginated and filterable asset inventory for non-book equipment.
  - `POST /api/inventory` - Register new physical equipment asset with unique barcode.
  - `PUT /api/inventory/[id]` - Update asset quantity, condition, or maintenance status.
- **Book Cover Upload Pipeline:**
  - Cloudinary upload route `/api/upload/book-cover` saving book cover images to folder `library_books/` with size/type validation.
- **60mm × 40mm Thermal Book Label Print Studio:**
  - Formatted for 60mm × 40mm thermal adhesive label paper rolls.
  - Layout hierarchy:
    1. **Top:** Organisation Name (`Dzuels Educational Foundation • Station AAoJ`).
    2. **Center:** High-density Code128 / SVG barcode graphic with human-readable book barcode with uniform vertical spacing.
    3. **Bottom:** Book Title (truncated cleanly) + Call Number / Shelf Location (`800.717 • Bay 3, Shelf B`).
  - Supports single book spine/cover label printing and batch roll printing for selected books.
- **Web UI & Management Views:**
  - `/catalog`: Library Catalog Directory querying `dzuelsDB.catalogings` (1,353 live book records) with instant search (title, author, barcode, ISBN), Dewey classification tab filters (`000`–`900`), copy availability indicators, single/batch thermal label printing, and comprehensive book detail modal.
  - `/catalog/acquire`: Multi-step book acquisition wizard with metadata entry, Dewey Decimal classification helper, automated control number allocation, book cover upload, copy counts, shelf location mapping, and immediate barcode print trigger on acquisition.
  - `/inventory`: Equipment and hardware inventory view querying `dzuelsDB.inventories` with department filters (`ict`, `library`, `academy`), condition tags, and new asset modal.
  - Navigation links wired in `AppShell` for Catalog and Inventory.

## Out of scope
- Loan checkout and checkin circulation transactions (Phase 2, Feature 6).
- Overdue fine calculation and loan renewal policies (Phase 2, Feature 6).
- Book summary moderation and patron point awarding (Phase 3, Feature 7).
- Barcode attendance scanning for daily visitors (Phase 3, Feature 8).

## Build loop
- **Step review:** `feature` (one consolidated review packet after completing small implementation steps).
- **Checkpoint commits:** `disabled`.
- **Merge approval:** Stop for explicit approval before squash merging into `main`.

## Build steps
- [x] 1. **Catalog REST API Endpoints & Accession Number Sequence Engine**
   - Implement `src/lib/catalog/accession.ts` to compute the next Accession Control Number for any Dewey class (e.g. `800` -> `800.718`).
   - Implement `GET /api/catalog`, `POST /api/catalog`, `GET /api/catalog/[id]`, `PUT /api/catalog/[id]`, `DELETE /api/catalog/[id]`, and `GET /api/catalog/search`.
   - Protect write routes to ensure only authenticated staff can create or edit books.
   - *Done when:* `GET /api/catalog/search?q=treehouse` returns matching records from `dzuelsDB.catalogings` (1,353 records) and `POST /api/catalog` creates a new book with verified unique control number.

- [x] 2. **Inventory REST API Endpoints for Non-Book Assets**
   - Implement `GET /api/inventory`, `POST /api/inventory`, and `PUT /api/inventory/[id]`.
   - Query and update `dzuelsDB.inventories` with department, condition, status, and barcode validation.
   - *Done when:* `GET /api/inventory` returns existing assets (e.g. `dell laptop - staff`, dept `ict`) with 200 OK.

- [x] 3. **Cloudinary Book Cover Upload Pipeline**
   - Implement `POST /api/upload/book-cover` using Cloudinary credentials saving to folder `library_books/`.
   - Add image format validation (JPEG, PNG, WebP) and 5MB size limit.
   - *Done when:* Uploading a cover image returns `{ success: true, secure_url, public_id }`.

- [x] 4. **60mm × 40mm Thermal Book Spine/Cover Barcode Label Studio**
   - Create `src/components/catalog/ThermalBookLabel.tsx` rendering SVG barcode using `jsbarcode` sized strictly to 60mm × 40mm.
   - Enforce hierarchy: Organisation on top, centered barcode + barcode number, Book title + Call Number / Shelf Location at bottom with uniform vertical spacing.
   - Add single book label dialog and multi-book batch print preview with `@page { size: 60mm 40mm; margin: 0; }`.
   - *Done when:* Print preview renders strictly at 60mm × 40mm with crisp typography, valid barcode lines, and equal vertical spacing.

- [x] 5. **Library Catalog Directory View (`/catalog`)**
   - Build `/catalog/page.tsx` and `src/app/catalog/CatalogListClient.tsx` using `DZFDataTable`, `DZFSearchInput`, `DZFBadge`, and `DZFButton`.
   - Query live `dzuelsDB.catalogings` collection with pagination, text search (title, author, barcode, ISBN), and Dewey classification filters (`All`, `000 General`, `100 Philosophy`, `200 Religion`, `300 Social Sciences`, `400 Language`, `500 Science`, `600 Technology`, `700 Arts`, `800 Literature`, `900 History`).
   - Add selection checkboxes to trigger batch 60×40mm thermal label printing for selected books.
   - Add Book Detail modal showing full catalog card, Dewey class, copies total/available, shelf location, and print label CTA.
   - *Done when:* Visiting `/catalog` displays live database books with instant search, classification filters, and single/batch thermal label printing triggers.

- [x] 6. **Book Acquisition Wizard (`/catalog/acquire`) & Inventory View (`/inventory`)**
   - Build `/catalog/acquire/page.tsx` and `src/app/catalog/acquire/BookAcquireClient.tsx` with multi-step acquisition flow: Bibliographic Info, Dewey Classification helper, Control Number generation, Copy counts, Shelf location, and Cover upload.
   - Build `/inventory/page.tsx` and `src/app/inventory/InventoryClient.tsx` for physical asset tracking.
   - Wire navigation links in `src/components/layout/AppShell.tsx` for Catalog (`/catalog`) and Inventory (`/inventory`).
   - Run verification suite: `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
   - *Done when:* Submitting a new book in the wizard creates the record in MongoDB and launches the 60×40mm thermal label print modal, and all verification checks exit 0.

## Files / areas
- `src/lib/catalog/accession.ts` (Dewey decimal control number generator & validator)
- `src/models/Cataloging.ts` (Book catalog Mongoose schema)
- `src/models/Inventory.ts` (Non-book equipment inventory schema)
- `src/app/api/catalog/route.ts` (List & acquire books API)
- `src/app/api/catalog/[id]/route.ts` (Book detail, update & archive API)
- `src/app/api/catalog/search/route.ts` (Barcode scanner instant search API)
- `src/app/api/upload/book-cover/route.ts` (Cloudinary book cover upload API)
- `src/app/api/inventory/route.ts` (Asset inventory list & create API)
- `src/app/api/inventory/[id]/route.ts` (Asset inventory update API)
- `src/components/catalog/ThermalBookLabel.tsx` (60x40mm thermal book label generator)
- `src/components/catalog/ThermalBookPrintDialog.tsx` (Single & batch roll print dialog)
- `src/components/catalog/BookDetailModal.tsx` (Full catalog card & print trigger)
- `src/app/catalog/page.tsx` (Server wrapper querying live catalog)
- `src/app/catalog/CatalogListClient.tsx` (Catalog directory client component)
- `src/app/catalog/acquire/page.tsx` (Book acquisition page)
- `src/app/catalog/acquire/BookAcquireClient.tsx` (Book acquisition wizard client component)
- `src/app/inventory/page.tsx` (Inventory management server wrapper)
- `src/app/inventory/InventoryClient.tsx` (Inventory client component)
- `src/components/layout/AppShell.tsx` (Navigation route updates)

## Data / contracts
- **Accession Control Number Contract:**
  - Format: `${classification}.${sequence}` (e.g. `800.718` where `800` is the Dewey Decimal classification and `718` is the sequential accession number within that class).
- **Book Barcode Contract:**
  - Format: Numeric or alphanumeric string uniquely identifying the copy (e.g. `80071820` or scanner input).
- **Thermal Label Physical Dimensions:**
  - CSS: `@page { size: 60mm 40mm; margin: 0; }`
  - Element width: `60mm`, height: `40mm`, box-sizing: `border-box`.
  - Top: Organisation name (`Dzuels Educational Foundation • Station AAoJ`).
  - Center: Barcode graphic with human-readable barcode number with uniform vertical spacing.
  - Bottom: Book title + Call Number / Shelf location.
- **Role-Based Access Control:**
  - Creating and editing books or inventory is restricted to `admin`, `librarian`, and `ict` staff roles.

## Testing
- Automated code checks: `npx tsc --noEmit` and `npm run lint`.
- Live API verification: Query `GET /api/catalog/search?q=treehouse` and verify live books returned.
- Production build: `npm run build`.

## Notes for the AI
- Zero placeholders: Query real `dzuelsDB.catalogings` (1,353 records) and `dzuelsDB.inventories` (5 records).
- 60mm × 40mm thermal adhesive label paper format is strictly required. Ensure text truncation and SVG barcode sizing fit without clipping.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":11124,"specSha256":"0739c054452cbfe73a46daddd04d67a63814744aed689fc156e4ad12354e9598","branch":"refs/heads/feature/cataloging-and-library-inventory-management","head":"66f5c2c02bd34de8b59b4ea71283196761f5c372","baseRef":"refs/heads/main","baseCommit":"66f5c2c02bd34de8b59b4ea71283196761f5c372","sourceTree":"4a7a7b41362af0bea1c03d95ae86901a52efb8bb","absentOptional":[]} -->
