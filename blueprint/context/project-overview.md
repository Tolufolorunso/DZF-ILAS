# DZF-ILAS - Project Overview

<!-- blueprint:source-hash 86a9886352cedd22b947dfb2ae10415fb9871cc16110a161ee9b54186d97db35 -->

> Centralized internal staff workspace and REST API backend for the Dzuels Educational Foundation (DZF), managing academic library cataloging, patron identity, circulation, and academy engagement.

## Problem

The Dzuels Educational Foundation operates a high-volume academic library and learning center in Nigeria, managing 2,300+ catalog items, 670+ patrons, active book circulation, student digital literacy cohorts, reading competitions, and values publication. The legacy system suffered from fragmented auth patterns, unindexed database schemas, transaction desynchronization during circulations, and edge runtime failures. DZF-ILAS (Dzuels Integrated Library & Administrative System) provides a clean, unified Next.js web application and REST API backend for an upcoming companion Android mobile client. Phase 5 delivered shell modernizations, `/dashboard/*` reorganization, dynamic registration, monthly loan caps, and catalog acquisition studios. Phase 6 refined patron workflows with an Ijero Ekiti school directory, typed deletion security guards, interactive column sorting, and 60×40mm thermal bulk printing. Phase 7 introduced operational staff task governance (Kanban board, role-restricted assignment, notification bell alerts), a yearly foundation operational calendar with PDF ingestion and multi-stage alerts (30-day, 14-day, 7-day), staff self-registration with Admin-Only activation, top-to-bottom role hierarchy access control, and an isolated POS thermal label print engine. Phase 8 expanded calendar capabilities with multi-date CSV ingestion and an institutional read-only workspace route (`/dashboard/calendar`), rebranded the platform to DZF-ILAS, enforced strict SEO indexing rules ensuring only public Transcomm articles are indexed by search engines, added staff birthday tracking, and purged hardcoded fallback data. Phase 9 introduces a dedicated staff Task Board workspace (`/dashboard/tasks`), reorders the primary WORKSPACE navigation, repairs edit dialog viewport scrolling (patrons and books), deep-links notification alerts directly to relevant operational contexts, and establishes a role-scoped task delegation and privacy engine.

## Users & Role Hierarchy

Top-to-bottom institutional hierarchy:
1. **IMA (`ima`):** Institutional Oversight & International Management; can assign tasks to herself, Country Manager, Admin, and all staff.
2. **Country Manager (`country_manager`):** Executive national operations; can assign tasks to Admin and all subordinate staff.
3. **Super Administrator (`admin`):** Oversees website and operational workflows; solely authorized to activate pending staff accounts and perform system-wide administrative overrides. Can assign tasks to himself and subordinates.
4. **Assistant Administrator (`asst_admin`):** Operations support, circulation locks, patron/catalog management.
5. **ICT Officer (`ict`):** Technical operations, hardware scanners, system settings, patron and catalog management.
6. **Librarian (`librarian`):** Monograph cataloging, loan checkouts/returns/renewals, hold queues, webcam registration, thermal label printing.
7. **Intern / Staff (`intern`, `facility`, `cohort_lead`, `transcomm_author`):** Floor tasks, attendance marking, cohort rosters, personal task management, and editorial contributions.
8. **Patrons (Beneficiaries):** Students (Primary to Senior Secondary), Teachers, Staff, and Community Guests.

## Usage model

- **Scale & Performance:** 670+ registered patrons, 2,300+ catalog items, daily attendance batches, and real-time competition leaderboards.
- **Reachability & Trust:** Authenticated internal staff platform (`/dashboard/*`). Staff identities verified via JWT sessions. Public marketing/reading routes (`/`, `/transcomm`).
- **SEO & Search Indexing:** Strict privacy configuration: only `/transcomm` and `/transcomm/*` are indexed by Google and search engines (`index, follow`); all internal staff routes (`/dashboard/*`, `/auth/*`, `/api/*`, `/`) are strictly disallowed and marked `noindex, nofollow`.
- **Dual-Mode API Interoperability:** Consumed concurrently by the Next.js web frontend (HTTP-only `ils_token` cookies) and the Android mobile app (`Authorization: Bearer <token>`).
- **Hardware Integration:** Instant input support for physical USB/Bluetooth barcode scanners with automatic submit triggers; continuous 60mm × 40mm roll printing on Xprinter XP-365B thermal label printers via an isolated iframe print pipeline.

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
26. **Operational Calendar CSV Ingestion & Staff Workspace Route** - Upload and extract foundation calendar milestones from CSV files (supporting Date, Event, Participants, Focal Person, Remarks, and multi-date activity stages), interactive review table before saving, Event schema enrichment, and dedicated read-only operational calendar workspace route (`/dashboard/calendar`) positioned under Leaderboard in the AppShell navigation.
27. **DZF-ILAS Platform Rebranding, SEO Privacy Rules, Staff Birthdays & Data Cleanup** - Rebrand entire platform to DZF-ILAS (Dzuels Integrated Library & Administrative System) across UI, metadata, and configuration; enforce strict SEO robots rules ensuring only `/transcomm` is indexed by search engines while all internal routes are noindex; add birthdate (month and day only) to staff registration and directory; and purge all hardcoded mock/fallback calendar data across views.
28. **Workspace Navigation Reordering, Notification Deep-Linking & Modal Form Scrolling Fix** - Reorder the AppShell WORKSPACE sidebar (Dashboard -> Task Board -> Library Catalog -> Patron Directory -> Attendant -> Leaderboard -> Calendar -> Inventory), update in-app notification bell clicks to deep-link directly to contextual targets (`/dashboard/tasks`, `/dashboard/calendar`) instead of admin-only routes, and fix form viewport height and scroll clipping in `PatronEditModal`, `BookEditModal`, and related edit dialogs using flex-column maxHeight and auto-scrolling content containers.
29. **Staff Task Board Workspace, "All Team Members" Delegation & Role-Scoped Visibility Engine** - Implement dedicated staff task workspace route (`/dashboard/tasks`) with interactive 3-column Kanban board, expand task creation privileges allowing regular staff (`librarian`, `ict`, `cohort_lead`, `intern`, `asst_admin`) to create and manage private personal tasks, add "All Team Members" (`group:all`) broadcast delegation for leadership (`ima`, `country_manager`, `admin`), and enforce strict role-scoped task visibility in `listTasks` so private 1-on-1 tasks remain confidential while departmental and team-wide tasks are visible across all group members.

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
- `studentSchoolInfo` ({ schoolName, currentClass, schoolAddress })
- `parentInfo` ({ parentName, parentPhoneNumber, relationshipToPatron, parentEmail })
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
- `dueDate` (Date)
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
- `status` (enum: `'todo' | 'in_progress' | 'completed'`)
- `assignedBy` ({ name: string, username: string })
- `assignedTo` ({ name: string, username: string })
- `comments` (array)
- `likes` (array)
- `createdAt` / `updatedAt` (Date)

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
- `type` (enum: `'task_assigned' | 'calendar_milestone' | 'account_activated' | 'system'`)
- `title` (string, required)
- `message` (string, required)
- `link` (string, optional)
- `read` (boolean, default: false)
- `createdAt` / `updatedAt` (Date)

## Tech Stack & Architecture

- **Next.js 16 (App Router):** Fast SSR, dynamic Route Handlers, and client React 19 components.
- **TypeScript:** Strict type checking across domain models, props, and API request/response contracts.
- **Material UI (`@mui/material`, `@mui/material-nextjs`):** Custom design system built on MUI primitives using Emotion engine.
- **MongoDB & Mongoose:** Document database with cached singleton connection pool and compound indexes.
- **Cloudinary:** Cloud storage for patron webcam photos and book covers.
- **Google Sheets API v4:** Service account integration for two-way cohort enrollment backups.
- **JsBarcode:** SVG-based barcode rendering for cards and item spine tags.
- **Thermal Print Engine:** Sandboxed headless iframe print pipeline targeting Xprinter XP-365B and 60mm × 40mm continuous rolls.

## Monetization

Not applicable. DZF-ILAS is a 100% internal non-profit educational and library management platform for the Dzuels Educational Foundation.

## UI/UX

- **Design Language:** Modern Academic SaaS / Digital Workspace.
- **Palette & Contrast:** Midnight Navy (`#0b1d2e`), Scholastic Navy (`#17324d`), Brand Maroon (`#6f1111`), Academic Gold (`#cca349`), crisp high-contrast text meeting WCAG AA standards.
- **Layout Architecture:** Full-width header and footer bands on public `/` with 1200px centered body; dedicated sidebar allocation on `/dashboard/*`.
- **Loading UX:** Next.js `loading.tsx` route skeletons using Material UI Skeleton components with brand shimmer.
- **Core Routes:**
  - `/` - Public welcome board with system overview, rules, and live database stats
  - `/transcomm` & `/transcomm/[slug]` - Public DRNICER leadership knowledge hub (indexed by search engines)
  - `/auth/login` - Staff credential sign-in
  - `/auth/register` - Staff self-registration with birth month/day and pending admin activation
  - `/dashboard` - Summary counters, circulation stats, gender ratios, upcoming milestones
  - `/dashboard/tasks` - Dedicated staff task workspace with interactive 3-column Kanban board
  - `/dashboard/catalog` & `/dashboard/catalog/acquire` - Monograph inventory and acquisition studio
  - `/dashboard/patrons` & `/dashboard/patrons/register` - Patron directory, dynamic registration, Xprinter XP-365B bulk printing
  - `/dashboard/circulations` - Barcode loan transactions, checkout, return, holds, overdues
  - `/dashboard/attendance` - Barcode scanner interface ("Attendant")
  - `/dashboard/leaderboard` - Activity metrics and patron leaderboard
  - `/dashboard/calendar` - Dedicated staff operational calendar matrix & agenda stream
  - `/dashboard/inventory` - Foundation asset inventory and equipment logs
  - `/dashboard/cohorts` - Digital literacy cohorts, student rosters, Google Sheets sync
  - `/dashboard/competitions` - Live competition judging and broadcast results
  - `/dashboard/certificates` - Vector certificate studio & export pipeline
  - `/dashboard/transcomm` - Staff editorial management for DRNICER articles
  - `/dashboard/admin` - Staff RBAC accounts, emergency circulation overrides, audit ledger, CSV/PDF calendar ingestion tools

## Deployment

- **Hosting Target:** Vercel (recommended) or Render (`render.yaml` Web Service) with zero cold-start DB pooling.
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Health Check Path:** `/api/health/db`
- **Environment Variables:** `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`.
