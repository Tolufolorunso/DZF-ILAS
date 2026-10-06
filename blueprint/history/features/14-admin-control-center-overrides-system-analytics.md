# Feature: Admin Control Center, Overrides & System Analytics

**From build-plan:** feature 14
**Build attempt:** 1
**Branch:** feature/admin-control-center-overrides-system-analytics
**Status:** verified

## Goal

Deliver the Admin Control Center, Emergency Circulation Overrides & System Analytics workspace at `/admin` and accompanying REST APIs. This establishes centralized executive control for library administrators: emergency circulation locks and patron loan overrides, staff requisition review and approval queues, operational task management, foundation event scheduling, a tamper-evident system audit ledger, and a public statistics API for the institutional welcome board and mobile Android clients.

## In scope

1. **System Governance Models & Service Layer**:
   - Create `SystemSetting` model (`src/models/SystemSetting.ts`) for singleton configuration (emergency circulation lock toggle, lock reason, lockedBy, lockedAt, overdue grace periods).
   - Create `AuditLog` model (`src/models/AuditLog.ts`) capturing administrative actions (`CIRCULATION_LOCK_TOGGLED`, `PATRON_OVERRIDE_GRANTED`, `REQUISITION_STATUS_UPDATED`, `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`, `EVENT_CREATED`, `EVENT_DELETED`, `ADMIN_OVERRIDE`).
   - Admin service layer (`src/lib/admin/service.ts`) with functions for system analytics aggregation, global circulation lock toggles, patron loan override execution, requisition review/status transitions, operational task management, and paginated audit log queries.
   - Integration into `src/lib/circulation/loan.ts` to enforce the emergency circulation lock during book checkouts.

2. **Dual-Mode REST API Endpoints**:
   - `GET /api/public/stats`: Publicly accessible real-time database counts (books, patrons, total loans, active loans, attendance, cohorts, articles, staff) for the institutional home screen and mobile apps.
   - `GET /api/admin/settings`: Retrieve current system settings. Protected by `admin` and `asst_admin`.
   - `POST /api/admin/overrides/circulation-lock`: Toggle emergency circulation lock on/off with required reason and actor logging. Protected by `admin` and `asst_admin`.
   - `POST /api/admin/overrides/patron`: Grant patron-specific loan override or clear active borrow block. Protected by `admin` and `asst_admin`.
   - `GET /api/admin/requisitions` & `POST /api/admin/requisitions`: List and create staff requisitions.
   - `PATCH /api/admin/requisitions/[id]`: Review and update requisition status (`pending` -> `approved` | `rejected` | `done`) with comments and audit logging.
   - `GET /api/admin/tasks`, `POST /api/admin/tasks`, `PATCH /api/admin/tasks/[id]`, `DELETE /api/admin/tasks/[id]`: Operational task CRUD.
   - `GET /api/admin/events`, `POST /api/admin/events`, `DELETE /api/admin/events/[id]`: Foundation operational events CRUD.
   - `GET /api/admin/audit-logs`: Filtered, paginated audit trail query endpoint.

3. **Admin Control Center UI Studio (`/admin`)**:
   - Protected route `/admin` with server-side RBAC session guard (`admin` and `asst_admin`).
   - Executive header featuring active session info, system health indicator, and emergency circulation lock status pill with one-click toggle dialog.
   - Tab 1: **System Analytics & Health**: Real-time KPI cards across all 15 system collections, circulation flow metrics, and administrative quick action shortcuts.
   - Tab 2: **Emergency Circulation Overrides**: Global circulation lock control with reason prompt; patron barcode lookup tool showing current loan blocks with one-click admin override/clear actions.
   - Tab 3: **Staff Requisition Queue**: Filterable list (`All`, `Pending`, `Approved`, `Rejected`), requisition details card, and action dialogs to approve with budget notes or reject with reasons.
   - Tab 4: **Operational Tasks Board**: Task manager grouped by status (`To Do`, `In Progress`, `Completed`), priority badges (`High`, `Medium`, `Low`), assignee tags, and task creation modal.
   - Tab 5: **Foundation Events & Calendar**: Event list with dates, target audience, venue, arrival times, and new event scheduling form.
   - Tab 6: **System Audit Ledger**: Searchable, paginated audit log table with action chips, actor username & role, target entity, formatted timestamp, and payload detail viewer.

4. **AppShell & Navigation Integration**:
   - Update `src/components/layout/AppShell.tsx` route handler: link `admin` item directly to `/admin` instead of `/dashboard`.
   - Add `pathname.startsWith('/admin')` to active navigation item detection.

## Out of scope

- Direct database indexing or raw MongoDB shell console in the web UI.
- Financial payment gateway integration (requisitions track internal approvals and estimated Naira budgets).
- Modifying staff passwords or auth credentials outside existing auth workflows.

## Build loop

- Step review policy: `feature` (all implementation steps run sequentially, followed by a unified review packet).
- Step checkpoint commits: `disabled`.
- Final feature commit and squash merge performed in `/complete`.

## Build steps

- [x] **Step 1: System governance models, audit logging & circulation lock hook**
  - Create `src/models/SystemSetting.ts` with singleton settings (`emergencyCirculationLock`, `circulationLockReason`, `lockedBy`, `lockedAt`).
  - Create `src/models/AuditLog.ts` with indexed fields (`action`, `performedBy`, `performedByRole`, `targetEntity`, `targetId`, `details`, `createdAt`).
  - Export new models in `src/models/index.ts`.
  - Create `src/lib/admin/service.ts` with administrative service functions and audit logging helper `logAuditEvent`.
  - Update `src/lib/circulation/loan.ts` `validateCheckoutEligibility` to check `emergencyCirculationLock`.
  - *Done when:* Models export cleanly, `validateCheckoutEligibility` returns emergency lock error when lock is enabled, and `npx tsc --noEmit` passes with 0 errors.

- [x] **Step 2: Dual-Mode REST API endpoints**
  - Create `src/app/api/public/stats/route.ts` returning public live counts with CORS and caching headers.
  - Create `src/app/api/admin/settings/route.ts` (GET settings).
  - Create `src/app/api/admin/overrides/circulation-lock/route.ts` (POST toggle lock).
  - Create `src/app/api/admin/overrides/patron/route.ts` (POST clear/override patron loan block).
  - Create `src/app/api/admin/requisitions/route.ts` (GET, POST) and `src/app/api/admin/requisitions/[id]/route.ts` (PATCH).
  - Create `src/app/api/admin/tasks/route.ts` (GET, POST) and `src/app/api/admin/tasks/[id]/route.ts` (PATCH, DELETE).
  - Create `src/app/api/admin/events/route.ts` (GET, POST) and `src/app/api/admin/events/[id]/route.ts` (DELETE).
  - Create `src/app/api/admin/audit-logs/route.ts` (GET paginated audit logs).
  - *Done when:* Endpoints enforce RBAC (`admin`/`asst_admin`), return standard JSON `{ success, ... }`, and pass typecheck.

- [x] **Step 3: Admin UI components & Studio Client**
  - Create `src/components/admin/EmergencyLockDialog.tsx` for toggling system locks.
  - Create `src/components/admin/PatronOverrideCard.tsx` for patron barcode lookup & override controls.
  - Create `src/components/admin/RequisitionReviewDialog.tsx` for approving/rejecting requisitions.
  - Create `src/components/admin/TaskFormDialog.tsx` for adding/editing operational tasks.
  - Create `src/components/admin/EventFormDialog.tsx` for adding foundation calendar events.
  - Create `src/components/admin/AuditLogViewer.tsx` for viewing audit ledger entries.
  - *Done when:* Components render with DZF brand styling, handle loading and error states, and pass `npx tsc --noEmit`.

- [x] **Step 4: Admin Control Center page & AppShell integration**
  - Create `src/app/admin/page.tsx` server component with session guard (`admin`, `asst_admin`).
  - Create `src/app/admin/AdminControlCenterClient.tsx` featuring the 6 tab panels (Analytics, Overrides, Requisitions, Tasks, Events, Audit).
  - Update `src/components/layout/AppShell.tsx` to route `admin` nav item to `/admin` and activate on `/admin*`.
  - *Done when:* Navigating to `/admin` renders the complete Admin Control Center, live statistics load correctly, and `npm run lint` + `npm run build` pass with 0 errors.

## Files / areas

- `src/models/SystemSetting.ts` (new)
- `src/models/AuditLog.ts` (new)
- `src/models/index.ts` (update)
- `src/lib/admin/types.ts` (new)
- `src/lib/admin/service.ts` (new)
- `src/lib/circulation/loan.ts` (update)
- `src/app/api/public/stats/route.ts` (new)
- `src/app/api/admin/settings/route.ts` (new)
- `src/app/api/admin/overrides/circulation-lock/route.ts` (new)
- `src/app/api/admin/overrides/patron/route.ts` (new)
- `src/app/api/admin/requisitions/route.ts` (new)
- `src/app/api/admin/requisitions/[id]/route.ts` (new)
- `src/app/api/admin/tasks/route.ts` (new)
- `src/app/api/admin/tasks/[id]/route.ts` (new)
- `src/app/api/admin/events/route.ts` (new)
- `src/app/api/admin/events/[id]/route.ts` (new)
- `src/app/api/admin/audit-logs/route.ts` (new)
- `src/components/admin/` (new components)
- `src/app/admin/page.tsx` (new)
- `src/app/admin/AdminControlCenterClient.tsx` (new)
- `src/components/layout/AppShell.tsx` (update)

## Data / contracts

- `SystemSetting`:
  - `_id`: ObjectId
  - `emergencyCirculationLock`: boolean (default: false)
  - `circulationLockReason`: string (optional)
  - `lockedBy`: string (optional)
  - `lockedAt`: Date (optional)
  - `updatedAt`: Date

- `AuditLog`:
  - `_id`: ObjectId
  - `action`: string (indexed)
  - `performedBy`: string (username, indexed)
  - `performedByRole`: string
  - `targetEntity`: string (indexed)
  - `targetId`: string (optional)
  - `details`: Schema.Types.Mixed
  - `createdAt`: Date (indexed)

- Public Stats response:
  - `{ success: true, stats: { books: number, patrons: number, totalLoans: number, activeLoans: number, attendance: number, cohorts: number, articles: number, staff: number }, timestamp: string }`

## Testing

- Typecheck: `npx tsc --noEmit`
- Linter: `npm run lint`
- Build: `npm run build`
- Live MongoDB operational verification for settings, requisition status changes, and audit entries.

## Notes for the AI

- Use DZF semantic brand colors: Brand Maroon (`#6f1111`), Scholastic Navy (`#17324d`), Academic Gold (`#cca349`), Midnight Navy (`#0b1d2e`).
- All admin actions must log to `AuditLog` collection automatically via `logAuditEvent`.
- Non-admin staff attempting to access `/admin` must receive a clean Access Denied banner with an option to return to the Dashboard.
- Never use mock placeholders; aggregate real collection metrics and seed baseline operational settings if none exist.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10589,"specSha256":"c073e17767f63d51f84b5fb828998a916db9238add5cb3d4f5444df4388c291a","branch":"refs/heads/feature/admin-control-center-overrides-system-analytics","head":"7181a9a895af468bd310320340859844034d585d","baseRef":"refs/heads/main","baseCommit":"7181a9a895af468bd310320340859844034d585d","sourceTree":"c6ce53addf280c1d02cad8e98b8d4c062601c1ea","absentOptional":[]} -->
