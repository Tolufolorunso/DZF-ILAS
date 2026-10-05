# Build Plan

List of planned features for the DZF-ILLS clean rebuild, ordered by architectural dependency and vertical delivery. Every operational feature delivers both the web interface and the REST API endpoints required for the upcoming Android application.

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
- [ ] 9. **Monthly Activity Aggregator & Leaderboard System (Web & API)** - Automated monthly score calculation, patron rank tier badges (Champion, Runner-up, Top 10), celebratory podium leaderboard views, and leaderboard REST feed.
- [ ] 10. **Cohort Academy & Google Sheets Cloud Synchronization** - Cohort batch creation, student enrollment rosters, and automated two-way Google Sheets synchronization via Google service account credentials.
- [ ] 11. **Reading Competition Results & Live Scoring Engine (Web & API)** - Competition session setup across grade categories (SS1-3, JSS1-3, P1-6), judge scoring API for mobile evaluations, and real-time public leaderboard display.

## Phase 4: Creative Studio, Publishing & Administration

- [ ] 12. **Certificate Studio & Vector Export Pipeline** - Digital literacy and competition certificate generation with vector templates, dynamic signature/gold seal placement, and high-resolution PDF/PNG exports.
- [ ] 13. **Transcomm Values & Leadership Knowledge Hub (Web & API)** - Editorial article publishing platform covering DRNICER values, leadership insights, rich text editing, and read API for mobile apps.
- [ ] 14. **Admin Control Center, Overrides & System Analytics** - Emergency circulation locks/overrides, staff requisition approvals, internal operational tasks, audit ledgers, and public statistics API.
