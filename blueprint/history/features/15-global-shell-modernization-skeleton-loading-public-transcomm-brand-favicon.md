# Feature: Global Shell Modernization, Skeleton Loading, Public Transcomm & Brand Favicon

**From build-plan:** feature 15
**Build attempt:** 1
**Branch:** feature/global-shell-modernization-skeleton-loading-public-transcomm-brand-favicon
**Status:** verified

## Goal

Deliver Phase 5 core visual shell modernizations: full-width header and footer bands on the homepage (`/`) with a centered 1200px body container, redesigned high-contrast "View Operating Instructions" button, official DZF Foundation favicon integration, public access for the Transcomm Knowledge Hub (`/transcomm`), sidebar rename of "Barcode Scanner" to "Attendant", and a modern global Material UI Skeleton screen loader for smooth asynchronous route transitions.

## In scope

1. **Official Brand Favicon Integration:**
   - Link official DZF Foundation logo (`/images/logo.png`) as the official favicon across all standard formats in `src/app/layout.tsx` metadata (icon, shortcut, apple-touch-icon).
   - Ensure browser tabs immediately display the DZF Foundation emblem.

2. **Modern Skeleton Screen Loader Architecture:**
   - Create `src/components/ui/DZFSkeletonLoader.tsx` with modular skeleton layout primitives:
     - `PageSkeleton`: standard app layout with breadcrumbs, title banner, stat card row, and content grid.
     - `TableSkeleton`: animated table headers and alternating row shimmers.
     - `CardGridSkeleton`: grid of card shimmers for articles and catalog books.
   - Style with DZF semantic brand tokens (soft navy background `#071626` / `#f8fafc` and subtle academic gold shimmer).
   - Implement `src/app/loading.tsx` in the root App Router, rendering `PageSkeleton` during route transitions and data streaming.

3. **Homepage Full-Width Layout & Button Redesign:**
   - Update `src/app/HomePageClient.tsx`:
     - Allow Header (`<Box component="header">`) and Footer (`<Box component="footer">`) to span 100% full viewport width.
     - Constrain the primary body canvas to `max-width: 1200px` centered with responsive padding.
     - Redesign the "View Operating Instructions" button: eliminate invisible white-on-white text, introduce high-contrast academic gold or outlined scholastic navy styling with bold legible typography, icon accent, and smooth hover state.

4. **Public Transcomm Hub Access & Sidebar "Attendant" Label:**
   - Update `src/middleware.ts` to add `/transcomm`, `/transcomm/:path*` (except `/transcomm/manage`), and `/api/transcomm/articles` to `PUBLIC_PATHS`.
   - Update `src/app/transcomm/KnowledgeHubClient.tsx` to render a clean, public-friendly top reading header when unauthenticated (`!user`), while maintaining staff management actions when logged in.
   - Update `src/components/layout/AppShell.tsx`: rename the "Barcode Scanner" navigation item label to **"Attendant"**.

## Out of scope

- Moving routes to `/dashboard/*` (handled in Feature 16).
- Updating Patron schema or registration form (handled in Feature 17).
- Modifying circulation loan rules or point gamification (handled in Feature 18).
- Redesigning the book acquisition studio (handled in Feature 19).

## Build loop

- Step review policy: `feature` (all implementation steps run sequentially, followed by a unified review packet).
- Step checkpoint commits: `disabled`.
- Final feature commit and squash merge performed in `/complete`.

## Build steps

- [x] **Step 1: Favicon integration & global brand metadata**
  - Configure official DZF Foundation emblem (`/images/logo.png`) in `src/app/layout.tsx` metadata icons.
  - Verify favicon displays in browser tab and passes typecheck.
  - *Done when:* Visiting the app loads the official DZF Foundation favicon in the browser tab, and `src/app/layout.tsx` passes `npx tsc --noEmit`.

- [x] **Step 2: Modern MUI Skeleton Loader component & App Router loading.tsx**
  - Create `src/components/ui/DZFSkeletonLoader.tsx` with `PageSkeleton`, `TableSkeleton`, and `CardGridSkeleton`.
  - Create `src/app/loading.tsx` using `PageSkeleton` to catch all App Router route transitions.
  - Export skeleton primitives in `src/components/ui/index.ts` and `src/components/index.ts`.
  - *Done when:* Route transitions render the animated skeleton layout rather than blank/frozen states, and `npx tsc --noEmit` passes with 0 errors.

- [x] **Step 3: Homepage full-width layout & operating instructions button redesign**
  - Refactor `src/app/HomePageClient.tsx`:
    - Header and Footer stretch 100% full width across the viewport.
    - Central body content constrained to centered `max-width: 1200px`.
    - Redesign "View Operating Instructions" button with high-contrast text, clear borders, and smooth anchor scroll to `#instructions`.
  - *Done when:* Header and footer span full width, body content is centered at 1200px, button text is clearly legible, and clicking scrolls smoothly to `#instructions`.

- [x] **Step 4: Public Transcomm access & sidebar "Attendant" rename**
  - Add `/transcomm`, `/transcomm/[slug]`, and `/api/transcomm/articles` to `PUBLIC_PATHS` in `src/middleware.ts`.
  - Update `src/app/transcomm/KnowledgeHubClient.tsx` to support guest readers without forcing staff login.
  - Update `src/components/layout/AppShell.tsx` navigation item label from "Barcode Scanner" to "Attendant".
  - *Done when:* Unauthenticated visitors can view `/transcomm` and read articles without login redirect, the sidebar displays "Attendant", and `npm run lint` + `npm run build` pass with 0 errors.

## Files / areas

- `src/app/layout.tsx` (update metadata icons)
- `src/components/ui/DZFSkeletonLoader.tsx` (new component)
- `src/components/ui/index.ts` (export DZFSkeletonLoader)
- `src/components/index.ts` (re-export DZFSkeletonLoader)
- `src/app/loading.tsx` (new Next.js loading state)
- `src/app/HomePageClient.tsx` (refactor layout widths & button styling)
- `src/middleware.ts` (update `PUBLIC_PATHS` for `/transcomm`)
- `src/app/transcomm/KnowledgeHubClient.tsx` (support public guest view)
- `src/components/layout/AppShell.tsx` (rename nav link to "Attendant")

## Data / contracts

- Metadata icons contract:
  - `icon`: `'/images/logo.png'`, `apple`: `'/images/logo.png'`, `shortcut`: `'/images/logo.png'`
- Middleware `PUBLIC_PATHS`:
  - `['/auth/login', '/api/auth/login', '/api/auth/logout', '/api/auth/seed', '/api/health', '/competitions/reading/result', '/api/competitions/results', '/certificates/verify', '/api/certificates/verify', '/transcomm', '/api/transcomm/articles', '/api/public/stats']`
- Navigation item:
  - `{ id: 'attendance', label: 'Attendant', icon: <BarcodeIcon size={20} /> }`

## Testing

- Typecheck: `npx tsc --noEmit`
- Linter: `npm run lint`
- Production Build: `npm run build`
- Live verification:
  - Homepage (`/`) full-width header & footer with 1200px centered body.
  - High-contrast "View Operating Instructions" button legible and clickable.
  - Route navigation displays skeleton loading shimmer.
  - Unauthenticated access to `/transcomm` renders articles cleanly without login prompt.
  - Sidebar displays "Attendant".

## Notes for the AI

- Use DZF semantic brand colors: Brand Maroon (`#6f1111`), Scholastic Navy (`#17324d`), Academic Gold (`#cca349`), Midnight Navy (`#0b1d2e`).
- Never use pure black (`#000000`) or plain unbranded grey for skeleton backgrounds; use DZF surfaces (`dzfColors.surfaces.canvas` or subtle navy translucent overlays).
- Ensure public readers at `/transcomm` can still navigate back to `/` and have an intuitive "Staff Sign In" button in the header.
- Preserve all existing database aggregation and production collections without placeholders.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7586,"specSha256":"05721f101db8cb58931f48e9843cc5379ddc6d20e743b4062f84c5069a7967be","branch":"refs/heads/feature/global-shell-modernization-skeleton-loading-public-transcomm-brand-favicon","head":"4cfa23f2a642a2487b91b45ed003dfbf1044e572","baseRef":"refs/heads/main","baseCommit":"4cfa23f2a642a2487b91b45ed003dfbf1044e572","sourceTree":"bd209141b86d7bd4c568e1213aae2241b6e4ecf2","absentOptional":[]} -->
