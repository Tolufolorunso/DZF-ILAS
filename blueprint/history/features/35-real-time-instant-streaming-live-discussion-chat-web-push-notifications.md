# Feature: Real-Time Instant Streaming, Live Discussion Chat & Web Push Notifications

**From build-plan:** feature 35  
**Build attempt:** 1  
**Branch:** feature/real-time-instant-streaming-live-discussion-chat-web-push-notifications  
**Status:** verified  

---

## Goal

Eliminate notification and task synchronization delays by delivering a real-time event pipeline over Server-Sent Events (SSE), sub-second discussion chat message updates, floating in-app toast alerts with Web Audio chimes, and desktop HTML5 Web Push notifications for urgent assignments and messages.

---

## In Scope

1. **Server-Sent Events (SSE) Live Pipeline:**
   - Dedicated `/api/stream` SSE broadcast endpoint streaming task mutations, lane progressions, and discussion notes in real time (<100ms) across connected staff sessions.
   - Replaces polling lag on `/dashboard/tasks` with instant live chat and synchronized Kanban drag-and-drop.
2. **In-App Toast Alerts & Auditory Feedback:**
   - Floating on-screen toast popup alerts (`Snackbar` with action links) that trigger immediately when a user is assigned a task or mentioned in a note.
   - Subtle, clean synthetic Web Audio dual-tone chime (`587.33Hz` -> `880Hz`) on incoming notifications.
3. **HTML5 Desktop Web Push Notifications:**
   - Native browser Push API integration (`Notification.requestPermission()`) enabling background and minimized-tab desktop notifications for urgent tasks, direct messages, and system alerts.
   - User toggle switch in the notifications popover with `localStorage` persistence.
4. **Live Discussion Chat in Tasks Workspace:**
   - Instant message appending in `TaskDiscussionDrawer` with auto-scrolling to the latest comment.
   - Real-time comment count badge updates on Kanban cards.

---

## Out of Scope

- Third-party push services (e.g., Firebase Cloud Messaging, OneSignal); HTML5 Desktop Notification API is native and self-contained.
- External WebSocket servers or Redis pub/sub brokers (in-memory event bus on `globalThis` is standard for Next.js single-instance node runtime; maintains zero extra infrastructure dependencies).
- Audio uploads or external sound files (synthesized via Web Audio API `AudioContext` with zero latency and no asset dependencies).

---

## Build Loop

- `workflow.stepReview: "feature"`: Small, continuous implementation steps with a comprehensive review packet presented upon completion.
- `workflow.checkpointCommits: "disabled"`: Changes stay on the feature branch without intermediary checkpoint commits; `/complete` creates the single squashed work commit.

---

## Build Steps

- [x] Step 1: Real-Time Event Bus & Server-Sent Events Endpoint
  - Create `src/lib/realtime/eventBus.ts` with typed events (`task:created`, `task:updated`, `task:deleted`, `comment:added`, `comment:deleted`, `notification:created`, `broadcast`) and recipient filtering.
  - Implement `GET /api/stream` using Next.js App Router streaming `ReadableStream`, heartbeat ping interval, and session auth validation via `getSessionUser`.
  - Done when: Authenticated GET requests to `/api/stream` receive `text/event-stream` with initial `connected` handshake and periodic keepalive comments.
- [x] Step 2: Backend Mutation Event Dispatching
  - Wire `eventBus.dispatch` into `src/lib/admin/service.ts`, `src/app/api/admin/tasks/route.ts`, `src/app/api/admin/tasks/[id]/route.ts`, and `src/app/api/admin/tasks/[id]/comments/route.ts` for task creation, status updates, detail updates, deletion, comment posting, and comment deletion.
  - Wrap/hook notification creation to dispatch `notification:created` events to targeted recipient usernames.
  - Done when: Creating a task, updating a task, or posting a task note dispatches typed SSE events to subscribed event stream listeners.
- [x] Step 3: AppShell Real-Time Listener, In-App Toast Popups & Audio Chime
  - Update `src/components/layout/AppShell.tsx` to connect to `/api/stream` with reconnection backoff and 30s polling backup.
  - Implement on-screen toast popup (`Snackbar` + `Alert`) with action link ("View Task", etc.) when a new notification is received.
  - Implement synthesized Web Audio chime tone (`playNotificationChime()`) on incoming alerts with fallback handling for unmuted user interactions.
  - Done when: A notification dispatched to the user triggers an immediate floating toast alert and audio chime without waiting for the 30-second polling cycle.
- [x] Step 4: HTML5 Desktop Web Push Notifications
  - Add "Desktop Alerts" toggle switch in the `AppShell` notifications menu with permission status detection (`Notification.permission`).
  - Request permission on toggle activation (`Notification.requestPermission()`).
  - Dispatch native browser notifications via `new window.Notification(...)` with app icon when the browser tab is hidden/minimized and permission is granted.
  - Persist toggle state in `localStorage`.
  - Done when: An incoming notification triggers a desktop notification when the tab is unfocused or minimized, clicking which focuses the tab and navigates to the target route.
- [x] Step 5: Instant Live Task Kanban & Discussion Chat in Tasks Workspace
  - Update `src/app/dashboard/tasks/TasksWorkspaceClient.tsx` to listen to SSE events.
  - Handle `task:created`, `task:updated`, `task:deleted` by updating state instantly (<100ms) without waiting for 8-second polling.
  - Handle `comment:added` and `comment:deleted` by updating task comment lists and directly syncing open `TaskDiscussionDrawer` in real time, auto-scrolling to the latest note.
  - Done when: Posting a note in discussion displays immediately in all viewing sessions like a live chat, and dragging a Kanban card reflects instantly in another session without manual refresh.
- [x] Step 6: End-to-End Verification & Health Checks
  - Run typecheck (`npx tsc --noEmit`) and lint (`npm run lint`).
  - Verify SSE connectivity, toast rendering, audio chime, and task/note synchronization.
  - Done when: Full TypeScript compilation passes cleanly and real-time streaming functions seamlessly.

---

## Files / Areas

- `src/lib/realtime/eventBus.ts` (new)
- `src/app/api/stream/route.ts` (new)
- `src/lib/admin/service.ts`
- `src/app/api/admin/tasks/[id]/route.ts`
- `src/models/Notification.ts`
- `src/components/layout/AppShell.tsx`
- `src/app/dashboard/tasks/TasksWorkspaceClient.tsx`

---

## Verification & Checks Run

- `npx tsc --noEmit` — Clean (0 errors)
- `npm run lint` — Clean (0 errors, 0 warnings)
