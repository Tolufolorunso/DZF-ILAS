# DZF-ILLS - Project Overview

<!-- blueprint:source-hash 46af433319e5d9a00f3af9c670a3711c47c47f85388fc4fe3c74b6e520fee14d -->

> Centralized internal staff workspace and REST API backend for the Dzuels Educational Foundation (DZF), managing academic library cataloging, patron identity, circulation, and academy engagement.

## Problem

The Dzuels Educational Foundation operates a high-volume academic library and learning center in Nigeria, managing 2,300+ catalog items, 670+ patrons, active book circulation, student digital literacy cohorts, reading competitions, and values publication. The legacy system suffered from fragmented auth patterns, unindexed database schemas, transaction desynchronization during circulations, and edge runtime failures. DZF-ILLS provides a clean, unified, resilient Next.js web application and first-class REST API backend for an upcoming companion Android mobile client. Phase 5 refines operational UX with modern skeleton screen loading, public leadership knowledge sharing, strict RBAC, and gamified circulation incentives.

## Users

- **Librarians & Desk Staff:** Monograph cataloging (Dewey Decimal), circulation checkouts/returns/renewals, hold reservations, overdue penalization, book updates/deletions, patron registration with webcam passport photo capture.
- **Mobile / Android Users (Staff & Proctors):** Floor attendants and proctors using Android devices for fast camera barcode scanning, attendance check-ins ("Attendant"), and roving circulation verification.
- **Cohort Leads & Instructors:** Run digital literacy cohorts, mark daily attendance with hardware scanners, manage student rosters, and sync records to Google Sheets.
- **Competition Judges & Evaluators:** Grade multi-category student reading competitions (SS1-3, JSS1-3, P1-6) using criteria rubrics with live leaderboard broadcast.
- **Transcomm Authors & Public Readers:** Staff publish and review DRNICER leadership values articles; students, educators, and the public read leadership articles freely without login.
- **Super Administrators & ICT Officers:** Staff RBAC accounts, patron edit/delete authority, emergency circulation overrides, system audit logs, and cloud synchronizations.
- **Patrons (Beneficiaries):** Students (Primary to Senior Secondary), Teachers, Staff, and Community Guests.

## Usage model

- **Scale & Performance:** 670+ registered patrons, 2,300+ catalog items, daily attendance batches, and real-time competition leaderboards.
- **Reachability & Trust:** Authenticated internal staff platform (`/dashboard/*`). Staff identities verified via JWT sessions. Public marketing/reading routes (`/`, `/transcomm`).
- **Dual-Mode API Interoperability:** Consumed concurrently by the Next.js web frontend (HTTP-only `ils_token` cookies) and the Android mobile app (`Authorization: Bearer <token>`).
- **Hardware Integration:** Instant input support for physical USB/Bluetooth barcode scanners with automatic submit triggers.

## Features

1. **Design System & Reusable UI Components** - Centralized Material UI theme (`src/theme/`) with DZF semantic brand tokens (Maroon `#6f1111`, Scholastic Navy `#17324d`, Academic Gold `#cca349`), buttons, inputs, barcode scanner auto-submit input, headers, typography, status badges, and data tables.
2. **Complete Domain Data Models & Database Infrastructure** - Cached MongoDB connection pool (`src/lib/db.ts`) and TypeScript Mongoose models with validation, compound indexes, and relationship helpers for all 15 production schemas.
3. **Staff Authentication, Session Management & Dual-Mode REST API** - Staff login, bcrypt password hashing, JWT generation, RBAC guards, and dual-auth middleware (cookies for web, bearer tokens for Android).
4. **Patron Lifecycle, Photo Capture & 60x40 Thermal Barcode Studio (Web & API)** - Patron registration with webcam photo capture & Cloudinary upload, barcode numbering sequence (4-digit current registration year + 4-digit incremental sequence continuing from the last registered member across the system, e.g. member #583 `20250583` -> next member in 2026 is `20260584`, validated to 8 numeric digits), printable 60mm x 40mm thermal label paper studio (Organisation on top, barcode + number at center, patron name at bottom with uniform vertical spacing), cohort enrollment privilege restricted to admin or delegated ICT staff, zero placeholders (querying live DB), and mobile patron lookup/search REST endpoints.
5. **Cataloging & Library Inventory Management (Web & API)** - Book acquisition wizard, Dewey Decimal classification, author/publisher indexing, barcode copy labeling, shelf location mapping, and catalog search REST endpoints.
6. **Circulation Engine (Checkout, Return, Holds & Overdues API & Web)** - Barcode-driven loan checkout, checkin/return processing, renewal limits, hold queue reservations, overdue calculation, and circulation audit logs.
7. **Book Summary Moderation & Gamification Scoring (Web & API)** - Patron summary submission, librarian moderation queue, feedback scoring (+2 to +10 points), and activity point crediting.
8. **Barcode Attendance Scanner & Class Session Tracking (Web & API)** - High-speed scanner attendance logging for daily library visitors and digital academy classes with mobile Android scanner support.
9. **Monthly Activity Aggregator & Leaderboard System (Web & API)** - Automated monthly score calculation, patron rank tier badges (Champion, Runner-up, Top 10), celebratory podium leaderboard views, and leaderboard REST feed.
10. **Cohort Academy & Google Sheets Cloud Synchronization** - Cohort batch creation, student enrollment rosters, and automated two-way Google Sheets synchronization via Google service account credentials.
11. **Reading Competition Results & Live Scoring Engine (Web & API)** - Competition session setup across grade categories (SS1-3, JSS1-3, P1-6), judge scoring API for mobile evaluations, and real-time public leaderboard display.
12. **Certificate Studio & Vector Export Pipeline** - Digital literacy and competition certificate generation with vector templates, dynamic signature/gold seal placement, and high-resolution PDF/PNG exports.
13. **Transcomm Values & Leadership Knowledge Hub (Web & API)** - Editorial article publishing platform covering DRNICER values, leadership insights, rich text editing, and read API for mobile apps.
14. **Admin Control Center, Overrides & System Analytics** - Emergency circulation locks/overrides, staff requisition approvals, internal operational tasks, audit ledgers, and public statistics API (`/api/public/stats`).
15. **Global Shell Modernization, Skeleton Loading, Public Transcomm & Brand Favicon** - Full-width header and footer canvases on `/` with 1200px centered body, high-contrast Operating Instructions button redesign, official DZF favicon integration, public access for `/transcomm` article reading, sidebar link renamed to "Attendant", and modern MUI Skeleton loaders across route transitions.
16. **Dashboard Route Reorganization & Backward-Compatible Redirects** - Consolidate internal staff workspaces under `/dashboard/*` (`/dashboard/patrons`, `/dashboard/catalog`, `/dashboard/circulations`, `/dashboard/attendance`, `/dashboard/cohorts`, `/dashboard/competitions`, `/dashboard/certificates`, `/dashboard/admin`), with automatic 307 redirects from legacy paths and updated AppShell navigation state.
17. **Patron Lifecycle Enhancements, Dynamic Registration & Strict RBAC** - Display passport photo thumbnails in patron lists, dynamic registration form conditioning on `patronType` (school details and parent/guardian info for students), Mongoose schema updates, and strict RBAC allowing only `admin`/`ict` to edit and `admin` to delete.
18. **Circulation Gamification, Monthly Student Loan Caps & Competition Event Tagging** - Checkout workflow supporting optional Event Title and custom due days, hard limit of 4 borrowed books per month for students, timely return activity points on check-in (+3 on/before due date, +1 within 2 days late, 0 after), and enhanced Holds/Overdues/Renewal controls.
19. **Catalog Acquisition Studio & Monograph Lifecycle Management** - Redesigned book acquisition studio with Dewey Decimal selector, real-time barcode copy preview, and staff book update and deletion capabilities with active loan protection.

## Data model

### User
- `_id` (ObjectId)
- `username` (string, unique, lowercase, trimmed)
- `name` (string, required)
- `password` (string, bcrypt hashed)
- `role` (enum: `'admin' | 'asst_admin' | 'librarian' | 'ict' | 'cohort_lead' | 'transcomm_author'`)
- `phone` (string, optional)
- `active` (boolean, default: true)
- `createdAt`, `updatedAt` (Date)

### Patron
- `_id` (ObjectId)
- `barcode` (string, unique, indexed, regex `/^\d{8}$/`, format: `YYYY` + 4-digit sequence, e.g. "20260001", "20230001")
- `firstname`, `surname` (string, required)
- `gender` (enum: `'male' | 'female'`)
- `patronType` (enum: `'student' | 'teacher' | 'staff' | 'guest'`, indexed)
- `class` (string, optional, e.g. "SS2", "P5")
- `active` (boolean, default: true, indexed)
- `points` (number, default: 0)
- `image_url` (object: `{ secure_url: string, public_id: string }`)
- `parentGuardian` (object, optional: `{ name: string, phone: string, relationship: string, address: string }`)
- `schoolInfo` (object, optional: `{ schoolName: string, classGrade: string }`)
- `createdAt`, `updatedAt` (Date)

### Cataloging
- `_id` (ObjectId)
- `barcode` (string, unique, indexed)
- `title` (string, required, indexed)
- `subtitle` (string)
- `author` (string, required, indexed)
- `classification` (string, Dewey Decimal, e.g. "490", "800", indexed)
- `controlNumber` (string, e.g. "490.15")
- `isbn` (string, optional)
- `library` (string, default: "AAoJ")
- `isCheckedOut` (boolean, default: false, indexed)
- `copiesTotal` (number, default: 1)
- `copiesAvailable` (number, default: 1)
- `shelfLocation` (string, optional)
- `createdAt`, `updatedAt` (Date)

### Library (Circulation Loan)
- `_id` (ObjectId)
- `patronId` (ObjectId, ref: Patron, indexed)
- `patronBarcode` (string, indexed)
- `bookId` (ObjectId, ref: Cataloging, indexed)
- `bookBarcode` (string, indexed)
- `bookTitle` (string)
- `issueDate` (Date, default: Date.now)
- `dueDate` (Date, required, indexed)
- `returnDate` (Date, optional)
- `renewalsCount` (number, default: 0)
- `status` (enum: `'borrowed' | 'returned' | 'overdue' | 'lost'`, indexed)
- `eventTitle` (string, optional)
- `pointsAwarded` (number, default: 0)
- `issuedBy`, `receivedBy` (ObjectId, ref: User)
- `createdAt`, `updatedAt` (Date)

### Inventory
- `_id` (ObjectId)
- `bookId` (ObjectId, ref: Cataloging, indexed)
- `itemBarcode` (string, unique, indexed)
- `condition` (enum: `'new' | 'good' | 'fair' | 'poor' | 'damaged'`)
- `status` (enum: `'available' | 'checked_out' | 'maintenance' | 'lost'`)
- `acquisitionDate` (Date)

### BookSummary
- `_id` (ObjectId)
- `patronId` (ObjectId, ref: Patron, indexed)
- `bookId` (ObjectId, ref: Cataloging, indexed)
- `summaryText` (string, required)
- `keyLearnings` (string)
- `status` (enum: `'pending' | 'approved' | 'rejected'`, default: 'pending', indexed)
- `pointsAwarded` (number, default: 0)
- `reviewedBy` (ObjectId, ref: User)
- `reviewFeedback` (string)
- `reviewedAt` (Date)
- `createdAt`, `updatedAt` (Date)

### Attendance
- `_id` (ObjectId)
- `patronId` (ObjectId, ref: Patron, indexed)
- `patronBarcode` (string, indexed)
- `patronName` (string)
- `classType` (enum: `'library' | 'cohort'`, indexed)
- `className` (string, e.g. "cohort-1", "general-reading")
- `classDate` (string, YYYY-MM-DD, indexed)
- `attendanceTime` (Date, default: Date.now)
- `markedBy` (ObjectId, ref: User)
- `points` (number, default: 1)
- `cohortId` (ObjectId, ref: Cohort, optional)

### Cohort & CohortGroup
- `_id` (ObjectId)
- `cohortType` (string, e.g. "cohort-1", "cohort-2", indexed)
- `displayName` (string)
- `description` (string)
- `active` (boolean, default: true)
- `students` (array of subdocuments: `{ patronId, barcode, name, gender, enrolledAt, completed, googleSheetsRow }`)
- `googleSpreadsheetId` (string, optional)
- `createdAt`, `updatedAt` (Date)

### Competition
- `_id` (ObjectId)
- `title` (string, required)
- `sessionKey` (string, unique, e.g. "reading-competition-2026")
- `categories` (array: `'SS1-SS3' | 'JSS1-JSS3' | 'P4-P6' | 'P1-P3'`)
- `participants` (array of `{ patronId, barcode, name, category, totalScore, rank, booksRead }`)
- `isPublished` (boolean, default: false)
- `publishedAt` (Date)
- `createdAt`, `updatedAt` (Date)

### MonthlyActivity
- `_id` (ObjectId)
- `patronId` (ObjectId, ref: Patron, indexed)
- `monthYear` (string, format: "YYYY-MM", indexed)
- `summaryPoints` (number, default: 0)
- `attendancePoints` (number, default: 0)
- `competitionPoints` (number, default: 0)
- `circulationPoints` (number, default: 0)
- `totalScore` (number, default: 0, indexed)
- `rank` (number, optional)
- Compound Index: `{ patronId: 1, monthYear: 1 }` (unique)

### TranscommArticle
- `_id` (ObjectId)
- `title` (string, required)
- `slug` (string, unique, indexed)
- `content` (string, required)
- `excerpt` (string)
- `author` (string, required)
- `category` (enum: `'Leadership' | 'Values' | 'Technology' | 'Community'`, indexed)
- `drnicerValue` (enum: `'Discipline' | 'Respect' | 'Nobility' | 'Integrity' | 'Compassion' | 'Excellence' | 'Responsibility'`)
- `published` (boolean, default: false)
- `publishedAt` (Date)

### SystemSetting & AuditLog
- `SystemSetting`: `{ emergencyCirculationLock: boolean, circulationLockReason?: string, lockedBy?: string, lockedAt?: Date }`
- `AuditLog`: `{ action: string, performedBy: string, performedByRole: string, targetEntity: string, targetId?: string, details: Mixed, createdAt: Date }`

### Requisition, Task, Event
- `Requisition`: `{ title, description, department, estimatedCost, status: 'pending'|'approved'|'rejected', requestedBy }`
- `Task`: `{ title, description, priority: 'low'|'medium'|'high', dueDate, assignee, completed: boolean }`
- `Event`: `{ title, description, eventDate, targetAudience, location }`

## Tech stack

- **Next.js 16 (App Router) & React 19:** Server Components by default, Client Components for interactive UI, Route Handlers (`src/app/api/...`) for REST endpoints.
- **TypeScript:** Strict type checking across domain models, props, and API request/response contracts.
- **Material UI (`@mui/material`, `@mui/material-nextjs`):** Custom design system built on MUI primitives using Emotion engine.
- **MongoDB & Mongoose:** Document database with cached singleton connection pool and compound indexes.
- **Cloudinary:** Cloud storage for patron registration passport photos.
- **Google Sheets API v4:** Service account integration for two-way cohort enrollment backups.
- **JsBarcode:** SVG-based barcode rendering for cards and item spine tags.

## Monetization

Not applicable. DZF-ILLS is a 100% internal non-profit educational platform for the Dzuels Educational Foundation.

## UI/UX

- **Design Language:** Modern Academic SaaS / Digital Workspace.
- **Palette & Contrast:** Midnight Navy (`#0b1d2e`), Scholastic Navy (`#17324d`), Brand Maroon (`#6f1111`), Academic Gold (`#cca349`), crisp high-contrast text (`#ffffff`, `#f1f5f9`), meeting WCAG AA standards.
- **Official Branding:** Uses official Foundation logo from `/images/logo.png` and favicons from `/public/`.
- **Layout Architecture:** Full-width header and footer bands on public `/` with 1200px centered body; dedicated `<Box component="nav">` sidebar allocation on `/dashboard/*` preventing content overlap.
- **Loading UX:** Next.js `loading.tsx` route skeletons using Material UI Skeleton components with brand shimmer.
- **Data Policy:** Zero mock placeholders. All statistics, tables, and lists query active production collections (`dzuelsDB` with 583 patrons, 1,353 monographs, 121 cohorts, and 16 staff).
- **Core Routes:**
  - `/` - Public institutional welcome board with system overview, rules, bulletins, staff birthdays, and live database stats
  - `/transcomm` & `/transcomm/[slug]` - Public DRNICER leadership knowledge hub
  - `/auth/login` - Staff credential sign-in
  - `/dashboard` - Summary counters, circulation stats, gender ratios
  - `/dashboard/catalog` & `/dashboard/catalog/acquire` - Book inventory directory and acquisition studio
  - `/dashboard/patrons` & `/dashboard/patrons/register` - Patron directory and dynamic registration
  - `/dashboard/circulations` - Barcode loan transactions, checkout, return, holds, overdues
  - `/dashboard/attendance` - Barcode scanner interface ("Attendant")
  - `/dashboard/leaderboard` - Activity metrics and patron leaderboard
  - `/dashboard/cohorts` - Digital literacy cohorts, student rosters, Google Sheets sync
  - `/dashboard/competitions` - Live competition judging and broadcast results
  - `/dashboard/certificates` - Vector certificate studio & export pipeline
  - `/dashboard/transcomm` - Staff editorial management for DRNICER articles
  - `/dashboard/admin` - Staff RBAC accounts, emergency circulation overrides, audit ledger

## Deployment

- **Hosting Target:** Vercel or Node.js standalone runtime with zero cold-start DB pooling.
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Environment Variables:** `MONGODB_URI_LOCAL`, `LOCALURL`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_PROJECT_ID`, `GOOGLE_PRIVATE_KEY`.
