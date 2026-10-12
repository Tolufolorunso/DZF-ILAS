# Feature: Administrator Self-Service Governance, Data Backup & Broadcast Center

**From build-plan:** feature 38
**Build attempt:** 1
**Branch:** feature/administrator-self-service-governance-data-backup-broadcast-center
**Status:** verified

## Goal

Implement a comprehensive, unified administration and governance suite within the Admin Control Center (`/dashboard/admin`) that empowers foundation administrators with self-service configuration management for the School Directory and Foundation Event Presets (eliminating hardcoded code changes), a 1-click JSON/CSV data backup and export pipeline for books, patrons, attendance, and circulation records, system-wide broadcast announcement banners with real-time SSE push and desktop notification dispatch, and automated data health recalculation tools (monthly leaderboard scoring and loan status reconciliation).

## In scope

1. **Self-Service School Directory & Foundation Event Presets Manager**:
   - Update `FoundationPreset` seeder to auto-populate the 22 Ijero Ekiti schools under `category: 'school'` with names and addresses in metadata.
   - Build REST endpoints:
     - `POST /api/foundation-presets` (create custom preset: school or annual event with admin role guard).
     - `PATCH /api/foundation-presets/[id]` (update preset properties, address metadata, active status).
     - `DELETE /api/foundation-presets/[id]` (safe removal with audit log).
   - In `/dashboard/patrons/register` and `PatronEditModal.tsx`, update school selection to dynamically query active schools from `/api/foundation-presets?category=school` while retaining instant memory fallback to `IJERO_SCHOOL_OPTIONS`.
   - In `/dashboard/admin`, build an interactive management section for schools (add school, edit address, toggle active/inactive, delete).
   - In `/dashboard/admin`, build an interactive management section for Foundation Event Presets (add custom event, target month, target audience, default points, active toggle).
2. **One-Click JSON/CSV Data Backup & Export Pipeline**:
   - Implement `GET /api/admin/backup` endpoint supporting query params:
     - `entity`: `'books' | 'patrons' | 'attendance' | 'circulation' | 'all'`
     - `format`: `'csv' | 'json'`
   - Formats CSV files with proper headers, quoted fields, and timestamps.
   - For `entity=all&format=json`, packages a full multi-collection snapshot bundle with export metadata, total counts, and schema version.
   - Implements proper `Content-Disposition: attachment; filename="..."` headers so clicking download triggers native browser file download directly.
   - Admin UI in `/dashboard/admin` with clean cards for each entity, format toggle (CSV/JSON), and instant 1-click download buttons with spinner feedback.
3. **System-wide Broadcast Banners & Urgent Push Alerts**:
   - Enrich `SystemSetting` model with `broadcastBanner`:
     - `message: string`
     - `severity: 'info' | 'warning' | 'error' | 'success'`
     - `isActive: boolean`
     - `link?: string`
     - `updatedAt: Date`
     - `updatedBy: string`
   - Implement `POST /api/admin/broadcast` endpoint:
     - Updates `SystemSetting.broadcastBanner`.
     - When `sendPush: true`, broadcasts an SSE `broadcast` event to all active staff connections via `eventBus.broadcast({ type: 'broadcast', data: ... })` and logs an audit log.
   - Update `AppShell.tsx`:
     - Render a sleek, non-intrusive marquee/banner at the top of the workspace canvas when `broadcastBanner.isActive` is true.
     - Provide a dismiss button in local session state so staff can close the banner after reading.
   - Admin UI in `/dashboard/admin`:
     - Broadcast composer card: message textarea, severity selector, link input, active switch, "Send Urgent Desktop Push Chime" checkbox, live banner preview, and "Broadcast to All Staff" trigger.
4. **Data Health & Recalculation Toolkit**:
   - **Leaderboard Recalculation Card:** Integrates `POST /api/leaderboard/recalculate` with Year/Month picker, trigger button, and status response showing number of patrons recalculated and points awarded.
   - **Loan Status & Inventory Synchronization:**
     - Implement `POST /api/admin/health/reconcile` endpoint:
       - Audits monographs in `Cataloging` where `isCheckedOut: true` against `Library` collection active loans.
       - Reconciles orphaned checked-out flags where no active loan exists.
       - Checks active loans against `Cataloging` availability and marks missing checked-out flags.
       - Re-audits overdue statuses against current date.
       - Returns a comprehensive reconciliation ledger: `{ monographsAudited, activeLoansAudited, discrepanciesRepaired, overdueLoansCount }`.
     - Admin UI card displaying the last sync timestamp, "Reconcile Monograph Loans" button, and summary breakdown badge chips.

## Out of scope

- Automated scheduled daily cron backup uploads to third-party S3 buckets (the requirement is self-service 1-click on-demand export for staff).
- Restoring/overwriting the entire database from uploaded raw JSON backups (dangerous destructive operation; backup exports are for safe external archiving, reporting, and auditing).
- Changes to student/patron loan cap rules or circulation checkout policies.

## Build loop

- Review cadence: Feature-level review (`workflow.stepReview: "feature"`).
- Checkpoint commits: Disabled (`workflow.checkpointCommits: "disabled"`).
- Verification: Full typecheck (`npx tsc --noEmit`) and linter (`npm run lint`) at each step.

## Build steps

- [x] 1. **Self-Service Preset Governance Endpoints & Dynamic School Directory**
  - Update `src/app/api/foundation-presets/route.ts` and create `src/app/api/foundation-presets/[id]/route.ts` with `POST`, `PATCH`, and `DELETE` handlers guarded by `isAdmin`.
  - Update seeder in `foundation-presets/route.ts` to include initial 22 schools from `IJERO_SCHOOL_OPTIONS` under `category: 'school'`.
  - Update `src/lib/patron/schools.ts` and `PatronRegisterClient.tsx` / `PatronEditModal.tsx` to load active schools dynamically from the API with memory fallback.
  - `Done when`: `POST`, `PATCH`, `DELETE` on `/api/foundation-presets` correctly mutate school and event presets in MongoDB; `npx tsc --noEmit` passes with 0 errors.

- [x] 2. **One-Click JSON/CSV Data Backup & Export Engine**
  - Implement `src/app/api/admin/backup/route.ts` supporting `entity` (`books`, `patrons`, `attendance`, `circulation`, `all`) and `format` (`csv`, `json`).
  - Convert MongoDB documents into clean, properly-escaped CSV rows or structured JSON bundles and stream as file downloads.
  - `Done when`: Calling `GET /api/admin/backup?entity=patrons&format=csv` downloads a valid CSV file with all patron records; calling with `entity=all&format=json` downloads a full database snapshot JSON; `npx tsc --noEmit` passes with 0 errors.

- [x] 3. **System Broadcast Announcement Banners & Urgent Push Alerts**
  - Update `SystemSetting` schema with `broadcastBanner` fields.
  - Implement `src/app/api/admin/broadcast/route.ts` to update broadcast settings and dispatch SSE live notifications across `eventBus`.
  - Update `AppShell.tsx` to fetch and render the active broadcast banner across staff pages with dismiss capability.
  - `Done when`: Saving a broadcast in the admin center displays the announcement banner across `AppShell` and dispatches live notification chimes; `npx tsc --noEmit` passes with 0 errors.

- [x] 4. **Automated Data Health Recalculation Tools & Admin Control Center Hub**
  - Implement `src/app/api/admin/health/reconcile/route.ts` to audit and synchronize loan statuses and monograph inventory availability.
  - Build `AdminGovernanceStudio.tsx` component under `src/components/admin/` and integrate it as a dedicated "Governance, Backups & Broadcast" tab in `AdminControlCenterClient.tsx`.
  - Provide interactive tabs/cards for: School Directory, Foundation Events, Data Backup Exports, Broadcast Center, and Data Health Recalculation.
  - `Done when`: Admin can manage schools, trigger backups, send broadcasts, recalculate leaderboards, and synchronize loans from the new Governance tab; `npx tsc --noEmit; npm run lint` passes with 0 errors and 0 warnings.

## Files / areas

- `src/models/SystemSetting.ts` - Schema update for broadcastBanner.
- `src/models/FoundationPreset.ts` - Preset category and school metadata.
- `src/app/api/foundation-presets/route.ts` - Seed schools and handle admin POST.
- `src/app/api/foundation-presets/[id]/route.ts` - Handle PATCH and DELETE.
- `src/app/api/admin/backup/route.ts` - JSON and CSV export stream.
- `src/app/api/admin/broadcast/route.ts` - Broadcast banner and SSE dispatcher.
- `src/app/api/admin/health/reconcile/route.ts` - Loan status and monograph inventory reconciliation.
- `src/components/admin/AdminGovernanceStudio.tsx` - Admin UI suite for all 5 governance areas.
- `src/app/dashboard/admin/AdminControlCenterClient.tsx` - Integrated governance tab.
- `src/components/layout/AppShell.tsx` - Workspace-wide announcement banner.

## Data / contracts

- **Backup Export Shapes:**
  - Books: Barcode, Title, Author, Classification, Copies Total, Copies Available, Shelf Location, Created At.
  - Patrons: Barcode, Full Name, Patron Type, School, Phone, Parent Phone, Points, Active.
  - Attendance: Date, Timestamp, Barcode, Patron Name, Session Type, Class Preset, Points Credited.
  - Circulation: Loan ID, Book Barcode, Book Title, Patron Barcode, Patron Name, Status, Borrowed Date, Due Date, Returned Date.
  - Full Backup JSON: Metadata `{ generatedAt, version, totalRecords }` and `{ books, patrons, attendance, loans }`.
- **Broadcast Shape:** `{ message, severity: 'info' | 'warning' | 'error' | 'success', isActive, link, updatedAt, updatedBy }`.
- **Reconciliation Shape:** `{ monographsAudited, activeLoansAudited, discrepanciesRepaired, overdueLoansCount, timestamp }`.

## Testing

- Typecheck: `npx tsc --noEmit`
- Linter: `npm run lint`
- Manual Verification:
  1. Open `/dashboard/admin` and navigate to the new "Governance, Backups & Broadcast" tab.
  2. Test School Directory: View seeded schools, add a test school, edit address, toggle active, delete test school.
  3. Test Foundation Events: View event presets, add a custom event, edit, toggle active.
  4. Test Data Backup: Click download for Patrons CSV, Books CSV, and Full JSON Backup. Verify file contents.
  5. Test Broadcast Center: Enter message, set severity, click Send Broadcast. Verify banner in `AppShell` header and dismiss.
  6. Test Data Health: Click "Recalculate Leaderboard Scores" and "Reconcile Monograph Loans", verifying success alerts.

## Notes for the AI

- Ensure CSV export uses RFC 4180 escaping for commas and quotes.
- Keep admin endpoints strictly guarded with `isAdmin(user.role)`.
- Use existing UI components (`DZFButton`, `DZFBadge`, `DZFStatCard`, `DZFIcons`) to maintain visual elegance and brand consistency.
