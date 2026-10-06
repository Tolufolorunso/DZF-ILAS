# Project Plan: DZF-ILLS (Dzuels Integrated Library & Learning System)

> Ground-truth architecture, domain rules, and functional specifications for the Dzuels Educational Foundation (DZF) internal staff platform and Android API backend.

## 1. Problem - What problem are we solving?

Dzuels Educational Foundation manages dual institutional operations in Nigeria:
1. Physical academic library cataloging, patron barcode identity, and circulation tracking (2,300+ catalog items, 670+ patrons, active book circulation).
2. Community and digital academy operations: cohort attendance, student reading competitions, gamified book summary scoring, staff leadership publications (TRANSCOMM), and certificate generation.

The legacy application suffered from fragmented auth patterns, unindexed database collections, state desynchronization during circulation, and edge runtime failures. 

DZF-ILLS is a ground-up rewrite delivering:
- A calm, robust, high-performance web workspace for staff.
- A standardized, secure REST API designed for dual consumption by the web app and the upcoming Android mobile app.
- A refined, user-friendly operational workflow for Phase 5 with modern skeleton screen loading, public leadership knowledge sharing, strict RBAC, and gamified circulation incentives.

## 2. Users - Who is this for?

- **Librarians & Desk Staff:** Monograph cataloging (Dewey Decimal), circulation checkouts/returns/renewals, hold queues, book updates/deletions, and patron registration with webcam passport capture.
- **Mobile / Android Users (Staff & Proctors):** Floor attendants and proctors using Android devices for fast camera barcode scanning, attendance check-ins ("Attendant"), and roving circulation.
- **Cohort Leads & Instructors:** Run digital literacy sessions, record student attendance via barcode scanners, manage student rosters, and sync to Google Sheets.
- **Competition Judges & Evaluators:** Grade reading competitions with multi-criteria rubrics and monitor live scored leaderboards across 4 school categories.
- **Transcomm Authors & Public Readers:** Staff draft and publish DRNICER values articles; students, educators, and the public read leadership articles freely without login.
- **Super Administrators & ICT Officers:** Manage staff accounts, edit/delete patrons and catalog items, execute emergency circulation overrides, inspect audit ledgers, and trigger cloud backups.
- **Patrons (Beneficiaries):** Students (Primary to Senior Secondary), Teachers, Staff, and Community Guests.

## 3. Features & Phased Delivery

### Phase 1: Foundations (Completed)
- **Design System & Reusable UI Components:** Centralized Material UI theme (`src/theme/`), DZF brand tokens (Maroon `#6f1111`, Scholastic Navy `#17324d`, Academic Gold `#cca349`), buttons, inputs, typography, badges, stat cards, and data tables.
- **Domain Data Models & DB Infrastructure:** Complete TypeScript Mongoose models with validation, compound indexes, and connection pooling for all 15 production models.
- **Dual-Mode Staff Auth & RBAC API:** Session authentication supporting both HTTP-only cookies (`ils_token`) and `Authorization: Bearer <token>` headers.

### Phase 2: Core Library Operations (Completed)
- **Patron Lifecycle & 60x40mm Thermal Barcode Studio:** Registration with webcam photo capture & Cloudinary upload, 8-digit barcode sequence, and 60mm x 40mm thermal label printing studio.
- **Cataloging & Library Inventory:** Book acquisition, Dewey Decimal classification, physical copy barcodes, shelf location mapping, mobile search API.
- **Circulation Engine:** Barcode-driven loan checkout, checkin/return processing, renewals, hold reservations, overdue penalization, and transaction logs.

### Phase 3: Academy Operations & Gamified Engagement (Completed)
- **Book Summaries & Moderation:** Patron summary submission, staff moderation queue, feedback scoring (+2 to +10 points), and activity point crediting.
- **Barcode Attendance Scanner:** Scanner-friendly attendance logging for daily library visitors and digital academy classes with mobile Android scanner support.
- **Monthly Activity & Leaderboards:** Point aggregation engine, ranking tiers, celebratory podium views, public stats endpoint.
- **Cohort Academy & Google Sheets Sync:** Digital literacy rosters, batch attendance, automated Google Sheets cloud backups.
- **Reading Competitions & Live Scoring:** Category setups (SS1-3, JSS1-3, P1-6), mobile judge scoring endpoints, live broadcast leaderboards.

### Phase 4: Creative Studio, Publishing & Administration (Completed)
- **Certificate Studio:** Vector template rendering, dynamic student/score injection, PDF/PNG high-res export pipeline.
- **Transcomm Knowledge Hub:** Editorial article publishing platform covering DRNICER values, leadership insights, rich text editing, and mobile read API.
- **Admin Control Center:** Emergency circulation locks/overrides, staff requisition approvals, internal operational tasks, audit ledgers, and public statistics API (`/api/public/stats`).

### Phase 5: Operational Refinements, Routing & Enhanced Circulation Workflows (New)
- **Global Shell Modernization, Skeleton Loading, Public Transcomm & Brand Favicon:**
  - Full-width canvas for Header and Footer on `/`; main content constrained to centered `max-width: 1200px`.
  - Redesigned Operating Instructions button with high-contrast, prominent DZF styling.
  - Official foundation favicon in `<head>` and `/public`.
  - Public reader access to `/transcomm` and `/transcomm/[slug]` without authentication.
  - Global modern Skeleton Screen loader (`loading.tsx` and MUI Skeleton components) replacing blank transitions.
  - Sidebar navigation updated: rename "Barcode Scanner" to "Attendant".
- **Dashboard Route Reorganization & Backward-Compatible Redirects:**
  - Migrate all internal staff workspaces under `/dashboard/*` (`/dashboard/patrons`, `/dashboard/catalog`, `/dashboard/circulations`, `/dashboard/attendance`, `/dashboard/cohorts`, `/dashboard/competitions`, `/dashboard/certificates`, `/dashboard/admin`).
  - Automatic 307 redirects from legacy paths (`/patrons` -> `/dashboard/patrons`, etc.) preserving bookmarks.
  - Updated AppShell navigation highlighting and breadcrumbs.
- **Patron Lifecycle Enhancements, Dynamic Registration & Strict RBAC:**
  - Patron list displays passport photo thumbnails with fallback initials.
  - Conditional registration form driven by `patronType`:
    - Students require School details (School Name, Class/Grade) and Parent/Guardian information (Full Name, Phone, Relationship, Address).
    - Teachers/Staff/Guests display relevant department/organization fields and omit parent information.
  - Strict RBAC: Edit patron restricted to `admin`, `asst_admin`, and `ict`; Delete patron restricted to `admin` only (with loan check safeguards).
- **Circulation Gamification, Monthly Student Loan Caps & Competition Event Tagging:**
  - Checkout inputs: Patron Barcode, Item Barcode, Due Days, and optional Event Title (for reading competitions).
  - Monthly loan cap: Students can borrow a maximum of 4 books per calendar month.
  - Timely return gamification points awarded upon check-in:
    - On or before due date: +3 activity points.
    - 1 to 2 days after due date: +1 activity point.
    - 3+ days after due date: 0 points (overdue status).
  - Enhanced Holds queue, Overdues tracking, and Renewal actions.
- **Catalog Acquisition Studio & Monograph Lifecycle Management:**
  - Redesigned Book Acquisition studio (`/dashboard/catalog/acquire`) with Dewey Decimal selector, live barcode copy label preview, and batch copy generation.
  - Staff capabilities to edit and delete books, protected by active loan checks.

## 4. Data - What are we storing?

All 15 core production entities plus Phase 5 model extensions:
1. `User` (Staff accounts, hashed passwords, roles: admin, asst_admin, librarian, ict, cohort_lead, transcomm_author)
2. `Patron` (Barcode ID, passport photo URL, full name, patron type: student/teacher/staff/guest, class/grade, status, points, parentGuardian: { name, phone, relationship, address }, schoolInfo: { schoolName, classGrade })
3. `Cataloging` (Accession numbers, titles, authors, Dewey Decimal class, ISBN, total/available copies, shelf location)
4. `Library` (Circulation transactions: patronId, bookId, issueDate, dueDate, returnDate, renewalsCount, status, eventTitle (optional), pointsAwarded (0/1/3))
5. `Inventory` (Physical condition records, copy acquisition records, barcode labels)
6. `BookSummary` (PatronId, bookId, summaryText, keyLearnings, status, pointsAwarded)
7. `Attendance` (PatronId, patronBarcode, date, sessionType, cohortId, scanTimestamp)
8. `Cohort` & `CohortGroup` (Batch code, program title, startDate, endDate, student roster, active state)
9. `Competition` (Title, date, grade categories, rounds, criteria weights, patron scores, rankings)
10. `MonthlyActivity` (PatronId, monthYear, summaryPoints, attendancePoints, competitionPoints, circulationPoints, totalScore, rank)
11. `TranscommArticle` (Title, slug, content, excerpt, author, DRNICER value category, publishedAt)
12. `Requisition` (Staff resource requests, department, estimatedCost, approvalStatus)
13. `Task` (Staff operational tasks, priority, dueDate, assignee, status)
14. `Event` (Calendar events, library workshops, target audience)
15. `SystemSetting` & `AuditLog` (Singleton governance settings & tamper-evident audit ledger)

## 5. Tech Stack & Architecture

- **Web Framework:** Next.js 16 (App Router), React 19, TypeScript (strict mode)
- **Routing Strategy:** Public marketing/reading routes (`/`, `/transcomm`, `/transcomm/[slug]`, `/auth/login`) + Authenticated Staff Workspace (`/dashboard/*`)
- **Loading State:** Next.js `loading.tsx` route skeletons using Material UI Skeleton components with brand shimmer
- **API Architecture:** RESTful Next.js Route Handlers (`src/app/api/...`) with standardized JSON envelopes
- **Auth Strategy:** Dual authentication: HTTP-only cookies (`ils_token`) for browser + `Authorization: Bearer <token>` for Android
- **UI & Styling:** Material UI (`@mui/material`), `@emotion/react`, `@emotion/styled`
- **Design Tokens:** DZF Semantic Palette (`#6f1111` Maroon, `#17324d` Navy, `#cca349` Gold)
- **Database:** MongoDB via Mongoose (with cached connection pooling and indexes)

## 6. UI/UX Direction

- **Homepage (`/`):** Full-width header and footer bands; main body canvas constrained to `max-width: 1200px`.
- **Skeleton Loaders:** Content skeletons matching exact card, table, and list geometries during asynchronous navigation.
- **Navigation:** Midnight Navy (`#0b1d2e`) sidebar, "Attendant" attendance navigation link, active item Gold indicators.
- **Patron Thumbnails:** 40px circular and rounded avatars displaying passport photos with initials fallback in table views.
- **Zero Mock Policy:** All metrics, tables, and lists query active production collections.
