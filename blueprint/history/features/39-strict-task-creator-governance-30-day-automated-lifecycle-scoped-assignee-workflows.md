# Feature: Strict Task Creator Governance, 30-Day Automated Lifecycle & Scoped Assignee Workflows

**From build-plan:** feature 39
**Build attempt:** 1
**Branch:** feature/strict-task-creator-governance-30-day-automated-lifecycle-scoped-assignee-workflows
**Status:** verified

## Goal

Enforce strict task creator governance across the DZF-ILAS task management system: only the original author/creator who drafted and assigned a task (`assignedBy.username`) can archive it, restore it, or permanently delete it—with zero exceptions (even for Super Administrators and IMA). Restrict assignees strictly to active lane transitions (`To Do` ↔ `In Progress` ↔ `Completed`). Update both UI controls and backend REST API route guards with 403 Forbidden responses, and verify the 30-day automated TTL purge lifecycle for archived tasks in MongoDB.

## In scope

1. **Backend REST API Security Guards (`/api/admin/tasks/[id]`):**
   - In `DELETE /api/admin/tasks/[id]`, enforce that only the original author (`assignedBy.username.toLowerCase() === user.username.toLowerCase()`) can delete the task. Return `403 Forbidden` with a clear error message if any other user (including leadership) attempts deletion.
   - In `PATCH /api/admin/tasks/[id]`, if `status: 'archived'` is requested, verify that the authenticated user is the task's author. Return `403 Forbidden` for non-creators.
   - In `PATCH /api/admin/tasks/[id]`, if the task is currently `status: 'archived'` and a status restore is requested (e.g. restoring to `completed` or `todo`), verify that the authenticated user is the task's author. Return `403 Forbidden` for non-creators.
   - Permit assignees (`assignedTo.username`) and authors to transition tasks across active lanes (`todo`, `inProgress`, `completed`).
2. **Kanban Board UI Enforcement (`TaskKanbanBoard.tsx`):**
   - Delete icon (`TrashIcon`): Display exclusively when the current logged-in user is the task creator (`isAuthor`), removing `canManage` fallback.
   - Archive icon (`ArchiveIcon`): In the `Completed` column, display the archive button exclusively when `isAuthor` is true. Hide it from assignees and other viewers.
   - Quick Move Context Menu: Only show the "Archive Task (30 Days)" menu item if the task target is authored by the current user.
3. **Archive Modal & Edit Dialog Enforcement (`ArchivedTasksModal.tsx` & `TaskEditDialog.tsx`):**
   - In `ArchivedTasksModal`, disable or hide the Restore (`UndoIcon`) and Delete (`TrashIcon`) action buttons for tasks the current user did not create, showing an informative tooltip (`Only creator @<username> can restore/delete this task`).
   - In `TaskEditDialog`, ensure non-creators cannot select or submit `archived` status.
4. **Workspace Client Error Handling (`TasksWorkspaceClient.tsx`):**
   - Pass `currentUsername={user.username}` cleanly to `TaskKanbanBoard` and `ArchivedTasksModal`.
   - Gracefully catch 403 API responses on status updates, restores, and deletions, alerting the user with an in-app error feedback message if an unauthorized action is rejected.
5. **30-Day TTL Purge Lifecycle Verification:**
   - Verify that `Task.ts` has the active MongoDB TTL index on `archivedAt` (`expireAfterSeconds: 30 * 24 * 60 * 60`).
   - Ensure `updateTaskStatus` accurately stamps `archivedAt = new Date()` when entering archive and unsets `archivedAt = undefined` when restored.

## Out of scope

- Feature 40 scope: Vercel deployment configuration (`vercel.json`), system-wide database index auditing across non-task schemas, and production error boundaries.
- Modifying task discussion threads, comment schemas, or Web Push notification payloads.
- Altering task priority, due date, or tag data structures.

## Build loop

- `workflow.stepReview`: feature (single review packet upon completing all steps).
- `workflow.checkpointCommits`: disabled.

## Build steps

- [x] 1. **Backend REST API Creator Security Guards** - Update `src/app/api/admin/tasks/[id]/route.ts` to strictly require `isAuthor` for `DELETE` operations and for transitioning to or restoring from `archived` status in `PATCH` operations, returning `403 Forbidden` (`Only task creator @<username> can archive/delete this task`) with zero exceptions.
  - *Done when:* Calling `DELETE` or `PATCH { status: 'archived' }` with a non-creator session returns status 401/403 with the expected JSON error envelope, while the creator session succeeds.
- [x] 2. **Kanban Board UI Creator Scoping** - Update `src/components/admin/TaskKanbanBoard.tsx` so the Delete button, Completed column Archive button, and Quick Move Menu "Archive Task" item are strictly conditioned on `isAuthor = assignedBy.username === currentUsername`, completely hiding archive and delete controls from assignees.
  - *Done when:* Viewing completed task cards as an assignee shows only active move controls (`ChevronLeftIcon` back to In Progress) without the Archive button or Delete trash icon, while viewing self-created completed cards shows both Archive and Delete.
- [x] 3. **Archived Tasks Modal & Edit Dialog Creator Scoping** - Update `src/components/admin/ArchivedTasksModal.tsx` and `src/components/admin/TaskEditDialog.tsx` so restore and permanent delete actions are strictly locked to the task creator, disabling non-creator buttons with informative tooltips.
  - *Done when:* Opening the Archived Tasks modal as a non-creator displays the archived task details while disabling Restore and Delete actions with a tooltip indicating creator ownership.
- [x] 4. **Workspace Error Handling & End-to-End Verification** - Update `src/app/dashboard/tasks/TasksWorkspaceClient.tsx` to handle 403 responses gracefully with alert feedback, verify `Task.ts` 30-day TTL index behavior, and run typecheck (`npx tsc --noEmit`) and lint.
  - *Done when:* `npx tsc --noEmit` and `npm run lint` succeed with zero errors, and task permission boundaries are enforced end-to-end.

## Files / areas

- `src/app/api/admin/tasks/[id]/route.ts` - REST API authorization guards for DELETE, archive status PATCH, and restore status PATCH.
- `src/components/admin/TaskKanbanBoard.tsx` - Creator-only visibility for archive button, quick move context menu, and delete trash icon.
- `src/components/admin/ArchivedTasksModal.tsx` - Creator-only restore and delete buttons in the archived retention drawer.
- `src/components/admin/TaskEditDialog.tsx` - Status selection restrictions for non-creators.
- `src/app/dashboard/tasks/TasksWorkspaceClient.tsx` - Current user props passing, 403 response error handling, and toast feedback.
- `src/models/Task.ts` - Verification of `archivedAt` 30-day TTL index definition.

## Data / contracts

- `Task.assignedBy.username`: Evaluated case-insensitively against `sessionUser.username`.
- Authorization matrix:
  | Action | Creator (`assignedBy`) | Assignee (`assignedTo`) | Leadership (`admin`/`ima`) | Other Staff |
  | :--- | :--- | :--- | :--- | :--- |
  | Move to `To Do` / `In Progress` / `Completed` | Yes | Yes | Yes | Denied (if private) |
  | Move to `Archived` | **Yes** | **Denied (403)** | **Denied (403)** | **Denied (403)** |
  | Restore from `Archived` | **Yes** | **Denied (403)** | **Denied (403)** | **Denied (403)** |
  | Delete Task | **Yes** | **Denied (403)** | **Denied (403)** | **Denied (403)** |
  | Add Discussion Note | Yes | Yes | Yes | Denied (if private) |

## Testing

- Logic verification:
  - Non-creator DELETE test -> verifies HTTP 403.
  - Non-creator archive PATCH test -> verifies HTTP 403.
  - Non-creator restore PATCH test -> verifies HTTP 403.
  - Assignee lane move (`todo` -> `inProgress` -> `completed`) -> verifies HTTP 200.
  - Creator DELETE and archive -> verifies HTTP 200.
- Typecheck & Lint commands:
  - `npx tsc --noEmit`
  - `npm run lint`

## Notes for the AI

- Follow proportional engineering: reuse existing helper functions and components (`isAuthor`, `dzfColors`, `Tooltip`, `DZFBadge`).
- Ensure case-insensitive username comparison (`assignedBy?.username?.toLowerCase() === currentUser?.username?.toLowerCase()`).
- In `ArchivedTasksModal.tsx`, ensure `currentUsername` is passed and matched per-item in the tasks list.
