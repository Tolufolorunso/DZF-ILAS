# DZF-ILLS - Project Overview

<!-- blueprint:source-hash 868ecc7026860440c039acfe0c5bcdaf72b91a4844b8a66192007ad732862dd1 -->

> Centralized internal staff workspace and REST API backend for the Dzuels Educational Foundation (DZF), managing academic library cataloging, patron identity, circulation, and academy engagement.

## Problem

The Dzuels Educational Foundation operates a high-volume academic library and learning center in Nigeria, managing 2,300+ catalog items, 670+ patrons, active book circulation, student digital literacy cohorts, reading competitions, and values publication. The legacy system suffered from fragmented auth patterns, unindexed database schemas, transaction desynchronization during circulations, and edge runtime failures. DZF-ILLS provides a clean, unified Next.js web application and REST API backend for an upcoming companion Android mobile client. Phase 5 delivered shell modernizations, `/dashboard/*` reorganization, dynamic registration, monthly loan caps, and catalog acquisition studios. Phase 6 refined patron workflows with an Ijero Ekiti school directory, typed deletion security guards, interactive column sorting, and 60×40mm thermal bulk printing. Phase 7 introduces operational staff task governance (Kanban board, role-restricted assignment, notification bell alerts), a yearly foundation operational calendar with PDF ingestion and multi-stage alerts (30-day, 14-day, 7-day), staff self-registration with Admin-Only activation, top-to-bottom role hierarchy access control, and an isolated POS thermal label print engine.

## Users & Role Hierarchy

Top-to-bottom institutional hierarchy:
1. **IMA (`ima`):** Institutional Oversight & International Management; can assign tasks to herself, Country Manager, Admin, and all staff.
2. **Country Manager (`country_manager`):** Executive national operations; can assign tasks to Admin and all subordinate staff.
3. **Super Administrator (`admin`):** Oversees the website and operational workflows; solely authorized to activate pending staff accounts and perform system-wide administrative overrides. Can assign tasks to himself and subordinates.
4. **Assistant Administrator (`asst_admin`):** Operations support, circulation locks, patron/catalog management.
5. **ICT Officer (`ict`):** Technical operations, hardware scanners, system settings, patron and catalog management.
6. **Librarian (`librarian`):** Monograph cataloging, loan checkouts/returns/renewals, hold queues, webcam registration, thermal label printing.
7. **Intern / Staff (`intern`, `facility`, `cohort_lead`, `transcomm_author`):** Floor tasks, attendance marking, cohort rosters, and editorial contributions.
8. **Patrons (Beneficiaries):** Students (Primary to Senior Secondary), Teachers, Staff, and Community Guests.

## Usage model

- **Scale & Performance:** 670+ registered patrons, 2,300+ catalog items, daily attendance batches, and real-time competition leaderboards.
- **Reachability & Trust:** Authenticated internal staff platform (`/dashboard/*`). Staff identities verified via JWT sessions. Public marketing/reading routes (`/`, `/transcomm`).
- **Dual-Mode API Interoperability:** Consumed concurrently by the Next.js web frontend (HTTP-only `ils_token` cookies) and the Android mobile app (`Authorization: Bearer <token>`).
- **Hardware Integration:** Instant input support for physical USB/Bluetooth barcode scanners with automatic submit triggers; continuous 60mm × 40mm roll printing on Xprinter XP-365B thermal label printers via an isolated print pipeline.

## Features

1. **Design System & Reusable UI Components** - Material UI theme (`src/theme/`) with DZF tokens (Maroon `#6f1111`, Navy `#17324d`, Gold `#cca349`), buttons, inputs, barcode scanner input, headers, badges, and data tables.
2. **Complete Domain Data Models & Database Infrastructure** - Cached MongoDB connection pool (`src/lib/db.ts`) and TypeScript Mongoose models with validation, compound indexes, and relationship helpers for all 15 production schemas.
3. **Staff Authentication, Session Management & Dual-Mode REST API** - Staff login, bcrypt password hashing, JWT generation, RBAC guards, and dual-auth middleware (cookies for web, bearer tokens for Android).
4. **Patron Lifecycle, Photo Capture & 60x40 Thermal Barcode Studio** - Webcam photo capture & Cloudinary upload, 8-digit barcode sequence (`YYYY` + 4 digits), 60×40mm thermal label layout, and mobile search endpoints.
5. **Cataloging & Library Inventory Management** - Book acquisition wizard, Dewey Decimal classification, author/publisher indexing, barcode copy labeling, and catalog search REST endpoints.
6. **Circulation Engine** - Barcode-driven loan checkout, checkin/return processing, renewal limits, hold reservations, overdue calculation, and circulation audit logs.
7. **Book Summary Moderation & Gamification Scoring** - Patron summary submission, librarian moderation queue, feedback scoring (+2 to +10 points), and activity point crediting.
8. **Barcode Attendance Scanner & Class Session Tracking** - High-speed scanner attendance logging for daily library visitors and digital academy classes with mobile Android scanner support.
9. **Monthly Activity Aggregator & Leaderboard System** - Automated monthly score calculation, patron rank tier badges, celebratory podium leaderboard views, and leaderboard REST feed.
10. **Cohort Academy & Google Sheets Cloud Synchronization** - Cohort batch creation, student enrollment rosters, and automated two-way Google Sheets synchronization.
11. **Reading Competition Results & Live Scoring Engine** - Competition session setup across grade categories (SS1-3, JSS1-3, P1-6), judge scoring API, and real-time public leaderboard display.
12. **Certificate Studio & Vector Export Pipeline** - Digital literacy and competition certificate generation with vector templates, dynamic signature/gold seal placement, and high-resolution PDF/PNG exports.
13. **Transcomm Values & Leadership Knowledge Hub** - Editorial article publishing platform covering DRNICER values, leadership insights, rich text editing, and read API for mobile apps.
14. **Admin Control Center, Overrides & System Analytics** - Emergency circulation locks/overrides, staff requisition approvals, internal operational tasks, audit ledgers, and public statistics API (`/api/public/stats`).
15. **Global Shell Modernization, Skeleton Loading, Public Transcomm & Brand Favicon** - Full-width header and footer canvases on `/` with 1200px centered body, high-contrast Operating Instructions button, official DZF favicon, public access for `/transcomm`, sidebar link renamed to "Attendant", and modern MUI Skeleton loaders.
16. **Dashboard Route Reorganization & Backward-Compatible Redirects** - Consolidate staff workspaces under `/dashboard/*` with automatic 307 redirects from legacy paths and updated AppShell navigation state.
17. **Patron Lifecycle Enhancements, Dynamic Registration & Strict RBAC** - Passport photo thumbnails in patron lists, dynamic registration form conditioning on `patronType` (school details and parent info for students), and strict RBAC.
18. **Circulation Gamification, Monthly Student Loan Caps & Competition Event Tagging** - Checkout workflow supporting optional Event Title, 4-book monthly limit for students, timely return activity points on check-in (+3 on/before due date, +1 within 2 days late, 0 after), and enhanced Holds/Overdues controls.
19. **Catalog Acquisition Studio & Monograph Lifecycle Management** - Redesigned book acquisition studio with Dewey Decimal selector, real-time barcode copy preview, and staff book update/deletion capabilities with active loan protection.
20. **Patron Registration Streamlining, School Directory, Deletion Safeguards & Table Sorting** - Predefined 22 Ijero Ekiti schools dropdown with auto-address fill, typed confirmation security guards (`DELETE`) for patron/book deletions, and interactive column sorting.
21. **Xprinter XP-365B Thermal Barcode Studio & Date-Range Bulk Print Pipeline** - Standard 60mm × 40mm thermal label format (Top: "Dzuels Foundation", Middle: barcode, Bottom: "Name: <firstname>, <Surname>") with zero browser margin CSS and date-range bulk continuous roll printing in `/dashboard/patrons`.
22. **Operational Staff Tasks Enrichment & Drag-and-Drop Kanban Board** - Task assignment role hierarchy (IMA -> Country Manager -> Admin -> Staff), active staff DB assignee dropdown (individual or role group) with 'Assigned By' attribution, 3-column drag-and-drop Kanban workflow (To Do, In Progress, Completed), task CRUD, and real-time AppShell notification bell alerts.
23. **Foundation Operational Calendar, PDF Ingestion & Multi-Stage Alert Pipeline** - Yearly 12-month calendar matrix (2027 ready), yearly calendar PDF upload with automated milestone extraction and interactive edit/confirmation table, and multi-stage advance alerts (1 month, 2 weeks, 1 week) delivered via the header notification bell.
24. **Staff Self-Registration, Admin-Only Activation & Role Hierarchy Access Control** - Staff registration page (`/auth/register`) creating inactive accounts, strict Admin-Only account activation dashboard, and full top-to-bottom role access enforcement (IMA -> Country Manager -> Admin -> Asst Admin -> ICT -> Librarian -> Intern) filtering AppShell navigation and securing routes.
25. **Isolated POS Thermal Label Printing Engine** - Overhaul thermal print execution using an isolated hidden iframe pipeline for Xprinter XP-365B and thermal roll printers, eliminating Next.js root wrapper CSS hiding bugs and guaranteeing 100% visible print previews.

## Data model

### User
- `_id` (ObjectId)
- `username` (string, unique, lowercase, trimmed)
- `name` (string, required)
- `password` (string, bcrypt hashed)
- `role` (enum: `'ima' | 'country_manager' | 'admin' | 'asst_admin' | 'ict' | 'librarian' | 'intern' | 'cohort_lead' | 'transcomm_author' | 'facility'`)
- `phone` (string, optional)
- `active` (boolean, default: false for new registrations, true for activated staff)
- `createdAt`, `updatedAt` (Date)

### Task
- `_id` (ObjectId)
- `title` (string, required)
- `description` (string, optional)
- `priority` (enum: `'low' | 'medium' | 'high'`, default: 'medium')
- `status` (enum: `'todo' | 'in_progress' | 'completed'`, default: 'todo', indexed)
- `dueDate` (Date, optional)
- `assignedTo` (string, username or role group identifier, required, indexed)
- `assignedBy` (string, username of assigner, required)
- `createdAt`, `updatedAt` (Date)

### OperationalEvent / CalendarEvent
- `_id` (ObjectId)
- `title` (string, required)
- `description` (string, optional)
- `startDate` (Date, required, indexed)
- `endDate` (Date, optional)
- `category` (enum: `'academy' | 'library' | 'board' | 'inspection' | 'holiday' | 'competition' | 'general'`, indexed)
- `year` (number, e.g. 2026, 2027, indexed)
- `sourcePdfUrl` (string, optional)
- `alertHorizons` (object: `{ oneMonthNotified: boolean, twoWeeksNotified: boolean, oneWeekNotified: boolean }`)
- `createdBy` (string)
- `createdAt`, `updatedAt` (Date)

### Notification
- `_id` (ObjectId)
- `recipientUsername` (string, required, indexed)
- `senderUsername` (string, required)
- `type` (enum: `'task_assigned' | 'task_updated' | 'calendar_milestone' | 'account_pending' | 'system'`)
- `title` (string, required)
- `message` (string, required)
- `link` (string, optional)
- `read` (boolean, default: false, indexed)
- `createdAt` (Date, default: Date.now)

### Patron
- `_id` (ObjectId)
- `barcode` (string, unique, indexed, regex `/^\d{8}$/`, format: `YYYY` + 4-digit sequence)
- `firstname`, `surname` (string, required)
- `gender` (enum: `'male' | 'female'`)
- `patronType` (enum: `'student' | 'teacher' | 'staff' | 'guest'`, indexed)
- `class` (string, optional)
- `active` (boolean, default: true, indexed)
- `points` (number, default: 0)
- `image_url` (object: `{ secure_url: string, public_id: string }`)
- `parentGuardian` (object, optional: `{ name: string, phone: string, relationship: string, address: string }`)
- `schoolInfo` (object, optional: `{ schoolName: string, classGrade: string, schoolAddress?: string }`)
- `createdAt`, `updatedAt` (Date)

### Cataloging & Inventory
- `Cataloging`: `{ barcode, title, subtitle, author, classification (Dewey), controlNumber, isbn, isCheckedOut, copiesTotal, copiesAvailable, shelfLocation }`
- `Inventory`: `{ bookId, itemBarcode, condition, status, acquisitionDate }`

### Circulation (Library Loan)
- `Library`: `{ patronId, patronBarcode, bookId, bookBarcode, bookTitle, issueDate, dueDate, returnDate, renewalsCount, status: 'borrowed'|'returned'|'overdue'|'lost', eventTitle, pointsAwarded, issuedBy, receivedBy }`

### Academic Operations
- `BookSummary`: `{ patronId, bookId, summaryText, keyLearnings, status, pointsAwarded, reviewedBy, reviewFeedback, reviewedAt }`
- `Attendance`: `{ patronId, patronBarcode, patronName, classType, className, classDate, attendanceTime, markedBy, points, cohortId }`
- `Cohort` & `CohortGroup`: `{ cohortType, displayName, description, active, students, googleSpreadsheetId }`
- `Competition`: `{ title, sessionKey, categories, participants, isPublished, publishedAt }`
- `MonthlyActivity`: `{ patronId, monthYear, summaryPoints, attendancePoints, competitionPoints, circulationPoints, totalScore, rank }`
- `TranscommArticle`: `{ title, slug, content, excerpt, author, category, drnicerValue, published, publishedAt }`

### Governance & System
- `SystemSetting`: `{ emergencyCirculationLock, circulationLockReason, lockedBy, lockedAt }`
- `AuditLog`: `{ action, performedBy, performedByRole, targetEntity, targetId, details, createdAt }`
- `Requisition`: `{ title, description, department, estimatedCost, status, requestedBy }`

## Tech stack

- **Next.js 16 (App Router) & React 19:** Server Components by default, Client Components for interactive UI, Route Handlers (`src/app/api/...`) for REST endpoints.
- **TypeScript:** Strict type checking across domain models, props, and API request/response contracts.
- **Material UI (`@mui/material`, `@mui/material-nextjs`):** Custom design system built on MUI primitives using Emotion engine.
- **MongoDB & Mongoose:** Document database with cached singleton connection pool and compound indexes.
- **Cloudinary:** Cloud storage for patron webcam photos and book covers.
- **Google Sheets API v4:** Service account integration for two-way cohort enrollment backups.
- **JsBarcode:** SVG-based barcode rendering for cards and item spine tags.

## Monetization

Not applicable. DZF-ILLS is a 100% internal non-profit educational platform for the Dzuels Educational Foundation.

## UI/UX

- **Design Language:** Modern Academic SaaS / Digital Workspace.
- **Palette & Contrast:** Midnight Navy (`#0b1d2e`), Scholastic Navy (`#17324d`), Brand Maroon (`#6f1111`), Academic Gold (`#cca349`), crisp high-contrast text (`#ffffff`, `#f1f5f9`), meeting WCAG AA standards.
- **Layout Architecture:** Full-width header and footer bands on public `/` with 1200px centered body; dedicated `<Box component="nav">` sidebar allocation on `/dashboard/*`.
- **Loading UX:** Next.js `loading.tsx` route skeletons using Material UI Skeleton components with brand shimmer.
- **Core Routes:**
  - `/` - Public welcome board with system overview, rules, staff birthdays, and live database stats
  - `/transcomm` & `/transcomm/[slug]` - Public DRNICER leadership knowledge hub
  - `/auth/login` - Staff credential sign-in
  - `/auth/register` - Staff self-registration with pending admin activation
  - `/dashboard` - Summary counters, circulation stats, gender ratios, upcoming milestones
  - `/dashboard/catalog` & `/dashboard/catalog/acquire` - Monograph inventory and acquisition studio
  - `/dashboard/patrons` & `/dashboard/patrons/register` - Patron directory, dynamic registration, Xprinter XP-365B bulk printing
  - `/dashboard/circulations` - Barcode loan transactions, checkout, return, holds, overdues
  - `/dashboard/attendance` - Barcode scanner interface ("Attendant")
  - `/dashboard/leaderboard` - Activity metrics and patron leaderboard
  - `/dashboard/cohorts` - Digital literacy cohorts, student rosters, Google Sheets sync
  - `/dashboard/competitions` - Live competition judging and broadcast results
  - `/dashboard/certificates` - Vector certificate studio & export pipeline
  - `/dashboard/transcomm` - Staff editorial management for DRNICER articles
  - `/dashboard/admin` - Staff RBAC accounts, emergency circulation overrides, audit ledger
  - `/dashboard/admin/calendar` - Yearly foundation operational calendar matrix & PDF ingestion
  - `/dashboard/admin/tasks` - Operational staff tasks Kanban board with drag-and-drop

## Deployment

- **Hosting Target:** Vercel (recommended) or Render (`render.yaml` Web Service) with zero cold-start DB pooling.
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Health Check Path:** `/api/health/db`
- **Environment Variables:** `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`.
