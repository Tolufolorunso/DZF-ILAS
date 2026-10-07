# Feature: DZF-ILAS Platform Rebranding, SEO Privacy Rules, Staff Birthdays & Data Cleanup

**From build-plan:** feature 27
**Build attempt:** 1
**Branch:** feature/dzf-ilas-platform-rebranding-seo-privacy-rules-staff-birthdays-and-data-cleanup
**Status:** verified

## Goal

Rebrand the entire platform to **DZF-ILAS** (*Dzuels Integrated Library & Administrative System*), configure search engine robots privacy rules ensuring strictly `/transcomm` is indexed while all other routes are non-searchable (`noindex, nofollow`), add staff birth month & day (month and day only, no year) to staff registration and directory, and eliminate hardcoded mock numbers and calendar event fallbacks so all views query live MongoDB collections with clean empty states.

## In scope

1. **Global Platform Rebranding (to DZF-ILAS)**:
   - System Name: Set to **Dzuels Integrated Library & Administrative System** (**DZF-ILAS**).
   - Global UI & Shell:
     - `src/components/layout/AppShell.tsx`: Update sidebar brand heading to `DZF-ILAS`, subtitle to `Library & Administration`, and aria-labels.
     - `src/components/transcomm/TranscommPublicHeader.tsx`: Update brand title to `DZF-ILAS`.
     - `src/components/catalog/ThermalBookLabel.tsx`: Update label header to `ILAS • Library Book Spine & Cover Label`.
     - `src/components/admin/StaffActivationQueue.tsx`: Update notification copy to `DZF-ILAS workspace`.
   - Public Landing & Auth Pages:
     - `src/app/page.tsx` & `src/app/layout.tsx`: Update HTML titles to `DZF-ILAS | Dzuels Integrated Library & Administrative System`.
     - `src/app/HomePageClient.tsx`: Update top navigation logo text, hero title ("Welcome to Dzuels Integrated Library & Administrative System"), description, and footer credits.
     - `src/app/auth/login/page.tsx`: Update subtitle to `Integrated Library & Administrative System`.
     - `src/app/auth/register/page.tsx`: Update card title and branding.
   - Staff Workspace Pages:
     - `src/app/dashboard/layout.tsx` & `src/app/dashboard/page.tsx`: Update metadata title and description.
     - `src/app/dashboard/DashboardClient.tsx`: Update welcome banner description to `Dzuels Integrated Library & Administrative System central workspace`.
     - `src/app/dashboard/admin/page.tsx`: Update title to `Admin Control Center | DZF-ILAS`.
     - `src/app/dashboard/patrons/page.tsx` & `src/app/dashboard/patrons/register/page.tsx`: Update metadata titles.
     - `src/app/api/admin/users/[id]/activate/route.ts`: Update activation notification message to `DZF-ILAS workspace`.

2. **Strict SEO & Search Indexing Privacy Rules**:
   - `src/app/robots.ts`: Create Next.js MetadataRoute robots handler:
     - User-agent `*`:
       - Allow: `/transcomm`, `/transcomm/*`
       - Disallow: `/`
   - `src/app/layout.tsx`: Add default global metadata `robots`:
     - `{ index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } }`
   - `src/app/transcomm/layout.tsx`: Override metadata `robots`:
     - `{ index: true, follow: true, googleBot: { index: true, follow: true } }`
   - Guarantees only DRNICER leadership articles are discovered by search engine bots, protecting all internal staff workspaces, attendance counters, catalog management, and administrative records.

3. **Staff Birth Month & Day (Month and Day Only)**:
   - `src/models/User.ts`:
     - Add `birthMonth?: number;` (1-12)
     - Add `birthDay?: number;` (1-31)
     - Maintain existing optional `dateOfBirth?: Date;` for backward compatibility.
   - `src/app/api/auth/register/route.ts`:
     - Accept optional `birthMonth` and `birthDay` in request payload.
     - Validate numeric ranges: `birthMonth` (1–12) and `birthDay` (1–31, with month-length validation).
     - Persist `birthMonth` and `birthDay` into MongoDB `User` document.
   - `src/app/auth/register/page.tsx`:
     - Add side-by-side dropdown selectors for **Birth Month** (January to December) and **Birth Day** (1 to 31) with helpful caption: *"Month and day only — used for foundation birthday celebrations"*.
     - Reset and validate day options based on the chosen month (e.g. February max 29, April/June/Sept/Nov max 30).
   - `src/components/admin/StaffActivationQueue.tsx`:
     - Add `birthMonth?: number; birthDay?: number;` to `IStaffUser`.
     - Display a Birthday badge/chip (e.g., `🎂 Oct 12`) in the staff table and pending activation dialog so administrators can view staff birthdays.
   - `src/app/page.tsx`:
     - Update staff birthday mapping on public welcome board to check `s.birthMonth` and `s.birthDay`, highlighting celebrating staff ("Celebrating Today!") and upcoming birthdays cleanly.

4. **Purge Hardcoded Data & Live Database Integration**:
   - `src/app/dashboard/DashboardClient.tsx`:
     - Remove hardcoded vital statistics (`"674"`, `"2,342"`, `"148"`, `"56"`).
     - Query live system statistics from `/api/public/stats` on mount, displaying real database counts for Patrons, Books, Active Loans, and Today's Attendance with clean loading shimmer and empty states.
   - `src/app/page.tsx`:
     - Remove fallback defaults (`1353`, `583`, `121`, `16`) from database metrics assignment, displaying real database counts.
   - `src/app/api/admin/events/route.ts`:
     - Parse `searchParams.get('academicYear')` and pass `academicYear` into `listEvents({ academicYear, limit })` so `/api/admin/events?academicYear=2027` retrieves exact session milestones rather than unconstrained records.
   - Operational Calendar & Views:
     - Ensure empty calendar states display clean guidance with zero fake mock fixtures.

## Out of scope

- Changing Patron dateOfBirth format (patrons store full DOB with birth year for student/school identity validation).
- Altering Google Sheets sync schema or Android barcode scanner protocols.
- Removing production seed credentials helper (`/api/auth/seed`) used for initial developer/admin account provisioning.

## Build loop

- **Review Cadence:** Feature (`workflow.stepReview: "feature"`). All steps build continuously; review packet presented at end of feature.
- **Checkpoint Commits:** Disabled (`workflow.checkpointCommits: "disabled"`).
- **Verification:** `node ./node_modules/typescript/bin/tsc --noEmit` and targeted automated verification script.

## Build steps

- [x] Step 1: **Enforce Strict SEO Privacy & Robots Rules (`robots.ts` & Metadata)**
  - Create `src/app/robots.ts` exporting `robots()` allowing `/transcomm` and disallowing `/`.
  - Update `src/app/layout.tsx` to set root `robots: { index: false, follow: false }`.
  - Create/update `src/app/transcomm/layout.tsx` to override `robots: { index: true, follow: true }`.
  - *Done when:* `node ./node_modules/typescript/bin/tsc --noEmit` passes and HTTP inspection confirms `/robots.txt` disallows `/` while allowing `/transcomm`, and root layout tags include `noindex, nofollow`.

- [x] Step 2: **User Model Enrichment & Staff Birth Month/Day Registration**
  - Update `src/models/User.ts` adding `birthMonth?: number` and `birthDay?: number`.
  - Update `src/app/api/auth/register/route.ts` to receive, validate, and store `birthMonth` and `birthDay`.
  - Update `src/app/auth/register/page.tsx` adding Month and Day dropdowns with validation.
  - Update `src/components/admin/StaffActivationQueue.tsx` to display birthday chips for registered staff.
  - Update `src/app/page.tsx` to read `birthMonth` and `birthDay` when checking for celebrating staff.
  - *Done when:* `node ./node_modules/typescript/bin/tsc --noEmit` passes and a test script registers a staff member with birth month/day, confirming MongoDB persists and returns the values in user queries.

- [x] Step 3: **Purge Hardcoded Data & Connect Live Stats**
  - Update `src/app/dashboard/DashboardClient.tsx` to fetch and render live counts from `/api/public/stats` (patrons, books, loans, attendance) instead of hardcoded numbers.
  - Update `src/app/page.tsx` to eliminate fallback default numbers (`1353`, `583`, etc.).
  - Update `src/app/api/admin/events/route.ts` to parse `academicYear` query parameter and pass to `listEvents`.
  - *Done when:* `node ./node_modules/typescript/bin/tsc --noEmit` passes and `DashboardClient.tsx` displays live database metrics with clean empty states.

- [x] Step 4: **Global Platform Rebranding to DZF-ILAS**
  - Replace all occurrences of legacy naming with `DZF-ILAS` across UI headers, footers, page titles, navigation, and badges.
  - Replace `Dzuels Integrated Library & Learning System` with `Dzuels Integrated Library & Administrative System`.
  - Replace `Integrated Library & Learning System` with `Integrated Library & Administrative System`.
  - Update thermal book label header to `ILAS`.
  - *Done when:* `node ./node_modules/typescript/bin/tsc --noEmit` passes and a repository-wide search confirms all user-facing branding reflects `DZF-ILAS`.

- [x] Step 5: **End-to-End Verification & Integration Test**
  - Run full TypeScript compilation (`node ./node_modules/typescript/bin/tsc --noEmit`).
  - Run comprehensive verification script verifying robots endpoint output, staff registration with month/day, admin staff display, live stats endpoint, and brand copy consistency.
  - *Done when:* All checks exit with code 0 and zero lint or type errors.

## Files / areas

- `src/app/robots.ts` - New Next.js MetadataRoute robots configuration.
- `src/app/layout.tsx` - Root layout with strict default `noindex, nofollow` metadata and `DZF-ILAS` title.
- `src/app/transcomm/layout.tsx` - Public knowledge hub layout with `index, follow` override.
- `src/models/User.ts` - Enriched with `birthMonth` and `birthDay`.
- `src/app/api/auth/register/route.ts` - Accept, validate, and persist `birthMonth` and `birthDay`.
- `src/app/auth/register/page.tsx` - Staff registration form with Birth Month and Day dropdowns.
- `src/components/admin/StaffActivationQueue.tsx` - Staff management table displaying birthday badges.
- `src/app/page.tsx` - Public welcome board reading `birthMonth`/`birthDay` and live DB counts without fallbacks.
- `src/app/HomePageClient.tsx` - Rebranded hero, navigation, and footer text to DZF-ILAS.
- `src/app/dashboard/DashboardClient.tsx` - Connect vital stats cards to live API and rebrand welcome banner.
- `src/app/api/admin/events/route.ts` - Support `academicYear` query filter.
- `src/components/layout/AppShell.tsx` - Rebrand navigation header to DZF-ILAS / Library & Administration.
- `src/components/transcomm/TranscommPublicHeader.tsx` - Rebrand header title to DZF-ILAS.
- `src/components/catalog/ThermalBookLabel.tsx` - Rebrand label title to ILAS.
- `src/app/auth/login/page.tsx` - Rebrand login subtitle to Integrated Library & Administrative System.
- `src/app/dashboard/layout.tsx` & `src/app/dashboard/admin/page.tsx` - Rebrand metadata titles.

## Data / contracts

- **User Model (`src/models/User.ts`):**
  ```ts
  birthMonth?: number; // 1 to 12
  birthDay?: number;   // 1 to 31
  ```
- **Registration Payload (`POST /api/auth/register`):**
  ```json
  {
    "name": "Oluwaseun Adeleke",
    "username": "oadeleke",
    "password": "Password@123",
    "phone": "08012345678",
    "requestedRole": "librarian",
    "birthMonth": 10,
    "birthDay": 12
  }
  ```
- **Robots Route (`GET /robots.txt`):**
  ```text
  User-Agent: *
  Allow: /transcomm
  Allow: /transcomm/
  Disallow: /
  ```

## Testing

- Typecheck verification: `node ./node_modules/typescript/bin/tsc --noEmit`.
- Automated Node test script:
  - Verify `robots` route returns correct disallow `/` and allow `/transcomm`.
  - Verify `User` registration with `birthMonth` and `birthDay` saves and returns data via `GET /api/admin/users`.
  - Verify `/api/public/stats` returns live numbers and `DashboardClient` renders real counts.
  - Verify `/api/admin/events?academicYear=2027` filters by academic year.
  - Verify no lingering legacy references remain in active UI components.

## Notes for the AI

- Follow strict zero AI attribution policy: no `Co-Authored-By` or AI tool signatures in commits or PRs.
- Staff birthdate requires ONLY month and day — never prompt for or store birth year for staff.
- Ensure only `/transcomm` and its subpaths are indexed by search engines. All other paths must be strictly `noindex, nofollow`.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":12351,"specSha256":"f83a799ccd661453dcd20e8a73e32785e3d1a9e05ab86d9565ee1defe7ba8762","branch":"refs/heads/feature/dzf-ilas-platform-rebranding-seo-privacy-rules-staff-birthdays-and-data-cleanup","head":"9195f4a1d8e4afe8e7589b19571e38a9a3b75a02","baseRef":"refs/heads/main","baseCommit":"9195f4a1d8e4afe8e7589b19571e38a9a3b75a02","sourceTree":"465b7f4719b1834a7ea623480a1d2f3a2e0dfe5d","absentOptional":[]} -->
