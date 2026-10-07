# Feature: Operational Staff Tasks Enrichment & Drag-and-Drop Kanban Board

**From build-plan:** feature 22
**Build attempt:** 1
**Status:** verified
**Branch:** feature/operational-staff-tasks-enrichment-and-drag-and-drop-kanban-board

## Goal
Enrich the operational staff task management system with role-hierarchical task assignment permissions (IMA -> Country Manager -> Admin -> Staff), dynamic DB assignee population from the `User` collection (supporting individual and role-group delegation), clear 'Assigned By' attribution, interactive HTML5 drag-and-drop Kanban workflow (`To Do`, `In Progress`, `Completed`), and header notification bell alerts when tasks are assigned.

## In scope
1. **User Role Model Updates (`src/models/User.ts`):**
   - Update `UserRole` type and `UserSchema` enum to include `'country_manager'` and `'intern'`, establishing the complete hierarchy: `ima` > `country_manager` > `admin` > `asst_admin` > `ict` > `librarian` > `intern` (alongside `cohort_lead`, `transcomm_author`, `facility`).
2. **Notification Data Model (`src/models/Notification.ts`):**
   - Create Mongoose model with `recipientUsername`, `senderUsername`, `type` (`'task_assigned'`, `'task_updated'`, etc.), `title`, `message`, `link`, `read`, and timestamps.
3. **Task Data Model & Role-Based Assignment Hierarchy (`src/models/Task.ts`, `src/lib/admin/service.ts`, `src/lib/auth/rbac.ts`):**
   - Enforce task assignment authorization rules:
     - `ima`: Can assign tasks to herself, `country_manager`, `admin`, and any other staff.
     - `country_manager`: Can assign tasks to `admin` and all subordinate staff.
     - `admin`: Can assign tasks to himself and all subordinate staff (`asst_admin`, `ict`, `librarian`, `intern`, etc.).
     - Subordinate staff cannot assign tasks upward in the hierarchy.
   - Support individual assignment or role group assignment (e.g. "All Librarians", "All ICT"), which dispatches tasks/notifications to the group members.
   - Record and return `assignedBy` (`{ name, username }`) on every task.
4. **Staff Directory & Notification REST Endpoints:**
   - `GET /api/admin/users/assignees`: Secure endpoint returning active staff usernames, names, and roles for populating task assignee pickers.
   - `GET /api/notifications`: Retrieve current authenticated user's notifications and unread count.
   - `PATCH /api/notifications`: Mark all or specific notifications as read.
   - Update `POST /api/admin/tasks`, `PATCH /api/admin/tasks/[id]`, and `DELETE /api/admin/tasks/[id]` to enforce assignment hierarchy rules and create notification records for assignees.
5. **Interactive Drag-and-Drop Kanban Board:**
   - 3 interactive status columns: **To Do** (`todo`), **In Progress** (`inProgress`), **Completed** (`completed`).
   - HTML5 drag-and-drop interactions: draggable task cards with grab handles, visual drop zone indicators, drag hover styling, and instant state update with optimistic UI and API sync.
   - Task cards display: Title, description, priority badge, due date, `@assignedTo`, and `Assigned by: @assignedBy`.
   - Card action controls: Edit task modal, delete confirmation, and manual move fallback for keyboard/touch accessibility.
6. **Notification Bell Integration in `AppShell.tsx`:**
   - Connect the AppBar `BellIcon` button to unread badge indicator (`MUI Badge`).
   - Clicking bell opens an interactive notifications popover displaying recent task assignment notices with timestamp and status.
   - "Mark all as read" action.

## Out of scope
- Calendar event PDF upload & parsing (Feature 23).
- Public staff self-registration page and account activation queue (Feature 24).
- POS thermal printer iframe pipeline overhaul (Feature 25).
- Third-party push notification services or external SMS gateways.

## Build loop
- Quality gates: Typecheck (`npx tsc --noEmit`) and build (`npm run build`).
- Work conducted on local branch: `feature/operational-staff-tasks-enrichment-and-drag-and-drop-kanban-board`.

## Build steps
1. **Extend User Roles & Create Notification Model:** [COMPLETED]
   - Add `country_manager` and `intern` to `src/models/User.ts` type and schema enum.
   - Create `src/models/Notification.ts` with compound indexes on `{ recipientUsername: 1, read: 1, createdAt: -1 }`.
   - Register Notification model in `src/models/index.ts`.
   - *Done when:* TypeScript compiles cleanly with `country_manager` and `intern` recognized as valid roles and `Notification` exported. (Verified)
2. **Implement Task Assignment Permissions & Notification Dispatch in Backend Service:** [COMPLETED]
   - In `src/lib/auth/rbac.ts`, define `canAssignTaskTo(assignerRole, targetRole)` enforcing `ima`, `country_manager`, and `admin` rules.
   - Update `createTask` in `src/lib/admin/service.ts` to validate assignment hierarchy, support group selection, and persist `Notification` records for assignees.
   - Update `updateTaskStatus` to notify the assigner/assignee when a task moves to `completed`.
   - *Done when:* Automated or unit verify test proves that an unauthorized role cannot assign tasks upward, while authorized roles successfully create tasks and notifications. (Verified via `verify-feature-22.ts`)
3. **Build Notification & Staff Assignees API Endpoints:** [COMPLETED]
   - Create `src/app/api/notifications/route.ts` supporting `GET` (fetch recent notifications & unread count) and `PATCH` (mark notifications read).
   - Create `src/app/api/admin/users/assignees/route.ts` returning active staff filtered by assignment hierarchy for the requesting user.
   - Update `src/app/api/admin/tasks/route.ts` to validate payload against `canAssignTaskTo` and return enriched task objects.
   - *Done when:* `GET /api/notifications` and `GET /api/admin/users/assignees` return expected HTTP 200 JSON payloads for authenticated sessions. (Verified)
4. **Build Drag-and-Drop Kanban Board Component (`TaskKanbanBoard.tsx`):** [COMPLETED]
   - Create `src/components/admin/TaskKanbanBoard.tsx` rendering 3 Kanban lanes (`todo`, `inProgress`, `completed`).
   - Implement HTML5 drag-and-drop handlers (`onDragStart`, `onDragOver`, `onDragLeave`, `onDrop`) with visual lane highlight and optimistic position updates.
   - Include card badges, priority styling, due date pill, `@assignee`, and `Assigned by @assigner`.
   - Include Task Edit modal and Delete confirmation.
   - *Done when:* Dragging a card between lanes smoothly changes its visual column and calls `PATCH /api/admin/tasks/[id]` with the new status. (Verified)
5. **Upgrade Task Creation Dialog with DB Staff Selection & Hierarchy Filter:** [COMPLETED]
   - Update `TaskFormDialog` in `src/app/dashboard/admin/AdminControlCenterClient.tsx` (or extracted component) to load assignees dynamically from `/api/admin/users/assignees`.
   - Support selecting an individual staff member or a group (e.g., "All Librarians", "All ICT").
   - Display assigner information automatically based on current user session.
   - *Done when:* Creating a task presents active staff from DB, dispatches the task, and renders immediately on the Kanban board. (Verified)
6. **Connect AppShell Notification Bell to Real-Time Notification Popover:** [COMPLETED]
   - In `src/components/layout/AppShell.tsx`, add notification state polling / fetch on mount for `/api/notifications`.
   - Display dynamic badge count on `BellIcon` when unread notifications > 0.
   - Render a Material UI `Popover` on bell click listing recent notifications with click-to-view and "Mark All as Read" button.
   - *Done when:* Assigning a task shows an active notification count badge on the assignee's header bell, and clicking it displays the assignment alert. (Verified)
7. **Final Verification & Integration Walkthrough:** [COMPLETED]
   - Run `npx tsc --noEmit` and `npm run build` to confirm zero regressions across all pages.
   - Test end-to-end task creation, drag-and-drop lane transition, and notification badge display.
   - *Done when:* Typecheck and build pass with 0 errors. (Verified: `npx tsc --noEmit` (exit code 0), `npm run build` (exit code 0, 42 static & dynamic pages generated))

## Files / areas
- `src/models/User.ts` - Add `country_manager` and `intern` roles.
- `src/models/Notification.ts` - New Mongoose schema for staff in-app notifications.
- `src/models/index.ts` - Re-export `Notification`.
- `src/lib/auth/rbac.ts` - Add `canAssignTaskTo` hierarchy check.
- `src/lib/admin/service.ts` - Update task creation, status updates, and notification triggers.
- `src/app/api/admin/tasks/route.ts` - RBAC hierarchy validation and task creation.
- `src/app/api/admin/tasks/[id]/route.ts` - Status updates and deletion.
- `src/app/api/admin/users/assignees/route.ts` - Endpoint for active assignable staff list.
- `src/app/api/notifications/route.ts` - GET notifications, PATCH read status.
- `src/components/admin/TaskKanbanBoard.tsx` - New drag-and-drop Kanban board component.
- `src/app/dashboard/admin/AdminControlCenterClient.tsx` - Integrate `TaskKanbanBoard` and dynamic `TaskFormDialog`.
- `src/components/layout/AppShell.tsx` - Connect notification bell to live notifications popover.

## Data / contracts
- **`Notification` Model:**
  ```ts
  {
    recipientUsername: string; // indexed
    senderUsername: string;
    type: 'task_assigned' | 'task_updated' | 'calendar_milestone' | 'account_pending' | 'system';
    title: string;
    message: string;
    link?: string;
    read: boolean; // default: false, indexed
    createdAt: Date;
  }
  ```
- **Task Assignment Hierarchy Rules (`canAssignTaskTo`):**
  - `ima`: Can assign to `ima`, `country_manager`, `admin`, and any subordinate role.
  - `country_manager`: Can assign to `admin` and subordinate roles (`asst_admin`, `ict`, `librarian`, `intern`, etc.).
  - `admin`: Can assign to `admin` and subordinate roles (`asst_admin`, `ict`, `librarian`, `intern`, etc.).
  - Other roles: Cannot assign tasks upward or across to peers unless permitted.
- **Kanban Column Mapping:**
  - `todo` -> "To Do"
  - `inProgress` -> "In Progress"
  - `completed` -> "Completed"

## Testing
- Logic testing: Verify `canAssignTaskTo` returns `true` for authorized hierarchy pairs and `false` for unauthorized upwards delegation.
- Integration testing: Verify `POST /api/admin/tasks` creates task and inserts `Notification` document.
- API testing: Verify `GET /api/notifications` returns unread count and notification items for authenticated user.
- Build verification: `npx tsc --noEmit` and `npm run build`.

## Notes for the AI
- Maintain strict backward compatibility for existing tasks in MongoDB.
- Use native HTML5 Drag and Drop API with clean touch-friendly click fallbacks to avoid heavy external npm dependencies.
- Ensure Notification Popover in `AppShell` handles empty states gracefully ("No notifications yet").
- Ensure no secret values or credentials are exposed in API payloads.

## Open questions
- None. Requirements and hierarchy rules are concrete and confirmed.
