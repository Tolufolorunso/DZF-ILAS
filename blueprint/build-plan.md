# Build Plan

List of planned features for the DZF-ILAS clean rebuild, ordered by architectural dependency and vertical delivery. Every operational feature delivers both the web interface and the REST API endpoints required for the upcoming Android application.

## Phase 1: Core Foundation & Shared Design System

- [x] 1. **Design System & Reusable UI Components** - Build the centralized Material UI theme (`src/theme/`) with DZF brand tokens (Maroon, Scholastic Navy, Academic Gold), plus core reusable components: Buttons (primary, secondary, danger, soft), Inputs (text, search with clear, barcode scanner input with auto-trigger, select), Typography (kickers, headers, subtitles, mono), Badges & Status Pills, Data Tables with pagination/filtering, Stat Summary Cards, and Header/Navigation shells.
- [x] 2. **Complete Domain Data Models & Database Infrastructure** - Establish the cached MongoDB database connection (`src/lib/db.ts`) and create TypeScript Mongoose models with validation, indexes, and relationship helpers for all 15 production schemas: User, Patron, Cataloging, Library (Circulation), Inventory, BookSummary, Attendance, Cohort, CohortGroup, Competition, MonthlyActivity, TranscommArticle, Requisition, Task, and Event.
- [x] 3. **Staff Authentication, Session Management & Dual-Mode REST API** - Implement staff login, secure password hashing, JWT generation, role-based access control guards, and dual-auth middleware supporting both web cookies (`ils_token`) and Android bearer tokens (`Authorization: Bearer <token>`).

## Phase 2: Core Library & Circulation Engine

- [x] 4. **Patron Lifecycle, Photo Capture & 60x40 Thermal Barcode Studio (Web & API)** - Patron registration form with live camera photo capture & Cloudinary upload, barcode numbering sequence (4-digit current registration year + 4-digit incremental sequence continuing from the last registered member across the system, e.g. member #583 `20250583` -> next member in 2026 is `20260584`, validated to 8 numeric digits), printable 60mm x 40mm thermal label paper studio (Organisation on top, barcode + number at center, patron name at bottom with uniform vertical spacing), cohort enrollment privilege restricted to admin or delegated ICT staff, zero placeholders (querying live DB), and mobile patron lookup/search REST endpoints.
- [x] 5. **Cataloging & Library Inventory Management (Web & API)** - Book acquisition wizard, Dewey Decimal classification, author/publisher indexing, barcode copy labeling, shelf location mapping, and catalog search REST endpoints.
- [x] 6. **Circulation Engine (Checkout, Return, Holds & Overdues API & Web)** - Barcode-driven loan checkout, checkin/return processing, renewal limits, hold queue reservations, overdue calculation, and circulation audit logs consumable by web and Android scanners.

## Phase 3: Academy Operations & Gamified Engagement

- [x] 7. **Book Summary Moderation & Gamification Scoring (Web & API)** - Patron book summary submission, librarian moderation queue, feedback scoring (+2 to +10 points), and activity point crediting.
- [x] 8. **Barcode Attendance Scanner & Class Session Tracking (Web & API)** - High-speed scanner attendance logging for daily library visitors and digital academy classes with mobile Android scanner support.
- [x] 9. **Monthly Activity Aggregator & Leaderboard System (Web & API)** - Automated monthly score calculation, patron rank tier badges (Champion, Runner-up, Top 10), celebratory podium leaderboard views, and leaderboard REST feed.
- [x] 10. **Cohort Academy & Google Sheets Cloud Synchronization** - Cohort batch creation, student enrollment rosters, and automated two-way Google Sheets synchronization via Google service account credentials.
- [x] 11. **Reading Competition Results & Live Scoring Engine (Web & API)** - Competition session setup across grade categories (SS1-3, JSS1-3, P1-6), judge scoring API for mobile evaluations, and real-time public leaderboard display.

## Phase 4: Creative Studio, Publishing & Administration

- [x] 12. **Certificate Studio & Vector Export Pipeline** - Digital literacy and competition certificate generation with vector templates, dynamic signature/gold seal placement, and high-resolution PDF/PNG exports.
- [x] 13. **Transcomm Values & Leadership Knowledge Hub (Web & API)** - Editorial article publishing platform covering DRNICER values, leadership insights, rich text editing, and read API for mobile apps.
- [x] 14. **Admin Control Center, Overrides & System Analytics** - Emergency circulation locks/overrides, staff requisition approvals, internal operational tasks, audit ledgers, and public statistics API.

## Phase 5: Operational Refinements, Routing & Enhanced Circulation Workflows

- [x] 15. **Global Shell Modernization, Skeleton Loading, Public Transcomm & Brand Favicon** - Full-width header and footer canvases on `/` with 1200px centered body, high-contrast Operating Instructions button redesign, official DZF favicon integration, public access for `/transcomm` article reading, sidebar link renamed to "Attendant", and modern MUI Skeleton loaders across route transitions.
- [x] 16. **Dashboard Route Reorganization & Backward-Compatible Redirects** - Consolidate internal staff workspaces under `/dashboard/*` (`/dashboard/patrons`, `/dashboard/catalog`, `/dashboard/circulations`, `/dashboard/attendance`, `/dashboard/cohorts`, `/dashboard/competitions`, `/dashboard/certificates`, `/dashboard/admin`), with automatic 307 redirects from legacy paths and updated AppShell navigation state.
- [x] 17. **Patron Lifecycle Enhancements, Dynamic Registration & Strict RBAC** - Display passport photo thumbnails in patron lists, dynamic registration form conditioning on `patronType` (school details and parent/guardian info for students), Mongoose schema updates, and strict RBAC allowing only `admin`/`ict` to edit and `admin` to delete.
- [x] 18. **Circulation Gamification, Monthly Student Loan Caps & Competition Event Tagging** - Checkout workflow supporting optional Event Title and custom due days, hard limit of 4 borrowed books per month for students, timely return activity points on check-in (+3 on/before due date, +1 within 2 days late, 0 after), and enhanced Holds/Overdues/Renewal controls.
- [x] 19. **Catalog Acquisition Studio & Monograph Lifecycle Management** - Redesigned book acquisition studio with Dewey Decimal selector, real-time barcode copy preview, and staff book update and deletion capabilities with active loan protection.

## Phase 6: Patron Workspace Refinements, School Directory & Xprinter XP-365B Thermal Studio

- [x] 20. **Patron Registration Streamlining, School Directory, Deletion Safeguards & Table Sorting** - Remove cohort assignment from registration, implement 22 predefined Ijero Ekiti schools dropdown with manual entry fallback and auto-address fill, add typed confirmation security guards (`DELETE`) for single/bulk patron and monograph deletions with active loan protection, and enable interactive column sorting with up/down arrows (defaulting to barcode).
- [x] 21. **Xprinter XP-365B Thermal Barcode Studio & Date-Range Bulk Print Pipeline** - Redesign 60mm × 40mm thermal label layout (Top: "Dzuels Foundation", Middle: barcode, Bottom: "Name: <firstname>, <Surname>") with zero browser margin/header/footer CSS targeting Xprinter XP-365B, and add date-range bulk generation and continuous roll printing studio in `/dashboard/patrons`.

## Phase 7: Operational Staff Governance, Calendar Intelligence & POS Thermal Print Engine

- [x] 22. **Operational Staff Tasks Enrichment & Drag-and-Drop Kanban Board** - Task assignment role hierarchy (IMA -> Country Manager -> Admin -> Staff), dynamic assignee selection querying active DB users (individual or role group) with 'Assigned By' attribution, 3-column drag-and-drop Kanban workflow (To Do, In Progress, Completed), task CRUD, and real-time AppShell notification bell alerts.
- [x] 23. **Foundation Operational Calendar, PDF Ingestion & Multi-Stage Alert Pipeline** - Yearly 12-month operational calendar matrix (2027 ready), yearly calendar PDF upload with automated milestone extraction and interactive edit/confirmation table, and multi-stage advance alerts (1 month, 2 weeks, 1 week) delivered via the header notification bell.
- [x] 24. **Staff Self-Registration, Admin-Only Activation & Role Hierarchy Access Control** - Staff registration page (`/auth/register`) creating inactive accounts, strict Admin-Only account activation dashboard, and full top-to-bottom role access enforcement (IMA -> Country Manager -> Admin -> Asst Admin -> ICT -> Librarian -> Intern) filtering AppShell navigation and securing routes.
- [x] 25. **Isolated POS Thermal Label Printing Engine** - Overhaul thermal print execution using an isolated hidden iframe pipeline for Xprinter XP-365B and thermal roll printers, eliminating Next.js root wrapper CSS hiding bugs and guaranteeing 100% visible print previews.

## Phase 8: Calendar CSV Engine, Workspace Route, Platform Rebranding & System Hardening

- [x] 26. **Operational Calendar CSV Ingestion & Staff Workspace Route** - Upload and extract foundation calendar milestones from CSV files (supporting Date, Event, Participants, Focal Person, Remarks, and multi-date activity stages), interactive review table before saving, Event schema enrichment, and dedicated read-only operational calendar workspace route (`/dashboard/calendar`) positioned under Leaderboard in the AppShell navigation.
- [x] 27. **DZF-ILAS Platform Rebranding, SEO Privacy Rules, Staff Birthdays & Data Cleanup** - Rebrand entire platform to DZF-ILAS (Dzuels Integrated Library & Administrative System) across UI, metadata, and configuration; enforce strict SEO robots rules ensuring only `/transcomm` is indexed by search engines while all internal routes are noindex; add birthdate (month and day only) to staff registration and directory; and purge all hardcoded mock/fallback calendar data across views.

## Phase 9: Staff Task Workspace, Navigation Reordering, Modal Scrolling & Delegation Intelligence

- [x] 28. **Workspace Navigation Reordering, Notification Deep-Linking & Modal Form Scrolling Fix** - Reorder the AppShell WORKSPACE sidebar (Dashboard -> Task Board -> Library Catalog -> Patron Directory -> Attendant -> Leaderboard -> Calendar -> Inventory), update in-app notification bell clicks to deep-link directly to contextual targets (`/dashboard/tasks`, `/dashboard/calendar`) instead of admin-only routes, and fix form viewport height and scroll clipping in `PatronEditModal`, `BookEditModal`, and related edit dialogs using flex-column maxHeight and auto-scrolling content containers.
- [x] 29. **Staff Task Board Workspace, "All Team Members" Delegation & Role-Scoped Visibility Engine** - Implement dedicated staff task workspace route (`/dashboard/tasks`) with interactive 3-column Kanban board, expand task creation privileges allowing regular staff (`librarian`, `ict`, `cohort_lead`, `intern`, `asst_admin`) to create and manage private personal tasks, add "All Team Members" (`group:all`) broadcast delegation for leadership (`ima`, `country_manager`, `admin`), and enforce strict role-scoped task visibility in `listTasks` so private 1-on-1 tasks remain confidential while departmental and team-wide tasks are visible across all group members.

## Phase 10: Circulation Safety Dialogs, Academic Promotion & Daily Actions Reversible Audit Engine

- [x] 30. **Circulation Return/Renew Confirmation Modals, 5-Day Loan Defaults & Annual Academic Promotion Engine** - Implement dedicated book return and loan renewal confirmation dialogs in `/dashboard/circulation` displaying monograph, patron and due date overdue status with customizable extension days, update global default circulation loan period from 2 to 5 days, enforce patron phone optional and parent phone required across registration and profile updates, and build automated annual August 31st student grade promotion engine (Primary 1-6 -> JSS 1-3 -> SS 1-3 -> Out-of-School) preserving non-student and out-of-school accounts.
- [x] 31. **Staff Daily Live Action Stream, Same-Day Undo Engine & Assigner Real-Time Task Progression** - Build dedicated live activity audit console at `/dashboard/admin/daily-actions` under System Administration & Security tracking staff attendance, checkouts, returns, record updates, deletions, monographs, patron registrations, cohort actions and competitions with same-day reversible undo capability for Admin until midnight cutoff (concealing IMA and Country Manager actions from Admin view and undo), and implement real-time task progression tracking on `/dashboard/tasks` enabling assignees to transition cards live and assigners to monitor live lane advancement.

