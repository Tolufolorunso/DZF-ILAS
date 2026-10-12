# Feature: Task Messages, Operational Notes & Chronological Discussion Engine

**From build-plan:** feature 34  
**Build attempt:** 1  
**Branch:** feature/task-messages-operational-notes-chronological-discussion-engine  
**Status:** verified  

---

## Goal

Enhance the operational staff task workspace (`/dashboard/tasks`) with interactive messaging and discussion threading, enabling staff members, assigners, and assignees to exchange real-time operational notes, progress updates, and clarifications directly on task cards with automated in-app notification alerts.

---

## In Scope

1. **Chronological Discussion Stream:**
   - Interactive Task Discussion drawer/modal displaying messages in order with author name, username, role tag, formatted timestamp, and note body.
   - Message input field with send action and empty discussion state.
   - Author controls allowing commenters to delete their own notes, and administrative moderation allowing administrators to remove inappropriate entries.

2. **Kanban Card Discussion Indicator:**
   - Visual discussion badge (e.g. `💬 3`) on Kanban cards displaying the active message count.
   - Quick action to open the discussion panel directly from the card.

3. **In-App Notification Alerts:**
   - Posting a note triggers an in-app system notification (`'task_reminder'` / `'task_note'`) alerting the counterparty:
     - Assignee posts $\rightarrow$ alerts the assigner / creator.
     - Assigner posts $\rightarrow$ alerts the assignee.
     - Notifications include contextual deep links directly opening the task discussion.

4. **Confidentiality & Access Control:**
   - On private tasks (`isPrivate: true`), notes and responses remain strictly confidential and accessible exclusively to the assignee and the assigner.
   - On public tasks, team members can view notes and contribute operational insights.

---

## Out of Scope

- Rich text WYSIWYG editor or media file attachments in task comments (concise text notes and responses fulfill operational needs).
- External email or SMS push notifications for task notes.
- Threaded nested child sub-replies (Option A Chronological Timeline was selected during discovery).

---

## Build Loop

- `workflow.stepReview: "feature"`: Small, continuous implementation steps with a comprehensive review packet presented upon completion.
- `workflow.checkpointCommits: "disabled"`: Changes stay on the feature branch without intermediary checkpoint commits; `/complete` creates the single squashed work commit.

---

## Build Steps

- [x] **Step 1: Data Models & Type Definitions Extension**
  - Update `src/models/Task.ts`:
    - Ensure `ITaskComment` includes `_id?: mongoose.Types.ObjectId | string` and `commenter: ITaskUserRef & { role?: string }`.
    - Ensure `TaskCommentSchema` supports `role` in commenter.
  - Update `src/lib/admin/types.ts`:
    - Define `ITaskCommentDTO` with `id: string`, `commenter: { name: string; username: string; role?: string }`, `commentDate: string`, and `commentText: string`.
    - Update `ITaskItemDTO` with `comments?: ITaskCommentDTO[]` and `commentsCount?: number`.
  - *Done when:* `npx tsc --noEmit` compiles cleanly with zero type errors.

- [x] **Step 2: Service Layer & Discussion API Endpoints**
  - Update `src/lib/admin/service.ts`:
    - Update `mapTaskToDTO` to include `comments` and `commentsCount`.
    - Implement `addTaskComment(taskId: string, commenter: { username: string; name: string; role?: string }, text: string)`.
    - Dispatch counterparty in-app notification when a comment is added.
    - Implement `deleteTaskComment(taskId: string, commentId: string, currentUsername: string, isSuperAdmin: boolean)`.
  - Create Route Handlers:
    - `POST /api/admin/tasks/[id]/comments`: Validate user session, privacy boundary, and add note.
    - `DELETE /api/admin/tasks/[id]/comments/[commentId]`: Author or super admin comment removal.
  - *Done when:* Calling `POST /api/admin/tasks/[id]/comments` appends comment, updates task, triggers notification, and returns updated DTO.

- [x] **Step 3: Task Discussion Drawer Component**
  - Create `src/components/admin/TaskDiscussionDrawer.tsx`:
    - Slide-out drawer / modal showing task header, status pill, priority, and assignee.
    - Chronological list of notes with avatar/role badge, timestamp, and delete action for author or admin.
    - Textarea input with "Send Note" button and character validation.
    - Empty state when no comments exist.
  - *Done when:* Component displays discussion stream, allows posting new notes, and handles note deletion.

- [x] **Step 4: Kanban Board Indicator & Workspace Integration**
  - Update `src/components/admin/TaskKanbanBoard.tsx`:
    - Render `💬` comment badge with count when comments exist.
    - Add quick action / click handler `onOpenDiscussion(task)`.
  - Update `src/app/dashboard/tasks/TasksWorkspaceClient.tsx`:
    - Manage `selectedDiscussionTask` state.
    - Wire `addTaskComment` and `deleteTaskComment` with real-time optimistic or synced task updates.
  - *Done when:* Staff can click the comment badge on any task card, read the chronological notes, post responses, and see counts update live.

- [x] **Step 5: Verification & Full Production Build**
  - Run typecheck: `npx tsc --noEmit`.
  - Run lint: `npm run lint`.
  - Run production build: `npm run build`.
  - *Done when:* Typecheck, lint, and Next.js production build pass with 0 errors.

---

## Files / Areas

- `src/models/Task.ts` - Task comment schema and interface updates.
- `src/lib/admin/types.ts` - `ITaskCommentDTO` and `ITaskItemDTO` extension.
- `src/lib/admin/service.ts` - Comment creation, deletion, and notification dispatch methods.
- `src/app/api/admin/tasks/[id]/comments/route.ts` - POST endpoint to add task notes.
- `src/app/api/admin/tasks/[id]/comments/[commentId]/route.ts` - DELETE endpoint to remove task notes.
- `src/components/admin/TaskDiscussionDrawer.tsx` - New discussion drawer component.
- `src/components/admin/TaskKanbanBoard.tsx` - Card comment count pill and discussion trigger.
- `src/app/dashboard/tasks/TasksWorkspaceClient.tsx` - Discussion drawer wiring and real-time state synchronization.

---

## Data / Contracts

- **Task Comment Schema:**
  - `_id`: ObjectId
  - `commenter`: `{ name: string, username: string, role?: string }`
  - `commentDate`: Date (default: `Date.now`)
  - `commentText`: string (required, trimmed)
- **API Payloads:**
  - `POST /api/admin/tasks/[id]/comments`: `{ text: string }` $\rightarrow$ `{ success: true, task: ITaskItemDTO }`
  - `DELETE /api/admin/tasks/[id]/comments/[commentId]` $\rightarrow$ `{ success: true, task: ITaskItemDTO }`
- **Notification Type:**
  - `'task_reminder'`: `{ recipientUsername, senderUsername, type: 'task_reminder', title: 'New note on task: ...', message, link: '/dashboard/tasks' }`

---

## Testing

- **Typecheck:** `npx tsc --noEmit` must pass with 0 errors.
- **Lint Check:** `npm run lint` must pass with 0 errors.
- **Production Build:** `npm run build` must compile cleanly with 0 errors.
- **Functional Verification:**
  - Verify notes added appear immediately in chronological order.
  - Verify counterparty receives system notification on note creation.
  - Verify non-assignees cannot view notes on private tasks.
  - Verify authors can delete their notes and administrators can moderate.

---

## Notes for the AI

- Preserve existing private task scoping in `listTasks` and API endpoints.
- Avoid introducing external real-time WebSocket dependencies; utilize existing 8-second polling sync in `TasksWorkspaceClient.tsx`.
- Use design tokens from `@/theme/colors` `dzfColors` for consistent styling.
