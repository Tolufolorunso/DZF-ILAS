# DZF-ILAS - Project Overview

<!-- blueprint:source-hash 48448e12e8c9a9235c000e3740acf2072e71ef950f4fa8650ab80814921792e0 -->

> Centralized internal staff workspace and REST API backend for the Dzuels Educational Foundation (DZF), managing academic library cataloging, patron identity, circulation, and academy engagement.

## Problem

The Dzuels Educational Foundation operates an academic library and learning center in Nigeria, managing 2,300+ catalog items, 670+ patrons, active book circulation, student digital literacy cohorts, reading competitions, and values publication. DZF-ILAS provides a unified Next.js web application and REST API backend. Phases 1–17 delivered cataloging, patron barcode identity, circulation gamification, Google Sheets sync, competition scoring, certificate studio, calendar ingestion, staff self-registration, Kanban workspace, circulation safety dialogs, 5-day loans, student promotion, daily audit stream with same-day undo, self-tasks, 30-day task archiving, SSE live streaming, Web Push, dynamic shell metrics, modernized TransComm editor, and admin governance center. Phase 18 hardens task creator governance (zero exceptions on archive/delete), restricts assignees strictly to active lane moves (`To Do`, `In Progress`, `Completed`), and prepares full Vercel serverless deployment readiness, database pooling resilience, and rock-solid production performance.

## Users & Role Hierarchy

Top-to-bottom institutional hierarchy:
1. **IMA (`ima`):** Institutional Oversight & International Management; can assign tasks to herself, Country Manager, Admin, and all staff.
2. **Country Manager (`country_manager`):** Executive national operations; can assign tasks to Admin and all subordinate staff.
3. **Super Administrator (`admin`):** Oversees website and operations; activates staff accounts, inspects daily action streams, undos same-day staff actions until midnight, and executes overrides.
4. **Assistant Administrator (`asst_admin`):** Operations support, circulation locks, patron/catalog management.
5. **ICT Officer (`ict`):** Technical operations, hardware scanners, system settings, patron and catalog management.
6. **Librarian (`librarian`):** Monograph cataloging, loan checkouts/returns/renewals, hold queues, webcam registration, thermal label printing.
7. **Intern / Staff (`intern`, `facility`, `cohort_lead`, `transcomm_author`):** Floor tasks, attendance marking, cohort rosters, personal task management, and editorial contributions.
8. **Patrons (Beneficiaries):** Students (Primary to Senior Secondary), Teachers, Staff, and Community Guests.

## Usage model

- **Scale & Performance:** 670+ registered patrons, 2,300+ catalog items, daily attendance batches, and real-time competition leaderboards.
- **Reachability & Trust:** Authenticated internal staff platform (`/dashboard/*`). Staff identities verified via JWT sessions. Public marketing/reading routes (`/`, `/transcomm`).
- **SEO & Search Indexing:** Strict privacy: only `/transcomm` and `/transcomm/*` are indexed (`index, follow`); all staff routes (`/dashboard/*`, `/auth/*`, `/api/*`, `/`) are `noindex, nofollow`.
- **Dual-Mode API Interoperability:** Consumed concurrently by Next.js web frontend (`ils_token` cookie) and Android mobile app (`Authorization: Bearer <token>`).
- **Hardware Integration:** Instant input for USB/Bluetooth barcode scanners; continuous 60mm × 40mm roll printing on Xprinter XP-365B thermal label printers via an isolated iframe print pipeline.
- **Task Governance:** Task deletion and archiving are strictly restricted to the original creator (`assignedBy.username`) with zero exceptions. Assignees are scoped strictly to active lane moves. Tasks in the archive for 30 days are automatically purged via MongoDB TTL indexing.
- **Vercel Serverless Hosting:** Built for Next.js App Router serverless execution on Vercel with global Edge routing, connection pooling guards, and resilient client error boundaries.

## Features

1. **Design System & UI Components** - Brand theme tokens (Maroon, Navy, Gold), layout shells, inputs, badges, and data tables.
2. **Domain Data Models & Database** - Cached MongoDB connection and Mongoose models with validation and compound indexes.
3. **Staff Dual-Mode Auth & REST API** - JWT sessions supporting web cookies and mobile bearer tokens with role guards.
4. **Patron Lifecycle & 60x40 Thermal Labels** - Webcam capture, Cloudinary upload, 8-digit barcodes, and 60x40mm thermal printing.
5. **Cataloging & Library Inventory** - Dewey Decimal book acquisition, author/publisher indexing, copy labels, and catalog search.
6. **Circulation Engine** - Barcode loan checkout, checkin, renewals, hold queues, overdue calculation, and audit ledgers.
7. **Book Summary Moderation & Gamification** - Patron summary submission, librarian moderation queue, and activity point crediting.
8. **Barcode Attendance Scanner** - Fast barcode attendance logging for daily library visitors and academy classes.
9. **Monthly Activity & Leaderboards** - Automated monthly score aggregation, tier badges, podium views, and leaderboard feed.
10. **Cohort Academy & Google Sheets Sync** - Cohort batch rosters and automated two-way Google Sheets synchronization.
11. **Reading Competition Scoring** - Competition setup across grade categories, judge scoring API, and real-time public leaderboard.
12. **Certificate Studio & Vector Pipeline** - Vector literacy and competition certificates with dynamic signatures and PDF/PNG export.
13. **Transcomm Values Knowledge Hub** - Editorial article publishing platform covering DRNICER values and public reading routes.
14. **Admin Control Center & Analytics** - Circulation emergency locks/overrides, requisitions, audit logs, and public statistics API.
15. **Global Shell & Skeleton Loading** - Full-width layout, high-contrast instructions, favicon, public Transcomm, and MUI Skeletons.
16. **Dashboard Route Reorganization** - Consolidated staff workspaces under /dashboard/* with 307 redirects and updated navigation.
17. **Patron Lifecycle & Dynamic Registration** - Passport thumbnails, student school/parent conditional fields, and strict RBAC.
18. **Circulation Caps & Gamification** - 4-book monthly student limit, competition tagging, and timely return incentive points.
19. **Catalog Acquisition Studio** - Dewey Decimal selector, real-time barcode copy preview, and safe monograph updates/deletion.
20. **School Directory & Deletion Safeguards** - 22 Ijero Ekiti schools dropdown, typed confirmation guards, and column sorting.
21. **Xprinter XP-365B Thermal Studio** - Zero-margin 60x40mm thermal label layout and date-range bulk continuous roll printing.
22. **Staff Tasks Kanban Board** - Task hierarchy (IMA -> Country Manager -> Admin -> Staff), active assignee dropdown, and Kanban board.
23. **Foundation Operational Calendar** - 12-month calendar matrix, PDF milestone extraction, and advance notification bell alerts.
24. **Staff Self-Registration & RBAC** - Inactive staff registration, admin activation queue, and top-to-bottom role navigation access.
25. **Isolated POS Thermal Printing** - Headless iframe print pipeline for Xprinter XP-365B guaranteeing clean roll previews.
26. **Operational Calendar CSV Engine** - CSV calendar milestone extraction, interactive review table, and /dashboard/calendar workspace.
27. **Platform Rebranding & Privacy** - Rebrand to DZF-ILAS, noindex privacy for internal routes, staff birthdates, and data cleanup.
28. **Workspace Navigation Reordering** - Sidebar reordering, notification deep-linking to /dashboard/tasks, and modal scroll fixes.
29. **Staff Task Workspace & Delegation** - Dedicated /dashboard/tasks route, private self-tasks, and group:all leadership delegation.
30. **Circulation Modals & Grade Promotion** - Return/renew confirmation dialogs, 5-day loan default, and annual Aug 31 grade promotion.
31. **Live Daily Action Stream & Same-Day Undo** - Live staff audit console at /dashboard/admin/daily-actions with midnight undo cutoff.
32. **Self-Tasks & Omnipotent Overrides** - Staff self-task creation, bidirectional Kanban moves/alerts, and Patron 360 database overrides.
33. **Task Archiving & Escalation Reminders** - 30-day auto-purged task archives, private/public scoping, and hourly/48-hr in-app alerts.
34. **Task Messages & Discussion Threading** - Chronological message notes and responses on tasks, author badges, and automated in-app notifications.
35. **Real-Time Streaming & Web Push Notifications** - Server-Sent Events (SSE) live bus (`/api/stream`), instant chat updates, in-app toast chimes, and browser Push API integration.
36. **Dynamic Shell Metrics & Literacy Attendance** - Live database shell badges, 1-click fast-track Literacy Class attendance mode, and 12 annual foundation event presets.
37. **TransComm Editorial Studio Modernization** - Enriched formatting toolbar (H1, P, Underline, Highlight), smart auto-continuing lists with Enter key, and split-pane live preview.
38. **Admin Self-Service & Broadcast Center** - Foundation reference data/preset manager, one-click JSON/CSV data backup/export, system-wide broadcast alerts, and data recalculation toolkit.
39. **Strict Task Creator Governance & Scoped Workflows** - Creator-only archive and delete enforcement with zero exceptions across UI and API, assignee restricted to active lane transitions, and 30-day automated TTL purge.
40. **Vercel Production Deployment Readiness & Performance Hardening** - Vercel configuration (`vercel.json`), serverless database pooling safeguards, index coverage audit, clean build verification, and UI error boundary protection.

## Data model

### User
- `_id` (ObjectId)
- `username` (string, unique, lowercase, trimmed)
- `name` (string, required)
- `password` (string, bcrypt hashed)
- `role` (enum: `'ima' | 'country_manager' | 'admin' | 'asst_admin' | 'ict' | 'librarian' | 'intern' | 'cohort_lead' | 'transcomm_author' | 'facility'`)
- `phone` (string, optional)
- `birthMonth` (number, optional, 1-12)
- `birthDay` (number, optional, 1-31)
- `active` (boolean, default: false)
- `createdAt` / `updatedAt` (Date)

### Patron
- `_id` (ObjectId)
- `barcode` (string, 8 digits, `YYYY` + 4-digit sequence, unique)
- `passportPhoto` (string, Cloudinary secure URL)
- `firstname`, `surname`, `middlename` (string)
- `patronType` (enum: `'student' | 'teacher' | 'staff' | 'guest'`)
- `gender` (enum: `'male' | 'female'`)
- `phone` (string, optional)
- `studentSchoolInfo` ({ schoolName, currentClass, schoolAddress })
- `parentInfo` ({ parentName, parentPhoneNumber: string (required), relationshipToPatron, parentEmail })
- `employerInfo` ({ employerName, schoolAddress })
- `points` (number, default: 0)
- `active` (boolean, default: true)
- `createdAt` / `updatedAt` (Date)

### Cataloging (Monograph)
- `_id` (ObjectId)
- `title` ({ mainTitle, subtitle })
- `author` ({ mainAuthor, additionalAuthors: string[] })
- `publicationInfo` ({ publisher, place, year })
- `classification` (string, Dewey Decimal, e.g. "800.718")
- `barcode` (string, unique accession barcode)
- `shelfLocation` (string)
- `copiesTotal` (number)
- `copiesAvailable` (number)
- `ISBN` (string, optional)
- `createdAt` / `updatedAt` (Date)

### Library (Circulation Loan)
- `_id` (ObjectId)
- `patronId` (ObjectId ref Patron)
- `bookId` (ObjectId ref Cataloging)
- `patronBarcode` (string)
- `bookBarcode` (string)
- `issueDate` (Date)
- `dueDate` (Date, default 5 days from issue)
- `returnDate` (Date, optional)
- `status` (enum: `'issued' | 'returned' | 'overdue' | 'renewed'`)
- `eventTitle` (string, optional, for reading competition loans)
- `pointsAwarded` (number: 3, 1, or 0)
- `renewalsCount` (number, default: 0)
- `createdAt` / `updatedAt` (Date)

### Task
- `_id` (ObjectId)
- `title` (string, required)
- `description` (string, optional)
- `dueDate` (Date, optional)
- `priority` (enum: `'low' | 'medium' | 'high'`)
- `status` (enum: `'todo' | 'inProgress' | 'completed' | 'archived'`)
- `assignedBy` ({ name: string, username: string })
- `assignedTo` ({ name: string, username: string })
- `targetGroup` (string, optional, e.g. `'all'`, `'librarian'`)
- `assignedByRole` (string, optional)
- `assignedToRole` (string, optional)
- `isSelfAssigned` (boolean, default: false)
- `isPrivate` (boolean, default: false)
- `archivedAt` (Date, optional, indexed with 30-day TTL)
- `inProgressAt` (Date, optional)
- `lastTodoRemindedAt` (Date, optional)
- `lastInProgressRemindedAt` (Date, optional)
- `comments: Array<{ commenter: { name: string, username: string }, commentDate: Date, commentText: string }>`
- `likes` (array)
- `createdAt` / `updatedAt` (Date)

### DailyAction (Reversible Staff Audit Log)
- `_id` (ObjectId)
- `actionType` (string, e.g. `'attendance_scan'`, `'book_checkout'`, `'book_return'`, `'patron_create'`, `'patron_update'`, `'record_delete'`)
- `performedBy` (string, username)
- `performedByRole` (string, user role)
- `targetEntity` (string, e.g. `'Library'`, `'Patron'`, `'Attendance'`, `'Cataloging'`)
- `targetId` (string)
- `reversiblePayload` (object, snapshot of pre-action state or reversible data)
- `isUndone` (boolean, default: false)
- `undoneAt` (Date, optional)
- `undoneBy` (string, optional)
- `dayTimestamp` (string, date key YYYY-MM-DD)
- `createdAt` (Date)

### Event (Operational Calendar)
- `_id` (ObjectId)
- `eventName` (string, required)
- `startDate` (Date, required)
- `endDate` (Date, optional)
- `academicYear` (string, e.g. "2026-2027")
- `participants` (string, optional)
- `focalPerson` (string, optional)
- `remarks` (string, optional)
- `targetAudience` (string, optional)
- `alertsSent` ({ stage30: boolean, stage14: boolean, stage7: boolean })
- `createdAt` / `updatedAt` (Date)

### Notification
- `_id` (ObjectId)
- `recipientUsername` (string, required, index)
- `senderUsername` (string, required)
- `type` (enum: `'task_assigned' | 'task_updated' | 'task_reminder' | 'calendar_milestone' | 'account_activated' | 'broadcast' | 'system'`)
- `title` (string, required)
- `message` (string, required)
- `link` (string, optional)
- `read` (boolean, default: false)
- `createdAt` / `updatedAt` (Date)

### FoundationPreset (Reference Data & Event Presets)
- `_id` (ObjectId)
- `category` (enum: `'annual_event' | 'school' | 'cohort_track'`)
- `name` (string, required)
- `targetMonth` (number, optional, 1-12)
- `description` (string, optional)
- `metadata` (object, optional)
- `createdAt` / `updatedAt` (Date)

## Tech Stack & Architecture

- **Next.js 16 (App Router):** Fast SSR, dynamic Route Handlers, and client React 19 components.
- **TypeScript:** Strict type checking across domain models, props, and API request/response contracts.
- **Material UI (`@mui/material`, `@mui/material-nextjs`):** Custom design system built on MUI primitives using Emotion engine.
- **MongoDB & Mongoose:** Document database with cached singleton connection pool, compound indexes, and 30-day TTL index on Task `archivedAt`.
- **Cloudinary:** Cloud storage for patron webcam photos and book covers.
- **Google Sheets API v4:** Service account integration for two-way cohort enrollment backups.
- **JsBarcode:** SVG-based barcode rendering for cards and item spine tags.
- **Thermal Print Engine:** Sandboxed headless iframe print pipeline targeting Xprinter XP-365B and 60mm × 40mm continuous rolls.
- **Server-Sent Events (SSE):** Real-time streaming pipeline (`/api/stream`) broadcasting task lifecycle, Kanban column shifts, and discussion notes.
- **Web Push Notifications & Audio:** HTML5 Browser Push API integration for background/desktop alerts and Web Audio synthetic chimes.

## Monetization

Not applicable. DZF-ILAS is a 100% internal non-profit educational and library management platform for the Dzuels Educational Foundation.

## UI/UX

- **Design Language:** Modern Academic SaaS / Digital Workspace.
- **Palette & Contrast:** Midnight Navy (`#0b1d2e`), Scholastic Navy (`#17324d`), Brand Maroon (`#6f1111`), Academic Gold (`#cca349`), WCAG AA compliant.
- **Layout Architecture:** Full-width header and footer bands on public `/` with 1200px centered body; dedicated sidebar on `/dashboard/*`.
- **Loading UX:** Next.js `loading.tsx` route skeletons using Material UI Skeleton components.
- **Core Routes:**
  - `/` - Public welcome board with system overview, rules, and live database stats
  - `/transcomm` & `/transcomm/[slug]` - Public DRNICER leadership knowledge hub (indexed by search engines)
  - `/auth/login` - Staff credential sign-in
  - `/auth/register` - Staff self-registration with birth month/day and pending admin activation
  - `/dashboard` - Dynamic counters, circulation stats, gender ratios, upcoming milestones
  - `/dashboard/tasks` - Dedicated staff task workspace with interactive 3-column Kanban board, live instant discussion chat, archive drawer, and creator-only archive/delete controls
  - `/dashboard/catalog` & `/dashboard/catalog/acquire` - Monograph inventory and acquisition studio
  - `/dashboard/patrons` & `/dashboard/patrons/register` - Patron directory, dynamic registration, Xprinter XP-365B bulk printing
  - `/dashboard/circulations` - Barcode loan transactions, checkout, return, holds, overdues, with return/renewal confirmation dialogs
  - `/dashboard/attendance` - Barcode scanner interface ("Attendant") with 1-click Literacy Class fast-track attendance studio
  - `/dashboard/leaderboard` - Activity metrics and patron leaderboard
  - `/dashboard/calendar` - Dedicated staff operational calendar matrix & agenda stream
  - `/dashboard/inventory` - Foundation asset inventory and equipment logs
  - `/dashboard/cohorts` - Digital literacy cohorts, student rosters, Google Sheets sync
  - `/dashboard/competitions` - Live competition judging and broadcast results
  - `/dashboard/certificates` - Vector certificate studio & export pipeline
  - `/dashboard/transcomm` & `/dashboard/transcomm/new` - Staff editorial management, modernized composer with rich toolbar, smart lists, and live preview
  - `/dashboard/admin` - Staff accounts, emergency circulation overrides, audit ledger, calendar tools, self-service presets, broadcast banner, and JSON/CSV backup/export
  - `/dashboard/admin/daily-actions` - Staff daily live activity stream & same-day reversible undo console (Admin only)

## Deployment

- **Hosting Target:** Vercel (Next.js serverless execution with Edge routing).
- **Configuration File:** `vercel.json` with security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options`) and caching directives.
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Health Check Path:** `/api/health/db`
- **Environment Variables:** `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`.
