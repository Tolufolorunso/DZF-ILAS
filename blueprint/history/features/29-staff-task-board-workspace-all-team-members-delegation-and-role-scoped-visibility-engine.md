# Feature: Staff Task Board Workspace, "All Team Members" Delegation & Role-Scoped Visibility Engine

**From build-plan:** feature 29
**Build attempt:** 1
**Branch:** feature/staff-task-board-workspace-all-team-members-delegation-and-role-scoped-visibility-engine
**Status:** verified

## Goal

Empower all staff members to create private self-assigned operational tasks and manage their progression across Kanban lanes (`To Do` $\rightarrow$ `In Progress` $\rightarrow$ `Completed`), allow leadership (`ima`, `country_manager`, `admin`) to broadcast tasks to "All Team Members" (`group:all`), and enforce a role-scoped visibility engine ensuring private leadership tasks (e.g. IMA $\rightarrow$ Country Manager or IMA $\rightarrow$ Admin) and self-assigned staff tasks remain strictly confidential while general operational and team-wide assignments remain visible across the foundation.

## In scope

1. **Task Authorization & Delegation Permissions (`src/lib/auth/rbac.ts`):**
   - Expand `canCreateTask(role)` to allow all authenticated staff roles (`ima`, `country_manager`, `admin`, `asst_admin`, `ict`, `librarian`, `cohort_lead`, `intern`, `facility`, `transcomm_author`).
   - Define assignment boundaries in `canAssignTaskTo`:
     - Regular staff (`librarian`, `ict`, `cohort_lead`, `intern`, `asst_admin`, `facility`, `transcomm_author`) can **only assign tasks to themselves** (`assignedToUsername === currentUsername`).
     - Leadership roles (`ima`, `country_manager`, `admin`) can delegate to themselves, subordinate individuals, role groups, or broadcast to **"All Team Members"** (`group:all`).

2. **Task Data Model Schema Extensions (`src/models/Task.ts`):**
   - Add schema attributes:
     - `targetGroup?: string` (e.g. `'all'`, `'librarian'`, `'ict'`, `'cohort_lead'`)
     - `assignedByRole?: string`
     - `assignedToRole?: string`
     - `isSelfAssigned?: boolean`
   - Add compound indexes for fast role-scoped queries (`assignedTo.username`, `assignedBy.username`, `targetGroup`, `isSelfAssigned`).

3. **Role-Scoped Visibility Engine (`src/lib/admin/service.ts`):**
   - Update `listTasks(options)` to accept `currentUserUsername?: string` and `currentUserRole?: string`.
   - Implement the confidentiality and visibility matrix:
     - **Team-wide / Broadcast:** Tasks assigned to `group:all` (`targetGroup === 'all'`) are visible to all authenticated staff.
     - **Department / Group:** Tasks assigned to a role group (e.g. `group:librarian`) are visible to that department and all staff as general operational milestones.
     - **General Operational Tasks:** Tasks assigned by leadership to regular staff (`librarian`, `ict`, `cohort_lead`, `intern`, etc.) are visible to all staff as general library/center operations.
     - **Private Leadership Tasks:** Tasks assigned by IMA to Country Manager or Admin, by Country Manager to Admin, or self-tasks of leadership are strictly confidential—visible only to the assigner and the assignee.
     - **Staff Self-Assigned Tasks:** Tasks created by regular staff for themselves (`isSelfAssigned === true`) are private and visible exclusively to the author.
   - Update `createTask` to handle `group:all` delegation with system-wide notifications for all active staff members.
   - Update `updateTaskStatus`, `updateTaskDetails`, and `deleteTask` so staff can manage, edit, and delete their own self-assigned tasks.

4. **API Route Security & Controller Updates (`src/app/api/admin/tasks/route.ts`, `src/app/api/admin/tasks/[id]/route.ts`):**
   - In `GET /api/admin/tasks`: Pass authenticated session identity (`user.username`, `user.role`) to `listTasks`.
   - In `POST /api/admin/tasks`: Permit task creation for all staff; enforce self-assignment for regular staff and allow `group:all` delegation for leadership.
   - In `PATCH /api/admin/tasks/[id]`: Authorize status transitions and edits for task authors, assignees, group members, and leadership.
   - In `DELETE /api/admin/tasks/[id]`: Permit authors to delete their own self-assigned tasks; require leadership privileges for deleting other tasks.

5. **Task Workspace UI Adaptations (`TaskFormDialog.tsx`, `TaskKanbanBoard.tsx`, `TasksWorkspaceClient.tsx`, `src/app/dashboard/tasks/page.tsx`):**
   - Update `TaskFormDialog`:
     - If user is regular staff: lock assignee to user's self (`@{currentUser.username}`) with clear "Private Self-Assigned Task" indication.
     - If user is leadership (`ima`, `country_manager`, `admin`): show "👥 All Team Members" (`group:all`) at top of Teams & Groups, plus hierarchy-filtered individual staff.
   - Update `TaskKanbanBoard`:
     - Display "🔒 Private Task" badge on self-assigned cards.
     - Display "👥 All Team Members" badge on broadcast cards.
     - Allow card authors to edit details and delete their own cards even if `canManage` is false.
   - Update `src/app/dashboard/tasks/page.tsx` server component to pass session identity to initial `listTasks`.

## Out of scope

- Direct patron-facing task or gamification point adjustments.
- Push notifications via third-party web push or SMS (retaining existing in-app bell notification pipeline).

## Build loop

- `workflow.stepReview: "feature"` — Run all steps, test, and provide one consolidated review packet.
- `workflow.checkpointCommits: "disabled"` — Do not create step checkpoint commits.

## Build steps

- [x] 1. **Data Model & RBAC Hierarchy Expansion**
  - Update `src/models/Task.ts` with `targetGroup`, `assignedByRole`, `assignedToRole`, and `isSelfAssigned` attributes and indexes.
  - Update `src/lib/auth/rbac.ts` so `canCreateTask` permits all staff roles, and `canAssignTaskTo` restricts general staff to self-assignment while enabling `group:all` for leadership.
  - *Done when:* `canCreateTask('librarian')` returns true, `canAssignTaskTo('librarian', 'ict')` returns false, and `canAssignTaskTo('librarian', 'librarian', 'user1', 'user1')` returns true.

- [x] 2. **Role-Scoped Visibility Engine & Broadcast Delegation**
  - In `src/lib/admin/service.ts`, enhance `createTask` to handle `group:all` broadcasting and notifications to all active staff.
  - Update `listTasks` in `service.ts` with the role-scoped privacy filter: leadership 1-on-1 tasks visible only to assigner & assignee; regular staff self-tasks visible only to the author; broadcast and general staff tasks visible to all.
  - Update `updateTaskStatus`, `updateTaskDetails`, and `deleteTask` permissions in `service.ts` to allow authors to manage their self-created tasks.
  - *Done when:* Calling `listTasks` with a librarian's identity returns only general/team tasks and their own self-tasks, hiding private tasks between IMA and Country Manager.

- [x] 3. **API Endpoints & Server Component Data Integration**
  - Update `GET /api/admin/tasks` and `src/app/dashboard/tasks/page.tsx` to supply the session user's username and role to `listTasks`.
  - Update `POST /api/admin/tasks` to validate self-assignment for general staff and `group:all` for leadership.
  - Update `PATCH` and `DELETE` in `src/app/api/admin/tasks/[id]/route.ts` to authorize self-task lifecycle management.
  - *Done when:* `GET /api/admin/tasks` returns strictly role-scoped tasks, and a librarian can create and delete their own task via POST/DELETE without 403 errors.

- [x] 4. **TaskFormDialog & Kanban Board UI Enhancements**
  - Update `src/components/admin/TaskFormDialog.tsx` to lock assignee to self for regular staff, and include "👥 All Team Members" (`group:all`) for leadership.
  - Update `src/components/admin/TaskKanbanBoard.tsx` to display private indicators and broadcast badges, and enable edit/delete controls for self-created tasks.
  - Wire props in `src/app/dashboard/tasks/TasksWorkspaceClient.tsx`.
  - *Done when:* Opening the create task dialog as a librarian automatically defaults and locks assignee to themselves; opening as admin allows selecting "All Team Members"; and moving cards across lanes functions seamlessly.

- [x] 5. **Verification & Typecheck**
  - Run `npx tsc --noEmit` and ensure zero TypeScript errors across all modified models, services, and components.
  - *Done when:* `npx tsc --noEmit` exits with code 0.

## Files / areas

- `src/models/Task.ts` — Task schema extensions (`targetGroup`, `isSelfAssigned`, role attribution)
- `src/lib/auth/rbac.ts` — Role delegation hierarchy and task creation permissions
- `src/lib/admin/service.ts` — Role-scoped visibility engine, broadcast delegation, and self-task lifecycle
- `src/app/api/admin/tasks/route.ts` — Authenticated task creation & filtered listing API
- `src/app/api/admin/tasks/[id]/route.ts` — Task status transition, editing, and deletion API
- `src/app/dashboard/tasks/page.tsx` — Server component passing authenticated identity to `listTasks`
- `src/app/dashboard/tasks/TasksWorkspaceClient.tsx` — Client task workspace component
- `src/components/admin/TaskFormDialog.tsx` — Role-conditioned assignee selector with `group:all` option
- `src/components/admin/TaskKanbanBoard.tsx` — Card badges, private task styling, and author control triggers

## Data / contracts

- Task Delegation Rules:
  - Leadership (`ima`, `country_manager`, `admin`): Can assign to individuals, specific groups, or `group:all` ("All Team Members").
  - General staff (`librarian`, `ict`, `cohort_lead`, `intern`, `asst_admin`, `facility`, `transcomm_author`): Can assign strictly to self (`assignedTo.username === currentUsername`).
- Visibility Matrix:
  - `group:all` / Broadcast $\rightarrow$ Visible to all active staff.
  - General operational tasks (assigned to general staff by leadership) $\rightarrow$ Visible to all active staff.
  - Private leadership tasks (IMA $\leftrightarrow$ Country Manager, IMA $\leftrightarrow$ Admin, Country Manager $\leftrightarrow$ Admin) $\rightarrow$ Visible ONLY to assigner and assignee.
  - Regular staff self-assigned tasks $\rightarrow$ Visible ONLY to author.

## Testing

- Typecheck verification: `npx tsc --noEmit`.
- Automated test script / runtime validation:
  - Validate `canCreateTask` for all staff roles.
  - Validate `canAssignTaskTo` self-assignment vs delegation rules.
  - Validate `listTasks` returns only permitted tasks for different simulated roles.
  - Validate `POST /api/admin/tasks` accepts self-assigned tasks and rejects unauthorized delegation.

## Notes for the AI

- Follow strict zero AI attribution policy: no `Co-Authored-By` or AI tool signatures in commits or PRs.
- Preserve backward compatibility for existing tasks in MongoDB (defaulting undefined `isSelfAssigned` to false and resolving legacy roles gracefully).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10634,"specSha256":"d90a00c8b192bc5990960da1904994276f6f901c42a6b8870acb5e247796d6d6","branch":"refs/heads/feature/staff-task-board-workspace-all-team-members-delegation-and-role-scoped-visibility-engine","head":"285dbf5251e696d93accb4cc54757dd6acb6e43f","baseRef":"refs/heads/main","baseCommit":"285dbf5251e696d93accb4cc54757dd6acb6e43f","sourceTree":"8c843efe80170541512bc9114331bef37126f8a8","absentOptional":[]} -->
