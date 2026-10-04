# Project Plan: DZF-ILLS (Dzuels Integrated Library & Learning System)

> Ground-truth architecture, domain rules, and functional specifications for the clean rebuild of the Dzuels Educational Foundation (DZF) internal staff platform and Android API backend.

## 1. Problem - What problem are we solving?

Dzuels Educational Foundation manages dual institutional operations in Nigeria:
1. Physical academic library cataloging, patron barcode identity, and circulation tracking (2,300+ catalog items, 670+ patrons, 140+ active loans).
2. Community and digital academy operations: cohort attendance, student reading competitions, gamified book summary scoring, staff leadership publications (TRANSCOMM), and certificate generation.

The legacy application suffered from fragmented auth patterns, unindexed database collections, state desynchronization during circulation, and edge runtime failures. 

DZF-ILLS is a ground-up rewrite delivering:
- A calm, robust, high-performance web workspace for staff.
- A standardized, secure REST API designed for dual consumption by the web app and the upcoming Android mobile app.

## 2. Users - Who is this for?

- **Librarians & Desk Staff:** Handle item cataloging (Dewey Decimal), circulation checkouts/returns/renewals, hold queues, and patron registration with webcam passport capture.
- **Mobile / Android Users (Staff & Proctors):** Use Android devices on the library floor or in classrooms for barcode scanning, attendance check-ins, and roving circulation.
- **Cohort Leads & Instructors:** Run digital literacy sessions, record student attendance via barcode scanners, and manage student rosters.
- **Competition Judges & Evaluators:** Grade reading competitions with multi-criteria rubrics and monitor live scored leaderboards across 4 school categories.
- **Transcomm Authors & Managers:** Draft, review, and publish leadership/values articles (DRNICER).
- **Super Administrators:** Manage staff accounts/RBAC permissions, execute emergency circulation overrides, inspect audit logs, and trigger Google Sheets cloud backups.
- **Patrons (Beneficiaries):** Students (Primary to Senior Secondary), Teachers, Staff, and Community Guests.

## 3. Features - What does the MVP need?

### Phase 1: Foundations
- **Design System & Reusable UI Components:** Centralized Material UI theme (`src/theme/`), DZF semantic brand tokens (Maroon `#6f1111`, Scholastic Navy `#17324d`, Academic Gold `#cca349`), buttons, inputs (including barcode scanner auto-submit input), typography, headers, badges, stat cards, and data tables.
- **Domain Data Models & DB Infrastructure:** Complete TypeScript Mongoose models with validation, compound indexes, and connection pooling for all 15 production models.
- **Dual-Mode Staff Auth & RBAC API:** Session authentication supporting both HTTP-only cookies (Web) and `Authorization: Bearer <token>` headers (Android), role-based route/action guards.

### Phase 2: Core Library Operations
- **Patron Lifecycle & Barcode Identity API & Web:** Registration with photo capture & Cloudinary upload, printable 85mm x 54mm barcode ID cards, patron search endpoints.
- **Cataloging & Library Inventory API & Web:** Book acquisition wizard, Dewey Decimal classification, physical copy barcodes, shelf location mapping, mobile-friendly search API.
- **Circulation Engine API & Web:** Barcode-driven loan checkout, checkin/return processing, renewals, hold reservations, overdue penalization, and transaction logs.

### Phase 3: Academy Operations & Gamified Engagement
- **Book Summaries & Moderation API & Web:** Patron summary submission, staff moderation queue, feedback scoring (+2 to +10 points), and activity point crediting.
- **Barcode Attendance Scanner API & Web:** Scanner-friendly endpoints for daily library visitors and digital academy classes with instant validation for web and Android clients.
- **Monthly Activity & Leaderboards API & Web:** Point aggregation engine, ranking tiers, celebratory podium views, public stats endpoint.
- **Cohort Academy & Google Sheets Sync:** Digital literacy student rosters, batch attendance, automated Google Sheets cloud backups.
- **Reading Competitions & Live Scoring API & Web:** Category setups (SS1-3, JSS1-3, P1-6), mobile judge scoring endpoints, live broadcast leaderboards.

### Phase 4: Creative Studio, Publishing & Administration
- **Certificate Studio:** Vector template rendering, dynamic student/score injection, PDF/PNG high-res export pipeline.
- **Transcomm Knowledge Hub API & Web:** Editorial article publishing platform covering DRNICER values, leadership insights, rich text editing, and mobile read API.
- **Admin Control Center:** Emergency circulation locks/overrides, staff requisition approvals, internal operational tasks, audit ledgers, and public statistics API.

## 4. Data - What are we storing?

All 15 production domain entities:
1. `User` (Staff accounts, hashed passwords, roles: admin, librarian, cohort_lead, transcomm_author, active status, phone)
2. `Patron` (Barcode ID, passport photo URL, full name, patron type: student/teacher/staff/guest, class/grade, status, points)
3. `Cataloging` (Accession numbers, titles, authors, Dewey Decimal class, ISBN, total/available copies, shelf location)
4. `Library` (Circulation transactions: patronId, bookId, issueDate, dueDate, returnDate, renewalsCount, status)
5. `Inventory` (Physical condition records, copy acquisition records, barcode labels)
6. `BookSummary` (PatronId, bookId, summaryText, keyLearnings, status: pending/approved/rejected, pointsAwarded)
7. `Attendance` (PatronId, patronBarcode, date, sessionType, cohortId, scanTimestamp)
8. `Cohort` & `CohortGroup` (Batch code, program title, startDate, endDate, student roster, active state)
9. `Competition` (Title, date, grade categories, rounds, criteria weights, patron scores, rankings)
10. `MonthlyActivity` (PatronId, monthYear, summaryPoints, attendancePoints, competitionPoints, totalScore, rank)
11. `TranscommArticle` (Title, slug, content, excerpt, author, DRNICER value category, publishedAt)
12. `Requisition` (Staff resource requests, department, estimatedCost, approvalStatus)
13. `Task` (Staff operational tasks, priority, dueDate, assignee, status)
14. `Event` (Calendar events, library workshops, target audience)

## 5. Tech Stack & Interoperability

- **Web Framework:** Next.js 16 (App Router), React 19, TypeScript (strict mode)
- **API Architecture:** RESTful Next.js Route Handlers (`src/app/api/...`) with standardized JSON envelopes
- **Auth Strategy:** Dual authentication: HTTP-only cookies (`ils_token`) for browser + `Authorization: Bearer <token>` for Android
- **UI & Styling:** Material UI (`@mui/material`, `@mui/material-nextjs`), `@emotion/react`, `@emotion/styled`
- **Design Tokens:** DZF Semantic Palette (`#6f1111` Maroon, `#17324d` Navy, `#cca349` Gold) from `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md`
- **Database:** MongoDB via Mongoose (with cached connection pooling and connection-string fallback)
- **External Services:**
  - Cloudinary (Patron passport photo storage)
  - Google Sheets API (v4 service account cloud backup for cohorts)
  - JsBarcode / SVG Barcode rendering engine
  - Canvas / PDFKit for vector certificate exports

## 6. UI/UX Direction

Follows `design.md` and Section 7 of the specification:
- **Design Language:** Modern Academic SaaS / Digital Workspace.
- **Aesthetic:** Calm, trustworthy, high information density, clean typography (Geist / Inter).
- **Red Lines:** No Tailwind CSS, no frivolous animations, no decorative gradients except designated podium surfaces.
- **List Views:** Custom status badges (Available, Checked Out, Overdue, Approved, Pending, Active, Inactive).

## 7. Deployment & Environment

- **Target Environments:** Node.js standalone / Vercel deployment with MongoDB Atlas or local MongoDB.
- **Key Environment Variables:** `MONGODB_URI_LOCAL`, `LOCALURL`, `JWT_SECRET`, `CLOUDINARY_*`, `GOOGLE_PROJECT_ID`, `GOOGLE_PRIVATE_KEY`.
