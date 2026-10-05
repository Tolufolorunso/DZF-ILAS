# Feature: Certificate Studio & Vector Export Pipeline

**From build-plan:** feature 12
**Build attempt:** 1
**Status:** verified
**Branch:** feature/certificate-studio-and-vector-export-pipeline

## Goal

Provide a professional, high-fidelity Certificate Studio and vector export pipeline (`/certificates`) for the Dzuels Educational Foundation. The platform enables academy instructors, competition judges, and librarians to design, issue, batch-generate, and export classical landscape A4 certificates (842.25 × 595.5pt aspect ratio) for Digital Literacy Cohort graduates, Reading Competition winners, and Library Academic Merit honorees. The studio features interactive live customization, precision vector ornaments, embossed gold foil seals, stylized signature lines, multi-format export pipelines (instant vector SVG, 300 DPI high-resolution PNG, and landscape print-to-PDF), and a public verification route (`/certificates/verify/[code]`) with verifiable serial codes (`DZF-CERT-2026-XXXX`).

## Design reference

Matches Section 2.12 and Section 7.3.8 of `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md`:
- **Canvas Aspect Ratio**: 842.25 × 595.5pt (1.414 aspect ratio, standard ISO 216 Landscape A4).
- **Canvas Background**: `#ffffff` (`--certificate-background`) - Export print canvas base.
- **Parchment Surface**: `#fbfaf8` (`--certificate-surface`) - Off-white certificate paper simulation with subtle warm aura.
- **Classical Border**: `#e4ddd5` (`--certificate-border`) - Double concentric ornate vector border with intricate corner rosettes.
- **Primary Crimson**: `#7a1515` (`--certificate-primary`) - Foundation emblem, header titles, and decorative ribbon accents.
- **Deep Crimson**: `#540a0a` (`--certificate-primary-dark`) - High-contrast text elements and title drop shadows.
- **Certificate Gold**: `#cca349` (`--certificate-gold`) - Embossed foil seal medallion, laurels, and metallic emblems.
- **Soft Gold Fill**: `#fdf4cf` (`--certificate-gold-soft`) - Inner medallion background fill and decorative star markers.
- **Signatory Royal Blue**: `#1d4670` (`--certificate-blue`) - Signatory divider lines and subtitle designations.
- **Body Typography Ink**: `#2b2b2b` (`--certificate-ink`) - Recipient name and award citation text.
- **Muted Serif Text**: `#444444` (`--certificate-muted`) - Date stamps, issue serial codes, and verification footnote.
- **Watermark Wash**: `rgba(122, 21, 21, 0.08)` - Translucent centered Foundation monogram crest ("D").
- **Typography Tokens**: `Playfair Display` (formal award serif titles & recipient name), `Outfit` (clean headings & kicker accents), and `Inter` (subtitles & verification footnotes).

## In scope

1. **Domain Model & Persistence Service (`src/models/Certificate.ts`, `src/lib/certificates/service.ts`)**:
   - `Certificate` Mongoose schema with fields:
     - `certificateCode`: Unique serial sequence (e.g. `DZF-CERT-2026-0001` generated atomically via `Counter.getNextSequence`).
     - `templateType`: `'digital_literacy' | 'reading_competition' | 'library_merit' | 'custom'`.
     - `title`: Award title (e.g. "Certificate of Completion", "Certificate of Achievement", "Certificate of Excellence").
     - `recipientName`: Recipient full name.
     - `recipientBarcode`: Optional link to registered patron barcode.
     - `recipientCohort`: Optional cohort name/type.
     - `recipientCategory`: Optional academic category (e.g. `SS1-3`, `JSS1-3`, `P4-6`, `P1-3`).
     - `awardDescription`: Formal achievement citation.
     - `issueDate`: Date of award.
     - `primarySignatory`: Name, title, and signature path.
     - `secondarySignatory`: Name, title, and signature path.
     - `goldSealText`: Embossed circular seal text.
     - `isRevoked`: Boolean flag.
     - `issuedBy`: Staff issuer name.
   - Atomic serial generation and batch issuance helpers:
     - Batch creation from Cohorts (pulling students with `receivedCertificate: true`).
     - Batch creation from Reading Competition sessions (pulling top podium ranks).
   - Public verification resolver by certificate code.

2. **Dual-Mode REST API Endpoints**:
   - `GET /api/certificates`: Authenticated route with search, template filter, and pagination.
   - `POST /api/certificates`: Authenticated route to create and persist a single certificate.
   - `POST /api/certificates/batch`: Authenticated route to batch issue certificates from cohorts or competitions.
   - `GET /api/certificates/[id]`: Authenticated route to fetch certificate details.
   - `GET /api/certificates/verify/[code]`: Public endpoint returning certificate authenticity metadata.

3. **Precision Vector Canvas & Vector Templates (`src/components/certificates/CertificateVectorCanvas.tsx`)**:
   - Pure scalable SVG canvas rendering at exact `viewBox="0 0 842.25 595.5"`.
   - Vector styling elements:
     - Ornate double border with classical corner rosettes.
     - Centered translucent watermark initial ("D").
     - Formal Foundation crest and header typography.
     - Award title and stylized presentation banner.
     - Calligraphic recipient name with decorative underline flourish.
     - Signatory lines with vector ink signature paths.
     - Embossed gold foil seal with dual ring borders, starburst perimeter, and draped ribbon tails.
     - Machine-readable certificate serial code and verification URL.
   - Presets for 3 core Foundation certificate types:
     - **Digital Literacy Academy**: Certified digital skills & ICT training completion.
     - **Reading Competition**: Academic reading contest podium and participation awards.
     - **Library Academic Merit**: Outstanding library patronage and book summary excellence.

4. **Multi-Format Export Pipeline**:
   - **Vector SVG Export**: Direct serialization and download of `.svg` file.
   - **300 DPI High-Res PNG Export**: Client-side rasterization via offscreen `<canvas>` with 3x scale factor (2526 × 1786 px).
   - **Direct Print-to-PDF**: CSS `@media print` with `@page { size: A4 landscape; margin: 0; }` enabling pixel-perfect browser printing and PDF generation without browser margins or headers.

5. **Certificate Studio Workspace & Public Verification Portal**:
   - Interactive Studio at `/certificates`:
     - Two-pane layout: Configuration Inspector on left, WYSIWYG live preview on right with zoom controls (Fit, 75%, 100%).
     - Fast patron, cohort, or competition autofill loader.
     - Customizer controls for title, citation, signatories, issue date, and seal text.
     - Batch generation drawer for issuing certificates to an entire cohort class or competition category with one click.
     - Certificate registry ledger tab with search, status filters, and reprint actions.
   - Public Verification Page at `/certificates/verify/[code]`:
     - Responsive certificate authenticity verification card with official Foundation confirmation badge, recipient details, and read-only certificate rendering.

6. **AppShell & Permissions Integration**:
   - Add 'Certificate Studio' navigation link under MANAGEMENT in `src/components/layout/AppShell.tsx`.
   - Update `src/lib/auth/rbac.ts` with `CERTIFICATE_ROLES` and `canManageCertificates`.
   - Update `src/middleware.ts` to allow `/certificates/verify` and `/api/certificates/verify` without login.

## Out of scope

- Physical PVC card printing (covered by patron thermal label printer in Feature 4).
- Headless Puppeteer server microservice (client-side 300 DPI PNG, SVG, and browser print-to-PDF provide instant zero-dependency high-resolution outputs).
- Blockchain-based credential anchoring (database verification codes provide immediate authenticity checking).

## Build loop

- `workflow.stepReview: "feature"` (one review packet after all build steps are complete).
- `workflow.checkpointCommits: "disabled"`.

## Build steps

- [x] 1. **Certificate Domain Model, Counter Sequence & Persistence Service** - Create `src/models/Certificate.ts` with validation and indexes. Create `src/lib/certificates/types.ts` and `src/lib/certificates/service.ts` with sequence numbering (`Counter.getNextSequence`), single & batch creation, cohort/competition loaders, and verification lookup. Update `src/lib/auth/rbac.ts` with certificate roles.
  - *Done when:* Typecheck passes with zero errors, certificates can be created with atomic serial sequence `DZF-CERT-2026-XXXX`, and batch issuance queries cohorts and competitions cleanly.
- [x] 2. **REST API Endpoints & Route Whitelisting** - Implement `src/app/api/certificates/route.ts`, `batch/route.ts`, `[id]/route.ts`, and `verify/[code]/route.ts`. Update `src/middleware.ts` to declare public certificate verification paths.
  - *Done when:* Staff can create and query certificates via REST API, batch endpoint generates multiple records with consecutive serial numbers, and public verification endpoint returns validity metadata without authentication.
- [x] 3. **Precision Vector Canvas, Ornaments & Export Pipeline** - Build `src/components/certificates/CertificateVectorCanvas.tsx` with Section 7.3.8 vector styling tokens: double classical borders, corner rosettes, watermark crest, typography layout, embossed gold foil seal with ribbons, and vector signature paths. Build export helpers for SVG download, 300 DPI PNG rasterization, and print-to-PDF stylesheets.
  - *Done when:* Certificate renders crisply at landscape A4 (842.25 × 595.5pt), SVG downloads cleanly, 300 DPI PNG exports without artifacts, and print preview formats exactly on landscape A4.
- [x] 4. **Certificate Studio Workspace & Public Verification Portal** - Build `/certificates` (`page.tsx` and `CertificateStudioClient.tsx`) with two-pane customization inspector, cohort/competition batch autofill, live preview scaling, export action bar, and history ledger. Build `/certificates/verify/[code]` (`page.tsx` and `VerifyCertificateClient.tsx`). Update `AppShell.tsx` navigation.
  - *Done when:* Staff can customize and preview certificates live, batch-issue for cohort students, download in all 3 export formats, view issued records in the ledger, and verify any issued code publicly.
- [x] 5. **Full System Verification & Build Validation** - Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
  - *Done when:* Typecheck, linter, and production Next.js build pass cleanly with zero errors.

## Files / areas

- `src/models/Certificate.ts` - Mongoose model for issued certificates with serial numbers, template types, and signatory metadata.
- `src/lib/certificates/types.ts` - Shared TypeScript interfaces for certificate templates, signatories, export options, and batch generation.
- `src/lib/certificates/service.ts` - Business logic for certificate creation, atomic numbering, cohort/competition batch queries, and verification.
- `src/lib/certificates/export.ts` - Client-side vector SVG download and high-resolution 300 DPI canvas rasterization utilities.
- `src/app/api/certificates/route.ts` - REST API for querying and creating certificates.
- `src/app/api/certificates/batch/route.ts` - REST API for batch issuing certificates from cohorts or competitions.
- `src/app/api/certificates/[id]/route.ts` - REST API for single certificate details.
- `src/app/api/certificates/verify/[code]/route.ts` - Public REST API for verifying certificate authenticity.
- `src/components/certificates/CertificateVectorCanvas.tsx` - Scalable vector SVG certificate component with classical borders, gold foil seal, and watermark crest.
- `src/app/certificates/page.tsx` - Server entry point for Certificate Studio.
- `src/app/certificates/CertificateStudioClient.tsx` - Interactive client studio with live WYSIWYG preview, inspector controls, and export bar.
- `src/app/certificates/verify/[code]/page.tsx` - Public verification route.
- `src/app/certificates/verify/[code]/VerifyCertificateClient.tsx` - Client component rendering verified certificate badge and authenticity report.
- `src/components/layout/AppShell.tsx` - Sidebar navigation link under MANAGEMENT.
- `src/lib/auth/rbac.ts` - Role permissions for certificate management.
- `src/middleware.ts` - Whitelist public certificate verification routes.

## Data / contracts

- **Aspect Ratio**: `842.25 × 595.5pt` (A4 landscape: 297mm × 210mm).
- **Serial Sequence Format**: `DZF-CERT-YYYY-XXXX` (e.g. `DZF-CERT-2026-0001`), using atomic MongoDB `$inc` via `Counter`.
- **Template Types**:
  - `'digital_literacy'`: "Certificate of Completion"
  - `'reading_competition'`: "Certificate of Achievement"
  - `'library_merit'`: "Certificate of Excellence"
  - `'custom'`: User-defined title and citation
- **Export Formats**:
  - SVG Vector (`image/svg+xml`)
  - PNG Raster (300 DPI, 2526 × 1786 px, `image/png`)
  - PDF Print (`@media print` landscape A4)
- **Certificate Verification Contract (`GET /api/certificates/verify/[code]`)**:
  ```json
  {
    "success": true,
    "data": {
      "isValid": true,
      "certificateCode": "DZF-CERT-2026-0001",
      "recipientName": "Ayegbokiki, Itunu",
      "title": "Certificate of Completion",
      "awardDescription": "For outstanding achievement in the Digital Skills & Office Suite Cohort...",
      "templateType": "digital_literacy",
      "issueDate": "2026-10-05T18:00:00.000Z",
      "primarySignatory": {
        "name": "Dr. T. Folorunso",
        "title": "Foundation Director"
      },
      "secondarySignatory": {
        "name": "Lead Instructor",
        "title": "Academy Lead"
      },
      "issuedBy": "Admin User",
      "isRevoked": false
    }
  }
  ```

## Testing

- Typecheck baseline: `npx tsc --noEmit`
- Linter baseline: `npm run lint`
- Production build: `npm run build`
- Functional verification:
  - Verify atomic sequence increment: consecutive certificate generations yield strictly unique, non-colliding serial numbers.
  - Verify SVG rendering: viewBox matches 842.25 × 595.5, text scales cleanly, and vector ornaments render without distortion.
  - Verify export pipeline: SVG file downloads with valid XML headers; canvas PNG renders at 300 DPI (2526 × 1786 px).
  - Verify public verification: accessing `/certificates/verify/DZF-CERT-2026-0001` unauthenticated resolves valid certificate data without 401 redirect, while non-existent codes display an invalid certificate alert.

## Notes for the AI

- Use Material UI v6 styled components and typography tokens. Strictly avoid Tailwind CSS.
- Keep the vector canvas pure SVG so that it renders identically in browser preview, SVG export, canvas rasterization, and PDF print preview.
- Ensure all print styles use `@page { size: landscape; margin: 0; }` and `@media print { ... }` so the certificate expands to fill the entire physical or virtual sheet without browser default headers/footers.
- Avoid placeholder images; generate vector ornament paths, seal starbursts, and signature paths mathematically in SVG.
