# Feature: Task Archiving (30-Day Auto-Purge), Private/Public Scoping & In-App Notification Reminders

**From build-plan:** feature 33  
**Build attempt:** 1  
**Branch:** feature/task-archiving-30-day-auto-purge-private-public-scoping-in-app-notification-reminders  
**Status:** verified  

---

## Goal

Enhance the institutional staff task workspace (`/dashboard/tasks`) with an end-to-end archiving lifecycle featuring an automated 30-day retention purge, private vs. public visibility scoping that strictly protects confidential tasks, and server-side in-app notification reminders that escalate unstarted (`To Do`) and stalled (`In Progress`) assignments to assignees.

---

## In Scope

1. **Task Archiving Lifecycle & 30-Day Auto-Purge:**
   - Full status progression: `todo` $\rightarrow$ `inProgress` $\rightarrow$ `completed` $\rightarrow$ `archived`.
   - Completed cards on the Kanban board expose an "Archive" quick-action button and context menu option.
   - Stored `archivedAt` timestamp with a MongoDB TTL index (`expireAfterSeconds: 2592000` / 30 days) and a server-side query fallback purge ensuring tasks older than 30 days are automatically deleted.
   - Dedicated "Archived Tasks" modal/drawer in `/dashboard/tasks` displaying archived tasks, retention countdown ("Auto-deletes in X days"), and actions to restore (`completed`) or permanently delete.
   - Active Kanban board defaults to excluding archived tasks to keep operational lanes focused and clean.

2. **Private vs. Public Task Scoping:**
   - Form toggle (`isPrivate: boolean`) in task creation and edit dialogs.
   - Visual confidentiality indicator: lock icon / "Private" badge on private cards in the Kanban board and lists.
   - Strict confidentiality filtering in `listTasks`: tasks flagged `isPrivate: true` are completely concealed from other staff members, visible strictly to the assignee (`assignedTo.username`) and the assigner (`assignedBy.username`).

3. **In-App Smart Polling Notification Reminders:**
   - Server-side reminder engine (`evaluateTaskRemindersAndCleanup`) triggered on notification bell polls (`GET /api/notifications`) and task workspace loads (`GET /api/admin/tasks`).
   - **Hourly Unstarted Alert:** Sends a `'task_reminder'` in-app notification every 1 hour to the assignee for tasks that remain in `todo`.
   - **48-Hour Stalled In-Progress Alert:** Sends a `'task_reminder'` in-app notification to the assignee when a task remains in `inProgress` for $\ge 48$ hours without completion.
   - Timestamps tracked on `Task`: `inProgressAt`, `lastTodoRemindedAt`, `lastInProgressRemindedAt`.

---

## Out of Scope

- External third-party cron service dependencies (the engine runs via repository-native smart in-app polling).
- Email or SMS dispatch for task reminders (reminders use the established in-app notification bell pipeline).
- Archiving of entities other than `Task`.

---

## Build Loop

- `workflow.stepReview: "feature"`: Small, continuous implementation steps with a comprehensive review packet presented upon completion.
- `workflow.checkpointCommits: "disabled"`: Changes stay on the feature branch without intermediary checkpoint commits; `/complete` creates the single squashed work commit.

---

## Build Steps

- [x] **Step 1: Data Models & Type Definitions Extension**
  - Update `src/models/Task.ts`:
    - Add `isPrivate: { type: Boolean, default: false, index: true }`.
    - Add `archivedAt: { type: Date }` with MongoDB TTL index `TaskSchema.index({ archivedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })`.
    - Add `inProgressAt: { type: Date }`, `lastTodoRemindedAt: { type: Date }`, and `lastInProgressRemindedAt: { type: Date }`.
  - Update `src/models/Notification.ts`:
    - Add `'task_reminder'` to `NotificationType` enum and interface.
  - Update `src/lib/admin/types.ts`:
    - Add `isPrivate?: boolean`, `archivedAt?: string | null`, and `inProgressAt?: string | null` to `ITaskItemDTO`.
    - Add `isPrivate?: boolean` to task creation payload and update interfaces.
  - *Done when:* `npx tsc --noEmit` compiles cleanly with zero type errors.

- [x] **Step 2: Service Layer & Reminder Evaluation Engine**
  - Update `src/lib/admin/service.ts`:
    - Update `createTask` to accept and persist `isPrivate`.
    - Update `updateTaskStatus` and `updateTaskDetails`:
      - Set `inProgressAt: new Date()` when moving to `inProgress`.
      - Set `archivedAt: new Date()` when moving to `archived`.
      - Clear `archivedAt: undefined` when restoring a task.
    - Update `listTasks`:
      - Exclude `status: 'archived'` by default unless `status === 'archived'` or `status === 'all'` is requested.
      - Enforce private scoping: if `t.isPrivate === true`, only return the task if `currentUsername === assignedTo` or `currentUsername === assignedBy`.
    - Implement `evaluateTaskRemindersAndCleanup()`:
      - Scan `todo` tasks where `Date.now() - (t.lastTodoRemindedAt || t.createdAt) >= 1 hour`. Create `Notification` (`type: 'task_reminder'`) for `assignedTo.username` and update `lastTodoRemindedAt`.
      - Scan `inProgress` tasks where `Date.now() - (t.inProgressAt || t.updatedAt) >= 48 hours` and `Date.now() - (t.lastInProgressRemindedAt || 0) >= 24 hours`. Create `Notification` for `assignedTo.username` and update `lastInProgressRemindedAt`.
      - Query fallback: delete archived tasks where `archivedAt < 30 days ago`.
  - Update `src/app/api/notifications/route.ts` and `src/app/api/admin/tasks/route.ts`:
    - Invoke `evaluateTaskRemindersAndCleanup()` during `GET /api/notifications` and `GET /api/admin/tasks`.
    - Handle `isPrivate` in `POST /api/admin/tasks` and `PATCH /api/admin/tasks/[id]`.
  - *Done when:* Creating private tasks saves `isPrivate: true`, moving to `archived` stamps `archivedAt`, non-assignees cannot view private tasks in `GET /api/admin/tasks`, and reminders evaluate without throwing.

- [x] **Step 3: UI Privacy Controls & Kanban Archive Transition**
  - Update `src/components/admin/TaskFormDialog.tsx`:
    - Add a "Mark as Private" switch/checkbox with explanatory text indicating it is confidential to assignee and assigner.
  - Update `src/components/admin/TaskEditDialog.tsx`:
    - Add privacy toggle in the edit dialog.
  - Update `src/components/admin/TaskKanbanBoard.tsx`:
    - Render a lock icon badge (`Private`) on cards where `isPrivate` is true.
    - In the `Completed` column cards: add an "Archive" button and menu action that moves status to `archived`.
  - *Done when:* Staff can toggle privacy when creating or editing tasks, private cards display the privacy indicator, and completed tasks can be archived.

- [x] **Step 4: Archived Tasks Drawer & Retention Dashboard View**
  - In `src/app/dashboard/tasks/TasksWorkspaceClient.tsx`:
    - Add an "Archived Tasks" button in the header toolbar showing the count of archived tasks.
    - Implement an `ArchivedTasksModal` / drawer component:
      - Lists all archived tasks with title, assignee, date archived, and an "Auto-deletes in X days" chip.
      - "Restore Task" action button (resets status to `completed` and returns it to the active board).
      - "Delete Permanently" action button with confirmation.
    - Re-sync tasks on restore/delete actions.
  - *Done when:* Staff can click "Archived Tasks", view archived items with remaining retention days, restore a task to the active board, and permanently delete an item.

- [x] **Step 5: Verification & Full Production Build**
  - Run typecheck: `npx tsc --noEmit`.
  - Run lint: `npm run lint`.
  - Run production build: `npm run build`.
  - *Done when:* Typecheck, lint, and Next.js production build pass with 0 errors.

---

## Files / Areas

- `src/models/Task.ts` - Task schema extension (`isPrivate`, `archivedAt`, TTL index, reminder timestamps).
- `src/models/Notification.ts` - Notification schema extension (`task_reminder` enum value).
- `src/lib/admin/types.ts` - DTO updates for task privacy, archiving, and reminders.
- `src/lib/admin/service.ts` - Task service updates (`createTask`, `updateTaskStatus`, `listTasks`, `evaluateTaskRemindersAndCleanup`).
- `src/app/api/notifications/route.ts` - Notification route hook for reminder evaluation.
- `src/app/api/admin/tasks/route.ts` & `[id]/route.ts` - API route handling for `isPrivate` and archive status.
- `src/components/admin/TaskFormDialog.tsx` - Task creation privacy switch.
- `src/components/admin/TaskEditDialog.tsx` - Task edit privacy switch.
- `src/components/admin/TaskKanbanBoard.tsx` - Privacy badge and archive quick-actions on completed cards.
- `src/app/dashboard/tasks/TasksWorkspaceClient.tsx` - Archived tasks drawer and lifecycle management.

---

## Data / Contracts

- **Task Schema Fields:**
  - `isPrivate`: `boolean`, default `false`.
  - `archivedAt`: `Date | undefined`. Index: `{ archivedAt: 1 }, { expireAfterSeconds: 2592000 }`.
  - `inProgressAt`: `Date | undefined`.
  - `lastTodoRemindedAt`: `Date | undefined`.
  - `lastInProgressRemindedAt`: `Date | undefined`.
- **Notification Type:**
  - `'task_reminder'`: `{ recipientUsername, senderUsername: 'system', type: 'task_reminder', title, message, link: '/dashboard/tasks' }`.
- **Privacy Contract:**
  - When `isPrivate === true`, only the assignee (`assignedTo.username`) and creator (`assignedBy.username`) can view the task.

---

## Testing

- **Typecheck:** `npx tsc --noEmit` must pass with 0 errors.
- **Lint Check:** `npm run lint` must pass with 0 errors.
- **Production Build:** `npm run build` must compile all 44+ routes cleanly.
- **Functional Verification:**
  - Verify private tasks are hidden from non-assignees.
  - Verify archived tasks are excluded from the main board and appear in the Archived Tasks drawer.
  - Verify restore resets task status to `completed` and clears `archivedAt`.

---

## Notes for the AI

- Preserve existing RBAC rules for task creation and assignments.
- Avoid introducing external background daemons; keep the reminder evaluator server-side in `service.ts` and call it lazily during polling.
- Ensure TTL index is declared on `archivedAt` in `TaskSchema`.
