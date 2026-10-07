# Feature: Staff Daily Live Action Stream, Same-Day Undo Engine & Assigner Real-Time Task Progression

**From build-plan:** feature 31
**Build attempt:** 1
**Branch:** feature/staff-daily-live-action-stream-same-day-undo-engine-assigner-real-time-task-progression
**Status:** verified

## Goal

Provide library administrators with a dedicated live staff activity audit stream at `/dashboard/admin/daily-actions` under System Administration & Security tracking staff operations (attendance scans, checkouts, returns, cataloging changes, patron registrations/edits, cohort actions, and reading competitions); equip admins with a same-day reversible undo engine that safely reverts accidental operational actions until a strict 12:00 AM midnight cutoff; enforce strict leadership privacy by completely concealing IMA and Country Manager actions from Admin view and preventing Admin undo of leadership actions; and implement real-time task progression synchronization on `/dashboard/tasks` so assigners immediately observe assignees advancing cards across Kanban lanes without manual refresh.

## In scope

1. **Daily Action Schema & Data Model (`src/models/DailyAction.ts`):**
   - Schema fields:
     - `actionType` (enum: `'attendance_scan'`, `'book_checkout'`, `'book_return'`, `'book_create'`, `'book_update'`, `'book_delete'`, `'patron_create'`, `'patron_update'`, `'patron_delete'`, `'cohort_action'`, `'competition_entry'`, `'task_create'`, `'task_status_change'`)
     - `actionTitle` (string: descriptive human-readable summary)
     - `performedBy` (string: username of staff member)
     - `performedByName` (string: display name)
     - `performedByRole` (string: staff role, e.g. `'librarian'`, `'ict'`, `'admin'`, `'country_manager'`, `'ima'`)
     - `targetEntity` (string: e.g. `'Attendance'`, `'Library'`, `'Cataloging'`, `'Patron'`, `'Cohort'`, `'Competition'`, `'Task'`)
     - `targetId` (string: ID / barcode of affected entity)
     - `reversiblePayload` (Record<string, unknown>: snapshot required to reverse the action)
     - `isReversible` (boolean: whether the action type supports automated reversal)
     - `isUndone` (boolean: default `false`)
     - `undoneAt` (Date: optional timestamp of reversal)
     - `undoneBy` (string: optional admin username who reversed it)
     - `dayTimestamp` (string: `YYYY-MM-DD` formatted in local Nigeria time UTC+1)
     - `createdAt` (Date: timestamp)
   - Indexes on `{ dayTimestamp: 1, createdAt: -1 }`, `{ performedByRole: 1 }`, and `{ performedBy: 1 }`.

2. **Daily Action Logging Service (`src/lib/audit/dailyActionService.ts`):**
   - Helper `recordDailyAction(...)` executed non-blockingly (try/catch wrapper so logging issues never break core transactions).
   - Integration into key mutation routes:
     - Attendance: `/api/attendance/scan`
     - Circulation: `/api/circulations/check-out`, `/api/circulations/check-in`
     - Catalog: `/api/catalog` (POST), `/api/catalog/[id]` (PATCH, DELETE)
     - Patrons: `/api/patrons` (POST), `/api/patrons/[id]` (PATCH, DELETE)
     - Tasks: `/api/admin/tasks` (POST), `/api/admin/tasks/[id]` (PATCH status)
     - Competitions: `/api/competitions/entries` (POST)

3. **Same-Day Reversible Undo Engine (`src/lib/audit/dailyActionService.ts` & API):**
   - Eligibility rules:
     - Must be same calendar day: `getCurrentNigeriaDateString() === action.dayTimestamp`. If date has crossed 12:00 AM midnight, reject with 400 error: *"Undo window closed at 12:00 AM midnight for this action."*
     - Must not be already undone: If `action.isUndone`, reject with 400 error: *"Action has already been undone."*
     - Must be reversible: If `!action.isReversible`, reject with 400 error: *"This action type does not support automated reversal."*
     - Leadership security guard: If requesting user is `admin` or `asst_admin` and `action.performedByRole` is `'ima'` or `'country_manager'`, reject with 403 error: *"Unauthorized: Administrators cannot undo leadership actions."*
   - Entity reversal execution:
     - `attendance_scan`: Delete attendance record, decrement patron points awarded.
     - `book_checkout`: Cancel loan record, restore book copy status to `'available'`.
     - `book_return`: Restore loan status to `'issued'`, mark book as `'borrowed'`, deduct timely return points from patron.
     - `book_create`: Delete created monograph.
     - `book_update`: Restore previous monograph attributes from `reversiblePayload.previousState`.
     - `book_delete`: Re-create deleted monograph from `reversiblePayload.deletedBook`.
     - `patron_create`: Soft-delete or remove newly created patron.
     - `patron_update`: Restore previous patron attributes from `reversiblePayload.previousState`.
     - `patron_delete`: Re-create deleted patron from `reversiblePayload.deletedPatron`.
     - `task_status_change`: Revert task status to `reversiblePayload.previousStatus`.

4. **Daily Actions API Endpoints (`src/app/api/admin/daily-actions`):**
   - `GET /api/admin/daily-actions`:
     - Role guard: `['admin', 'asst_admin', 'country_manager', 'ima']`.
     - If user is `admin` or `asst_admin`: automatically filter `{ performedByRole: { $nin: ['ima', 'country_manager'] } }` to conceal leadership actions.
     - If user is `ima` or `country_manager`: include all actions matching their authority.
     - Query parameters: `date` (defaults to today's `YYYY-MM-DD`), `staff` (username filter), `type` (actionType filter).
   - `POST /api/admin/daily-actions/[id]/undo`:
     - Role guard: `['admin', 'asst_admin', 'country_manager', 'ima']`.
     - Validates midnight cutoff, leadership protection, and executes entity reversal.

5. **Admin Daily Actions Workspace UI (`/dashboard/admin/daily-actions`):**
   - Route: `src/app/dashboard/admin/daily-actions/page.tsx` and `DailyActionsClient.tsx`.
   - Placed under AppShell navigation SYSTEM section ("Daily Actions Audit") and linked from `/dashboard/admin`.
   - Features:
     - Date selector (defaults to Today, allows browsing past historical action days).
     - Filter bar by staff member and category.
     - Real-time refresh button and auto-refresh stream.
     - Action table/stream displaying: Time, Staff Name, Role pill, Action Summary, Target Entity, Status (`Active` vs `Undone`).
     - "Undo" action trigger with confirmation modal explaining the exact reversal impact.
     - Distinct visual indicator for actions where the 12:00 AM midnight cutoff has expired.

6. **Assigner Real-Time Task Progression (`src/app/dashboard/tasks/TasksWorkspaceClient.tsx`):**
   - Add visibility-aware live polling synchronization (8-10 seconds) on `/dashboard/tasks`.
   - When an assignee advances a task (e.g. from `todo` to `inProgress` or `completed`), assigner's board automatically reflects the new lane and status in real-time.
   - Display a "Live Board Sync" indicator in the task workspace header.

## Out of scope

- Hard-deleting entire MongoDB collections or database dropping.
- External webhook pushes or third-party SMS alerts for undo events.
- Retroactive undo after 12:00 AM midnight.

## Build loop

- `workflow.stepReview: "feature"` — Implement all small steps first, test thoroughly, and present one consolidated review packet.
- `workflow.checkpointCommits: "disabled"` — Do not create step checkpoint commits.

## Build steps

- [x] **Step 1: DailyAction Model & Core Audit Types**
  - Create `src/models/DailyAction.ts` with schema, typed interfaces, and indexes.
  - Create `src/lib/audit/types.ts` defining action types, payloads, and DTOs.
  - Create `src/lib/audit/dailyActionService.ts` with `recordDailyAction`, date helper `getCurrentNigeriaDateString()`, and undo eligibility checker.
  - *Done when:* `npx tsc --noEmit` compiles cleanly with `DailyAction` model and service helpers.

- [x] **Step 2: Integration of Action Recording Across Mutation Handlers**
  - Hook `recordDailyAction` into:
    - `src/app/api/attendance/scan/route.ts` (attendance scan)
    - `src/app/api/circulations/check-out/route.ts` (book checkout)
    - `src/app/api/circulations/check-in/route.ts` (book return)
    - `src/app/api/catalog/route.ts` & `src/app/api/catalog/[id]/route.ts` (book create, update, delete)
    - `src/app/api/patrons/route.ts` & `src/app/api/patrons/[id]/route.ts` (patron create, update, delete)
    - `src/app/api/admin/tasks/route.ts` & `src/app/api/admin/tasks/[id]/route.ts` (task create, status update)
  - Ensure logging calls are non-blocking and safe.
  - *Done when:* Performing a sample checkout, return, attendance scan, or patron update generates a corresponding `DailyAction` document in MongoDB.

- [x] **Step 3: Reversible Undo Engine & Administrative API Routes**
  - Implement reversal handlers in `src/lib/audit/dailyActionService.ts` for each supported action type.
  - Create `src/app/api/admin/daily-actions/route.ts`:
    - Handles GET query with date and staff filters.
    - Enforces leadership concealment: automatically excludes `ima` and `country_manager` actions when caller is `admin`.
  - Create `src/app/api/admin/daily-actions/[id]/undo/route.ts`:
    - Enforces admin role, prevents undo of IMA/Country Manager actions by admin, enforces same-day midnight cutoff, executes reversal, and updates status.
  - *Done when:* Admin calling undo on a same-day action reverts the entity and marks it undone; calling undo on an IMA action or after midnight is rejected with appropriate HTTP status.

- [x] **Step 4: Daily Actions Audit Console UI (`/dashboard/admin/daily-actions`) & Navigation**
  - Create `src/app/dashboard/admin/daily-actions/page.tsx` and `src/components/admin/DailyActionsClient.tsx`.
  - Add date filter, staff filter, action category filter, and table/card stream with Undo confirmation modal.
  - Update `src/components/layout/AppShell.tsx`:
    - Add "Daily Actions Audit" link under SYSTEM section for admin/leadership roles.
    - Wire router navigation for `daily-actions`.
  - Add quick link in `src/app/dashboard/admin/AdminControlCenterClient.tsx` under System Audit Ledger tab.
  - *Done when:* Admin can navigate to `/dashboard/admin/daily-actions`, filter actions, see live activity, and trigger undo with dialog confirmation.

- [x] **Step 5: Assigner Real-Time Task Progression in Tasks Workspace**
  - In `src/app/dashboard/tasks/TasksWorkspaceClient.tsx`, add an active polling sync effect (every 8s) when the window/document is visible.
  - Synchronize remote status changes without interrupting user interactions.
  - Add a "Live Sync Active" badge in the workspace header.
  - *Done when:* When an assigned task's status changes remotely, the assigner's Kanban board updates the card position live.

- [x] **Step 6: Comprehensive Verification & Typecheck**
  - Run typecheck: `npx tsc --noEmit`.
  - Run build check: `npm run build`.
  - Run automated scratch integration script validating:
    1. Daily action creation and retrieval.
    2. Leadership concealment from admin queries.
    3. Same-day undo execution and midnight cutoff rejection.
    4. Guard preventing admin undo of IMA/Country Manager actions.
  - *Done when:* All checks pass with 0 errors and zero warnings.

## Files / areas

- `src/models/DailyAction.ts` (new)
- `src/lib/audit/types.ts` (new)
- `src/lib/audit/dailyActionService.ts` (new)
- `src/app/api/admin/daily-actions/route.ts` (new)
- `src/app/api/admin/daily-actions/[id]/undo/route.ts` (new)
- `src/app/dashboard/admin/daily-actions/page.tsx` (new)
- `src/components/admin/DailyActionsClient.tsx` (new)
- `src/components/admin/index.ts`
- `src/components/layout/AppShell.tsx`
- `src/app/dashboard/admin/AdminControlCenterClient.tsx`
- `src/app/dashboard/tasks/TasksWorkspaceClient.tsx`
- `src/app/api/attendance/scan/route.ts`
- `src/app/api/circulations/check-out/route.ts`
- `src/app/api/circulations/check-in/route.ts`
- `src/app/api/catalog/route.ts`
- `src/app/api/catalog/[id]/route.ts`
- `src/app/api/patrons/route.ts`
- `src/app/api/patrons/[id]/route.ts`
- `src/app/api/admin/tasks/route.ts`
- `src/app/api/admin/tasks/[id]/route.ts`

## Data / contracts

- **`DailyAction` schema:**
  - `actionType`: `'attendance_scan' | 'book_checkout' | 'book_return' | 'book_create' | 'book_update' | 'book_delete' | 'patron_create' | 'patron_update' | 'patron_delete' | 'cohort_action' | 'competition_entry' | 'task_create' | 'task_status_change'`
  - `dayTimestamp`: `YYYY-MM-DD` (Nigeria local day string)
  - `isReversible`: boolean
  - `isUndone`: boolean (default `false`)
  - `reversiblePayload`: object containing pre-state snapshots or target IDs
- **Concealment contract:**
  - If `currentUser.role === 'admin' || currentUser.role === 'asst_admin'`:
    - Daily action query filter includes `{ performedByRole: { $nin: ['ima', 'country_manager'] } }`
    - Undo endpoint rejects if target action has `performedByRole === 'ima' || 'country_manager'` with 403 Forbidden.
- **Midnight cutoff contract:**
  - If `getCurrentNigeriaDateString() !== action.dayTimestamp`: Undo rejected with 400 Bad Request ("Undo window closed at 12:00 AM midnight").

## Testing

- Typecheck: `npx tsc --noEmit`
- Build check: `npm run build`
- Scratch integration test: Validate action creation, concealment filtering, undo execution, and midnight cutoff enforcement.

## Notes for the AI

- Maintain zero AI attribution policy: no `Co-Authored-By` or AI signatures in commits or PRs.
- Keep daily action logging non-blocking: never allow an error in audit logging to crash or fail user-facing checkout, attendance, or registration operations.
- Ensure time-based calculations consistently utilize West Africa Time (WAT, UTC+1 / Nigeria) to guarantee accurate midnight boundaries regardless of server deployment timezone.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":13735,"specSha256":"ad77252f4a2ed22d694c8c68c58ef034a98f543f9c4481b9e1261f603e283023","branch":"refs/heads/feature/staff-daily-live-action-stream-same-day-undo-engine-assigner-real-time-task-progression","head":"9a0d52733f3807dd2883811342a05047725aff78","baseRef":"refs/heads/main","baseCommit":"9a0d52733f3807dd2883811342a05047725aff78","sourceTree":"dc36154e114c556e799464d143a05abf62b36ded","absentOptional":[]} -->
