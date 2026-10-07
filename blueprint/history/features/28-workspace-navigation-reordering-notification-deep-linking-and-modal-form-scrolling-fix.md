# Feature: Workspace Navigation Reordering, Notification Deep-Linking & Modal Form Scrolling Fix

**From build-plan:** feature 28
**Build attempt:** 1
**Branch:** feature/workspace-navigation-reordering-notification-deep-linking-modal-form-scrolling-fix
**Status:** verified

## Goal

Reorder the primary WORKSPACE sidebar navigation to place Asset Inventory below Operational Calendar and add the Task Board entry immediately following Dashboard, upgrade in-app notification bell clicks to deep-link directly into contextual operational workspaces (`/dashboard/tasks`, `/dashboard/calendar`) rather than restricted admin routes, and resolve viewport clipping and scroll-lock in `PatronEditModal`, `BookEditModal`, and related edit dialogs so all form fields are smoothly scrollable and accessible.

## In scope

1. **AppShell WORKSPACE Navigation Reordering (`src/components/layout/AppShell.tsx`):**
   - Update `workspaceItems` order:
     1. Dashboard (`id: 'dashboard'`, `/dashboard`)
     2. Task Board (`id: 'tasks'`, `/dashboard/tasks`)
     3. Library Catalog (`id: 'catalog'`, `/dashboard/catalog`)
     4. Patron Directory (`id: 'patrons'`, `/dashboard/patrons`)
     5. Attendant (`id: 'attendance'`, `/dashboard/attendance`)
     6. Leaderboard & Stats (`id: 'analytics'`, `/dashboard/leaderboard`)
     7. Operational Calendar (`id: 'calendar'`, `/dashboard/calendar`)
     8. Asset Inventory (`id: 'inventory'`, `/dashboard/inventory`) — moved below Calendar.
   - Update `resolvedNavId` and `handleItemClick` to route `tasks` to `/dashboard/tasks`.
   - Provide an initial `/dashboard/tasks` page layout / routing handler so the navigation item resolves cleanly without 404.

2. **Contextual Notification Deep-Linking (`AppShell.tsx`, `alerts.ts`, `service.ts`):**
   - Update `handleNotificationClick` in `AppShell.tsx` to handle notification navigation with fallback intelligence:
     - `task_assigned` / `task_updated` $\rightarrow$ `/dashboard/tasks`
     - `calendar_milestone` $\rightarrow$ `/dashboard/calendar`
     - Notifications with legacy `/dashboard/admin` links automatically remap to user-accessible destinations (`/dashboard/tasks` or `/dashboard/calendar`) when the user lacks admin privileges.
   - Update notification dispatchers in `src/lib/calendar/alerts.ts` (`link: '/dashboard/calendar'`) and `src/lib/admin/service.ts` (`link: '/dashboard/tasks'`).

3. **Dialog & Form Layout Scrolling Architecture:**
   - In `src/components/patrons/PatronEditModal.tsx` and `src/components/catalog/BookEditModal.tsx`:
     - Wrap `<form>` in flex-column container styling: `display: 'flex'`, `flexDirection: 'column'`, `maxHeight: 'calc(100vh - 64px)'`, `overflow: 'hidden'`.
     - Configure `<DialogContent dividers>` with `flex: 1` and `overflowY: 'auto'` to ensure vertical scrolling is responsive on all viewport heights.
     - Keep `<DialogTitle>` and `<DialogActions>` pinned/sticky at top and bottom.
   - Audit and apply the same flex scroll pattern to `TaskFormDialog.tsx` and `TaskEditDialog.tsx` to prevent off-screen input clipping on laptops and compact displays.

## Out of scope

- Feature 29 specifics: full role-scoped task privacy engine, self-assigned private task CRUD for regular staff, and "All Team Members" broadcast execution in the Task service.
- Database schema changes to `Patron` or `Cataloging`.

## Build loop

- `workflow.stepReview: "feature"` — Run all steps, test, and provide one consolidated review packet.
- `workflow.checkpointCommits: "disabled"` — Do not create step checkpoint commits.

## Build steps

- [x] 1. **Sidebar Navigation Reordering & Task Route Setup**
  - Update `src/components/layout/AppShell.tsx` to reorder `workspaceItems` (moving `inventory` below `calendar` and inserting `tasks` after `dashboard`).
  - Wire `handleItemClick` and `resolvedNavId` for `tasks` pointing to `/dashboard/tasks`.
  - Create `src/app/dashboard/tasks/page.tsx` with AppShell wrapper and baseline landing view.
  - *Done when:* Clicking navigation items matches the exact new order in the sidebar, clicking "Asset Inventory" routes to `/dashboard/inventory`, and clicking "Task Board" navigates cleanly to `/dashboard/tasks` without error.

- [x] 2. **Notification Deep-Linking & Smart Fallbacks**
  - In `src/components/layout/AppShell.tsx`, enhance `handleNotificationClick` to direct task notices to `/dashboard/tasks` and calendar notices to `/dashboard/calendar`, with safe remapping for non-admin staff.
  - Update `src/lib/calendar/alerts.ts` to set `link: '/dashboard/calendar'`.
  - Update `src/lib/admin/service.ts` to set `link: '/dashboard/tasks'`.
  - *Done when:* Clicking any task or calendar notification in the AppShell bell dropdown navigates directly to `/dashboard/tasks` or `/dashboard/calendar`.

- [x] 3. **Modal Dialog Form Scrolling Architecture**
  - Update `src/components/patrons/PatronEditModal.tsx` to apply flex column maxHeight container styling on `<form>` and `overflowY: 'auto'` on `<DialogContent dividers>`.
  - Update `src/components/catalog/BookEditModal.tsx` with identical flex column and auto-scroll content styling.
  - Apply corresponding flex scrolling safeguards to `src/components/admin/TaskFormDialog.tsx` and `TaskEditDialog.tsx`.
  - *Done when:* Opening the Edit Patron dialog and Edit Book dialog allows smooth scrolling down to the bottom-most fields (such as Parent info, School address, Dewey Decimal classification, and Summary) regardless of viewport height.

- [x] 4. **Verification & Typecheck**
  - Run `npx tsc --noEmit` and ensure zero TypeScript errors across all modified components and routes.
  - *Done when:* `npx tsc --noEmit` exits with code 0.

## Files / areas

- `src/components/layout/AppShell.tsx` — Sidebar item order, task nav wiring, notification click routing
- `src/app/dashboard/tasks/page.tsx` — Staff tasks workspace route
- `src/lib/calendar/alerts.ts` — Calendar notification target link
- `src/lib/admin/service.ts` — Task notification target link
- `src/components/patrons/PatronEditModal.tsx` — Patron modal flex scrolling container
- `src/components/catalog/BookEditModal.tsx` — Book modal flex scrolling container
- `src/components/admin/TaskFormDialog.tsx` — Task creation dialog flex scrolling container
- `src/components/admin/TaskEditDialog.tsx` — Task edit dialog flex scrolling container

## Data / contracts

- AppShell Nav Item:
  - `id: 'tasks'`, `label: 'Task Board'`, route: `/dashboard/tasks`
  - `id: 'inventory'`, `label: 'Asset Inventory'`, position: index 7 (after Calendar)
- Notification Navigation Contract:
  - `task_assigned` / `task_updated` $\rightarrow$ `/dashboard/tasks`
  - `calendar_milestone` $\rightarrow$ `/dashboard/calendar`

## Testing

- Typecheck verification: `npx tsc --noEmit`.
- Automated test script / runtime validation:
  - Verify AppShell navigation order contains `tasks` after `dashboard` and `inventory` after `calendar`.
  - Verify notification links default to contextual routes.
  - Verify CSS rules on `PatronEditModal` and `BookEditModal` enforce flex column layout and scrollable `DialogContent`.

## Notes for the AI

- Preserve genuine human attribution: zero AI `Co-Authored-By` trailers in commits or PRs.
- Keep `PatronEditModal` and `BookEditModal` visual styling identical, modifying only the layout flex chain and overflow behavior.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7372,"specSha256":"65e79a290ff9a16dd3c512b33ae0630407995b1ce16dc8f89b0abe70c42ccaf9","branch":"refs/heads/feature/workspace-navigation-reordering-notification-deep-linking-modal-form-scrolling-fix","head":"b4bcd9ee3cbeeb56ea7d70be61cc55462c16ff5c","baseRef":"refs/heads/main","baseCommit":"b4bcd9ee3cbeeb56ea7d70be61cc55462c16ff5c","sourceTree":"ab75aee8292ebe406bf84e9be290633e118de9d6","absentOptional":[]} -->
