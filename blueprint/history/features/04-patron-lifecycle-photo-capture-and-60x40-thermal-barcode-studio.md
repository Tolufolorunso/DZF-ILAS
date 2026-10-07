# Feature: Patron Lifecycle, Photo Capture & 60x40 Thermal Barcode Studio (Web & API)

**From build-plan:** feature 4
**Build attempt:** 1
**Branch:** feature/patron-lifecycle-photo-capture-and-60x40-thermal-barcode-studio

## Goal
Build the complete patron registration, lifecycle management, live camera photo capture, 60mm × 40mm thermal barcode print studio, and companion mobile REST search endpoints for DZF-ILAS.

## In scope
- **Data Model & Barcode Rules:**
  - Barcode format: exactly 8 numeric digits (`YYYYNNNN`).
  - First 4 digits: current registration year (`2026`).
  - Last 4 digits: continuous sequential member counter incrementing from the last registered member across the entire institutional database (member #583 is `20250583` -> next registered member in 2026 receives `20260584`).
  - Atomic sequence allocation via `Counter` (`patron_member_sequence`) and schema validation on `Patron.barcode`.
  - Comprehensive patron attributes: names, gender, phone, email, address, date of birth, patron type (`student`, `teacher`, `staff`, `guest`), class/grade (`SS1`–`SS3`, `JSS1`–`JSS3`, `P1`–`P6`), school information, parent/guardian contact, employer/department, points balance, and active status.
- **REST API Endpoints:**
  - `GET /api/patrons` - Paginated and searchable patron list.
  - `GET /api/patrons/[id]` - Detailed patron profile by ID or barcode.
  - `POST /api/patrons` - Create patron with atomic barcode generation, photo handling, and cohort enrollment check.
  - `PUT /api/patrons/[id]` - Update patron profile information.
  - `GET /api/patrons/barcode/next` - Returns next sequential barcode for preview (`20260584`).
  - `GET /api/patrons/search` - Ultra-fast lookup endpoint optimized for companion Android barcode scanners and instant verification.
- **Photo Capture & Storage:**
  - WebRTC live camera viewfinder (`navigator.mediaDevices.getUserMedia`) for instant passport snapshots.
  - Drag-and-drop file upload fallback for existing passport photos.
  - Cloudinary upload pipeline saving photos to folder `library_patrons/`.
  - Circular avatar and photo previews throughout directory and profile cards.
- **60mm × 40mm Thermal Barcode Label Print Studio:**
  - Layout formatted for 60mm width × 40mm height thermal adhesive label paper rolls.
  - Physical visual hierarchy:
    1. **Top:** Organisation Name (`Dzuels Educational Foundation` / `DZF-ILAS Station AAoJ`).
    2. **Center:** High-density Code128 / SVG barcode graphic with human-readable patron barcode (`20260584`) with uniform vertical spacing.
    3. **Bottom:** Patron Full Name in bold legible scholastic typography.
  - Browser `@page { size: 60mm 40mm; margin: 0; }` thermal print CSS.
  - Supports both **Single Label Print** and **Batch Roll Print** for selected patrons.
- **Patron Management & Registration Web UI:**
  - `/patrons`: Live Patron Directory querying `dzuelsDB.patrons` (583 live records) with search, patron type filter, pagination, selection checkboxes for bulk label printing, and patron detail modal.
  - `/patrons/register`: Segmented registration wizard with real-time field validation, camera snapshot, barcode preview, and conditional cohort enrollment (visible only to `admin` and `ict` staff).
  - Navigation link integration in `AppShell`.

## Out of scope
- Book loan circulation checkout/return transactions (Phase 2, Feature 6).
- Book summary moderation and point grading (Phase 3, Feature 7).
- Full cohort creation and two-way Google Sheets cloud sync (Phase 3, Feature 10).
- Certificate studio vector generation (Phase 4, Feature 12).

## Build loop
- **Step review:** `feature` (one consolidated review packet after completing small implementation steps).
- **Checkpoint commits:** `disabled`.
- **Merge approval:** Stop for explicit approval before squash merging into `main`.

## Build steps
- [x] 1. **REST API Endpoints & Atomic Barcode Sequence**
   - Implement `GET /api/patrons`, `POST /api/patrons`, `GET /api/patrons/[id]`, `PUT /api/patrons/[id]`, `GET /api/patrons/barcode/next`, and `GET /api/patrons/search`.
   - Integrate `src/lib/patron/barcode.ts` to assign barcodes atomically continuing from last registered member #583.
   - Implement RBAC permission check allowing only `admin` and `ict` roles to assign cohort enrollment during creation.
   - *Done when:* `GET /api/patrons/barcode/next` returns `{ barcode: "20260584" }` and `GET /api/patrons/search?q=tolulope` returns matching records from `dzuelsDB.patrons`.

- [x] 2. **Photo Capture Component & Cloudinary Upload Pipeline**
   - Create `src/components/patrons/PatronPhotoCapture.tsx` supporting WebRTC video stream (`getUserMedia`), frame capture, retake, and file drag-and-drop fallback.
   - Implement API upload route `/api/upload/patron-photo` saving photos to Cloudinary folder `library_patrons/` with secure error handling.
   - *Done when:* Capturing a snapshot from the camera or selecting an image file uploads to Cloudinary and returns a secure image URL.

- [x] 3. **60mm × 40mm Thermal Barcode Label Print Studio**
   - Implement `src/components/patrons/ThermalBarcodeLabel.tsx` rendering SVG barcode using `jsbarcode` with exact 60mm × 40mm dimensions.
   - Enforce exact hierarchy: Organisation name on top, centered barcode + patron number, patron name at bottom with uniform vertical spacing.
   - Add `@media print` CSS for continuous thermal label roll printing with zero margins.
   - Support both single label dialog and multi-label batch print view.
   - *Done when:* Print preview renders strictly at 60mm × 40mm with crisp typography, valid barcode lines, and equal vertical spacing.

- [x] 4. **Patron Directory & Management View (`/patrons`)**
   - Build `/patrons/page.tsx` and `src/app/patrons/PatronListClient.tsx` using `DZFDataTable`, `DZFSearchInput`, `DZFBadge`, and `DZFButton`.
   - Query live `dzuelsDB.patrons` collection with live pagination, text search, and patron type filtering.
   - Add row selection checkboxes to trigger batch 60x40mm thermal label printing for selected patrons.
   - Add Patron Profile modal showing photo, full demographics, barcode, points, and direct print button.
   - *Done when:* Visiting `/patrons` displays live database patrons with instant search, pagination, and single/batch thermal printing triggers.

- [x] 5. **Patron Registration Wizard (`/patrons/register`)**
   - Build `/patrons/register/page.tsx` and `src/app/patrons/register/PatronRegisterClient.tsx`.
   - Form sections: Personal Details, Photo Capture (WebRTC/Upload), Patron Classification (Student, Teacher, Staff, Guest) with conditional school/parent/employer fields.
   - Display active Cohort enrollment selector only when the logged-in staff role is `admin` or `ict`.
   - Live barcode preview showing the next allocated sequence (`20260584`).
   - On submission, create record in MongoDB, increment sequence, and show success screen with immediate "Print 60x40mm Thermal Label" button.
   - *Done when:* Submitting a new patron registers them with barcode `20260584`, saves photo, and launches the 60x40mm thermal label print modal.

- [x] 6. **Navigation Integration & End-to-End Verification**
   - Update `src/components/layout/AppShell.tsx` navigation items so "Patrons" routes to `/patrons`.
   - Run verification suite: `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
   - *Done when:* All pages, routes, and components compile cleanly with 0 TypeScript and linter errors.

## Files / areas
- `src/lib/patron/barcode.ts` (Continuous member sequence & validation engine)
- `src/models/Patron.ts` (Patron Mongoose model & schema validation)
- `src/app/api/patrons/route.ts` (List & register API)
- `src/app/api/patrons/[id]/route.ts` (Patron profile read & update API)
- `src/app/api/patrons/barcode/next/route.ts` (Next barcode sequence preview API)
- `src/app/api/patrons/search/route.ts` (Mobile scanner instant search API)
- `src/app/api/upload/patron-photo/route.ts` (Cloudinary patron photo upload API)
- `src/components/patrons/PatronPhotoCapture.tsx` (WebRTC camera snapshot & upload)
- `src/components/patrons/ThermalBarcodeLabel.tsx` (60x40mm thermal label print studio)
- `src/components/patrons/PatronDetailModal.tsx` (Patron view & single label print dialog)
- `src/app/patrons/page.tsx` (Patron directory server component querying live DB)
- `src/app/patrons/PatronListClient.tsx` (Patron directory client view with table & filters)
- `src/app/patrons/register/page.tsx` (Patron registration server wrapper)
- `src/app/patrons/register/PatronRegisterClient.tsx` (Patron registration wizard)
- `src/components/layout/AppShell.tsx` (Active navigation route binding)

## Data / contracts
- **Patron Barcode Contract:**
  - Length: exactly 8 digits (`YYYYNNNN`).
  - Prefix: 4-digit registration year (`2026`).
  - Suffix: 4-digit sequence continuing from highest registered member (`583` -> `0584`).
- **Cloudinary Image Contract:**
  - Folder: `library_patrons/`
  - Returned structure: `{ secure_url: string, public_id: string }`.
- **Thermal Label Physical Dimensions:**
  - CSS: `@page { size: 60mm 40mm; margin: 0; }`
  - Element width: `60mm`, height: `40mm`, box-sizing: `border-box`.
- **Cohort Enrollment Authorization:**
  - Only users with `role: 'admin'` or `role: 'ict'` are permitted to assign a cohort ID on creation.

## Testing
- Unit & logic checks: `npx tsc --noEmit` and `npm run lint`.
- Live API verification: Query `GET /api/patrons/search?q=tolulope` and verify 200 OK with live records.
- Production build: `npm run build`.

## Notes for the AI
- Never use mock placeholders: all views must query real `dzuelsDB.patrons` (583 existing records).
- Ensure thermal print CSS does not clip or overflow: 60mm × 40mm is compact, so typography and barcode height must be balanced with uniform vertical padding.
- When rendering barcode graphics, use `jsbarcode` generating SVG elements for vector crispness at thermal print resolution (203/300 DPI).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":9984,"specSha256":"e03181d9ea1a06b026ba4ff2bf705083a7dbc01b3ba50c327a809c2277fd2dc0","branch":"refs/heads/feature/patron-lifecycle-photo-capture-and-60x40-thermal-barcode-studio","head":"cb8fbf88113b3aaf481fc9a45d2c61d3a957f9ed","baseRef":"refs/heads/main","baseCommit":"cb8fbf88113b3aaf481fc9a45d2c61d3a957f9ed","sourceTree":"157fa212ac64ee30dae343547f78118c9b7d775b","absentOptional":[]} -->
