# Feature: Dashboard Route Reorganization & Backward-Compatible Redirects

**From build-plan:** feature 16
**Build attempt:** 1
**Branch:** feature/dashboard-route-reorganization
**Status:** verified

## Goal

Reorganize the Next.js App Router folder architecture so that all internal staff operational pages reside under the `src/app/dashboard/` route segment with a shared nested layout (`src/app/dashboard/layout.tsx`), dedicated loading state (`loading.tsx`), and error boundary (`error.tsx`). Isolate public routes (`/`, `/transcomm`, `/certificates/verify`, `/competitions/reading/result`) outside of the dashboard layout so they never display the staff sidebar or header. Provide backward-compatible 307 redirects from legacy paths (e.g. `/patrons` -> `/dashboard/patrons`) and update AppShell navigation state.

## In scope

1. **Dashboard Nested Layout & Shell Architecture (`src/app/dashboard/layout.tsx`):**
   - Create `src/app/dashboard/layout.tsx` as an async Server Component with session protection (`getSessionUser()`), redirecting unauthenticated visitors to `/auth/login?redirect=/dashboard`.
   - Wrap all dashboard sub-routes in the shared `AppShell` with staff user context, role badge, persistent sidebar, top bar, and mobile responsive drawer.
   - Create `src/app/dashboard/loading.tsx` rendering `DZFSkeletonLoader` (`PageSkeleton`) for all dashboard route transitions.
   - Create `src/app/dashboard/error.tsx` client error boundary for graceful staff error recovery.
   - Keep `src/app/dashboard/page.tsx` as the main `/dashboard` operational overview, updating `DashboardClient.tsx` to render directly within the layout without an inner duplicate `AppShell`.

2. **Consolidation of Staff Workspaces into `src/app/dashboard/`:**
   - Move `src/app/catalog/` -> `src/app/dashboard/catalog/` (catalog list and `/catalog/acquire`).
   - Move `src/app/inventory/` -> `src/app/dashboard/inventory/`.
   - Move `src/app/patrons/` -> `src/app/dashboard/patrons/` (patron list and `/patrons/register`).
   - Move `src/app/circulations/` -> `src/app/dashboard/circulations/`.
   - Move `src/app/attendance/` -> `src/app/dashboard/attendance/`.
   - Move `src/app/summaries/` -> `src/app/dashboard/summaries/`.
   - Move `src/app/leaderboard/` -> `src/app/dashboard/leaderboard/`.
   - Move `src/app/cohorts/` -> `src/app/dashboard/cohorts/`.
   - Move `src/app/competitions/reading/page.tsx` & desk -> `src/app/dashboard/competitions/reading/`.
   - Move `src/app/certificates/page.tsx` & studio -> `src/app/dashboard/certificates/`.
   - Move `src/app/admin/` -> `src/app/dashboard/admin/`.
   - Set up staff Transcomm editorial management under `src/app/dashboard/transcomm/` (moved from `/transcomm/manage`).

3. **Public Route Isolation:**
   - Keep `/` (`src/app/page.tsx` & `HomePageClient.tsx`) as public landing board with full-width headers and no dashboard layout.
   - Keep `/transcomm` and `/transcomm/[slug]` (`src/app/transcomm/`) completely public for all students and visitors, utilizing `TranscommPublicHeader` without any staff sidebar or dashboard layout.
   - Keep `/certificates/verify/[code]` (`src/app/certificates/verify/`) as a public verification screen outside the dashboard.
   - Keep `/competitions/reading/result` (`src/app/competitions/reading/result/`) as a public live leaderboard broadcast outside the dashboard.

4. **AppShell Navigation & Active Route Highlight:**
   - Update `src/components/layout/AppShell.tsx`:
     - Map all navigation item clicks to `/dashboard/*` paths (`/dashboard`, `/dashboard/catalog`, `/dashboard/inventory`, `/dashboard/patrons`, `/dashboard/attendance`, `/dashboard/leaderboard`, `/dashboard/circulations`, `/dashboard/summaries`, `/dashboard/cohorts`, `/dashboard/competitions/reading`, `/dashboard/certificates`, `/dashboard/transcomm`, `/dashboard/admin`).
     - Update active route detection using `usePathname()` with `/dashboard/...` prefix checks.
     - Ensure client page components rendered inside the dashboard layout do not duplicate outer shells.

5. **Backward-Compatible 307 Redirects & Middleware:**
   - Add redirects in `next.config.ts` and `src/middleware.ts` for legacy top-level routes to their `/dashboard/*` equivalents:
     - `/catalog` -> `/dashboard/catalog`
     - `/inventory` -> `/dashboard/inventory`
     - `/patrons` -> `/dashboard/patrons`
     - `/circulations` -> `/dashboard/circulations`
     - `/attendance` -> `/dashboard/attendance`
     - `/summaries` -> `/dashboard/summaries`
     - `/leaderboard` -> `/dashboard/leaderboard`
     - `/cohorts` -> `/dashboard/cohorts`
     - `/competitions/reading` (staff desk) -> `/dashboard/competitions/reading`
     - `/certificates` (staff studio) -> `/dashboard/certificates`
     - `/admin` -> `/dashboard/admin`
     - `/transcomm/manage` -> `/dashboard/transcomm`
   - Explicitly preserve public routes (`/transcomm`, `/certificates/verify/*`, `/competitions/reading/result`) from being redirected into dashboard.

## Out of scope

- Modifying Patron Mongoose schemas or adding passport thumbnails (handled in Feature 17).
- Changing circulation loan caps or return point logic (handled in Feature 18).
- Redesigning the monograph acquisition wizard or Dewey classification (handled in Feature 19).

## Build loop

- Step review policy: `feature` (all steps implemented sequentially, followed by unified verification and review packet).
- Step checkpoint commits: `disabled`.
- Final feature commit and squash merge performed in `/complete`.

## Build steps

- [x] **Step 1: Dashboard Layout, Loading Skeleton & Error Boundary**
  - Implement `src/app/dashboard/layout.tsx` with session authentication and shared `AppShell` container.
  - Implement `src/app/dashboard/loading.tsx` using `PageSkeleton`.
  - Implement `src/app/dashboard/error.tsx` client error boundary.
  - Refactor `src/app/dashboard/DashboardClient.tsx` to render cleanly without duplicate shell.
  - *Done when:* Visiting `/dashboard` loads the dashboard with the shared sidebar and header, transitions show skeleton loader, and `npx tsc --noEmit` passes.

- [x] **Step 2: Relocate Staff Operational Workspaces to `src/app/dashboard/*`**
  - Move staff folders (`catalog`, `inventory`, `patrons`, `circulations`, `attendance`, `summaries`, `leaderboard`, `cohorts`, `competitions/reading`, `certificates`, `admin`, `transcomm/manage` -> `transcomm`) into `src/app/dashboard/`.
  - Adapt client components where necessary so they render cleanly inside the shared layout.
  - Preserve public routes (`/transcomm`, `/certificates/verify`, `/competitions/reading/result`) at their respective public root paths.
  - *Done when:* All staff pages are accessible under `/dashboard/*` (e.g. `/dashboard/patrons`, `/dashboard/catalog`, `/dashboard/circulations`, etc.) and compile cleanly.

- [x] **Step 3: Update AppShell Navigation & Active Route Highlight**
  - Update `src/components/layout/AppShell.tsx` navigation URLs and active item resolution to target `/dashboard/*`.
  - Ensure clicking sidebar items routes to the corresponding `/dashboard/*` pages without full page reload.
  - *Done when:* Clicking any sidebar item smoothly navigates to the `/dashboard/*` page and highlights the corresponding navigation menu item.

- [x] **Step 4: Backward-Compatible 307 Redirects & Middleware Updates**
  - Configure redirects in `next.config.ts` and `src/middleware.ts` for all legacy staff paths to their `/dashboard/*` destinations.
  - Ensure public routes remain accessible without redirect.
  - *Done when:* Navigating to `/patrons` automatically redirects to `/dashboard/patrons`, `/catalog` redirects to `/dashboard/catalog`, and `/transcomm` loads the public knowledge hub without redirect.

- [x] **Step 5: Full Verification & Route Integrity Test**
  - Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
  - Verify every staff route loads with live data and public routes load without dashboard sidebar.
  - *Done when:* All routes compile, build passes with 0 errors, and all tests succeed.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":8049,"specSha256":"99cad413197a64766da2a4d3a0ad0451e3522160690a3f8a4fa5b1851c363c1b","branch":"refs/heads/feature/dashboard-route-reorganization","head":"4172e287e75913e116bcf2a1e58b85948b03aaf3","baseRef":"refs/heads/main","baseCommit":"4172e287e75913e116bcf2a1e58b85948b03aaf3","sourceTree":"7d8de15b7f9634471dd0c7b49a60a99d1227b6f4","absentOptional":[]} -->
