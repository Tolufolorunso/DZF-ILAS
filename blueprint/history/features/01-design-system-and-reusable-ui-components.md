# Feature: Design System & Reusable UI Components

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/design-system-and-reusable-ui-components
**Status:** verified

## Goal

Establish the centralized Material UI design system (`src/theme/`) and foundational reusable UI components for DZF-ILLS, matching the modern Academic SaaS / Digital Workspace design specification with exact DZF brand tokens (Maroon, Scholastic Navy, Academic Gold). Provide the application layout shell and an interactive component workbench on `src/app/page.tsx` validating all components, variants, responsive breakpoints, and interaction states.

## Design reference

- `design.md`: Academic SaaS / Digital Workspace guidelines, typography scale (Inter, 28-32px page headers, 20-24px section titles, 14-16px body, 13-14px secondary), moderate border radius (8-10px buttons/inputs, 12-16px cards), subtle shadows, left collapsible sidebar + top header layout shell.
- `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md` (Section 7): Exact hex tokens:
  - Brand Maroon: `#6f1111` (primary), `#a32121` (hover), `#861b1b` (active)
  - Scholastic Navy: `#17324d` (headings, accents, info text)
  - Academic Gold: `#cca349` (accent, medals, kickers: `#8b5e0b`, soft gold: `#fdf4cf`)
  - Surfaces: `#ffffff` (card/dialog), `#f8f8f8` (page canvas/inputs), `#e5e5e5` (borders), `#171717` (primary text), `#465569` (secondary text)
  - Semantic Status:
    - Success: `#1b5e20` (text/badge), `#e6f4ea` (background), `#16a34a` (button)
    - Warning: `#7b5e00` (text), `#f57f17` (badge), `#fff8e1` (background)
    - Error: `#b71c1c` (text/badge), `#fdecea` (background), `#dc2626` (button)
    - Info: `#17324d` (text), `#f4f7fb` (background), `#1f5873` (badge)
  - Interactive Focus: `0 0 0 3px rgba(111, 17, 17, 0.3)`
  - Selection: `rgba(111, 17, 17, 0.3)`

## In scope

- Centralized theme package under `src/theme/`:
  - `colors.ts`: Semantic brand tokens, status palettes, surface neutrals, alpha mixtures, and contrast values.
  - `typography.ts`: Typography hierarchy (PageTitle, SectionTitle, Body, Secondary, Monospace, Kickers).
  - `components.ts`: Custom MUI overrides (Buttons, Inputs, Cards, Tables, Chips, Dialogs, Selects) removing generic defaults and applying DZF styling.
  - `index.ts`: Assembled Material UI theme object and theme utilities.
- Emotion SSR integration for Next.js 16 App Router:
  - `src/app/layout.tsx`: Root HTML shell with `@mui/material-nextjs/v16-appRouter` (`AppRouterCacheProvider`), `ThemeProvider`, `CssBaseline`, and metadata.
  - `src/app/globals.css`: Base CSS reset, focus outline behavior, text selection highlighting.
- Core reusable components under `src/components/ui/`:
  - `DZFButton`: Variants (`primary`, `secondary`, `danger`, `soft`), sizes (`small`, `medium`, `large`), loading state spinner.
  - `DZFTypography`: `PageHeader` (with kicker/title/subtitle/action slot), `Kicker` overline, `Mono` code/barcode text.
  - `DZFBadge` / `DZFStatusChip`: Semantic badges (`default`, `primary`, `success`, `warning`, `error`, `info`, `top10`, patron type pills).
  - `DZFInput`: Outlined text input with clear label, focus ring, helper text, and validation error state.
  - `DZFSearchInput`: Search bar with search icon, clear button, and keyboard shortcut badge (`Ctrl + K`).
  - `DZFBarcodeInput`: Hardware scanner input supporting automatic submission on Enter/debounce, autofocus maintenance, and monospace display.
  - `DZFCard` & `DZFStatCard`: Metric summary cards with title, count value, icon container, trend indicator, and subtle borders.
  - `DZFDataTable`: Master table with header styling, row hover tint, column sorting, pagination controls, loading skeleton, and empty state fallback.
  - `DZFEmptyState`: Clean empty container with illustrative icon, title, description, and primary CTA.
- Layout Shell under `src/components/layout/`:
  - `AppShell`: Collapsible left sidebar (WORKSPACE, MANAGEMENT, SYSTEM navigation groups), top header with global search trigger, notifications icon, user profile chip, and responsive mobile drawer.
- Interactive Showcase Workbench:
  - `src/app/page.tsx`: Interactive living component explorer showcasing buttons (all states), inputs & barcode scanner simulation, badges, stat cards, data table, empty states, and app shell preview.

## Out of scope

- Database connection pool, Mongoose schemas, and MongoDB models (Feature 2).
- Staff authentication, login form logic, JWT handling, and session middleware (Feature 3).
- Real API endpoints or backend mutations (reserved for respective domain features).
- External webcam camera drivers or Cloudinary uploads (Feature 4).

## Build loop

- `workflow.stepReview`: `"feature"` (implement all steps in sequence, then pause for comprehensive review).
- `workflow.checkpointCommits`: `"disabled"` (work committed on feature branch upon approval).
- Verify command: `npx tsc --noEmit && npm run build`

## Build steps

- [x] 1. **Theme Tokens & MUI Foundation** - Implement `src/theme/colors.ts`, `src/theme/typography.ts`, `src/theme/components.ts`, and `src/theme/index.ts`. Configure brand maroon, navy, gold, and surface tokens. Update `src/app/globals.css` with global resets, focus rings, and selection colors.
  - *Done when:* `src/theme/index.ts` exports a valid MUI theme instance containing all custom color tokens and component overrides with zero TypeScript errors.
- [x] 2. **Next.js App Router Integration** - Configure `src/app/layout.tsx` using `AppRouterCacheProvider` from `@mui/material-nextjs/v16-appRouter`, wrap with `ThemeProvider` and `CssBaseline`, and define clean HTML document metadata.
  - *Done when:* `npx tsc --noEmit` validates `src/app/layout.tsx` without module or type errors.
- [x] 3. **Core Primitives: Buttons, Typography, Badges & Empty States** - Create `DZFButton` (with loading spinner), `PageHeader` / `Kicker` / `Mono` typography components, `DZFStatusChip` / `DZFBadge` (all 7 semantic variants), and `DZFEmptyState`.
  - *Done when:* All primitive components compile cleanly under `src/components/ui/` and export typed prop interfaces.
- [x] 4. **Form Controls & Hardware Barcode Scanner Input** - Create `DZFInput` (with validation and focus states), `DZFSearchInput` (with clear button and `Ctrl+K` hint), and `DZFBarcodeInput` (with auto-submit debounce, Enter key trigger, and monospace styling).
  - *Done when:* Inputs render properly, handle state changes, fire change/submit events as specified, and pass typechecking.
- [x] 5. **Data Containers & Layout Shell** - Create `DZFStatCard`, `DZFDataTable` (with sorting, pagination, empty fallback, and skeleton loading), and `AppShell` (collapsible sidebar with navigation sections, top header bar, and mobile responsive drawer).
  - *Done when:* Data table renders mock dataset with functional sorting and pagination, and AppShell toggles sidebar collapse cleanly.
- [x] 6. **Interactive Component Showcase & Integration Verification** - Build `src/app/page.tsx` as a comprehensive design system explorer demonstrating every component across normal, active, hover, loading, error, and empty states. Verify responsive layout on mobile/desktop and run full build.
  - *Done when:* `npx tsc --noEmit` and `npm run build` succeed with exit code 0.

## Files / areas

- `src/theme/colors.ts` - DZF brand tokens, semantic status palettes, surface neutrals
- `src/theme/typography.ts` - Font family, scale, weights, kicker and monospace styles
- `src/theme/components.ts` - MUI component style overrides (buttons, inputs, cards, tables, chips)
- `src/theme/index.ts` - Centralized theme export and TypeScript module augmentation
- `src/app/layout.tsx` - AppRouterCacheProvider, ThemeProvider, CssBaseline, metadata
- `src/app/globals.css` - CSS reset, selection styling, focus ring defaults
- `src/components/ui/DZFButton.tsx` - Primary, secondary, danger, soft buttons with loading states
- `src/components/ui/DZFTypography.tsx` - PageHeader, Kicker, Subtitle, Mono text
- `src/components/ui/DZFBadge.tsx` - Semantic badges and patron/status pills
- `src/components/ui/DZFInput.tsx` - Form text input with label and validation states
- `src/components/ui/DZFSearchInput.tsx` - Search input with clear and keyboard shortcut
- `src/components/ui/DZFBarcodeInput.tsx` - Hardware scanner auto-submit input
- `src/components/ui/DZFStatCard.tsx` - Metric summary card with icon and trend
- `src/components/ui/DZFDataTable.tsx` - Master data table with sorting, pagination, loading
- `src/components/ui/DZFEmptyState.tsx` - Actionable empty state container
- `src/components/layout/AppShell.tsx` - Layout shell with collapsible sidebar & header
- `src/app/page.tsx` - Interactive design system showcase workbench

## Data / contracts

- `DZFColorTokens`:
  - `maroon`: `{ 500: '#d15b5b', 700: '#a32121', 900: '#6f1111', ... }`
  - `navy`: `{ 700: '#17324d', 900: '#123451', ... }`
  - `gold`: `{ 400: '#f3c44f', 500: '#cca349', 700: '#8b5e0b', ... }`
  - `status`: `{ success: { bg, text, badge }, warning: { bg, text, badge }, error: { bg, text, badge }, info: { bg, text, badge } }`
- `DZFBarcodeInputProps`:
  - `onScan: (barcode: string) => void`
  - `debounceMs?: number` (default: 150ms for hardware scanners)
  - `autoSubmitOnEnter?: boolean` (default: true)
  - `keepFocused?: boolean` (default: true for continuous scanning)
- `DZFDataTableProps<T>`:
  - `columns: Array<{ id: string; label: string; minWidth?: number; align?: 'left'|'right'|'center'; sortable?: boolean; render?: (row: T) => React.ReactNode }>`
  - `data: T[]`
  - `loading?: boolean`
  - `emptyMessage?: string`
  - `pageSize?: number`
  - `page?: number`
  - `totalCount?: number`
  - `onPageChange?: (newPage: number) => void`

## Testing

- Typecheck verification: `npx tsc --noEmit`
- Production build compilation: `npm run build`
- Visual & interaction validation: Component workbench on `http://localhost:3000` displaying:
  - Button loading and disabled states
  - Form validation error styling
  - Barcode scanner auto-submit trigger and input event handling
  - Data table pagination and sorting toggles
  - Collapsible sidebar navigation toggle and responsive drawer

## Notes for the AI

- Next.js 16 App Router requires `@mui/material-nextjs/v16-appRouter` (`AppRouterCacheProvider`) to properly inject Emotion styles during server rendering and avoid Flash of Unstyled Content (FOUC).
- Do not install Tailwind CSS or other CSS frameworks. Use Emotion and MUI's `sx` prop or styled components.
- Ensure all interactive elements have accessible `aria-*` attributes, focus indicators (`--focus-ring`), and clear labels.
- Barcode scanners act as keyboard emulators; `DZFBarcodeInput` must handle fast sequential keypresses ending in an Enter character (`KeyEnter`) without dropping characters.
- Keep components modular and export them from `src/components/ui/` and `src/components/layout/`.

## Open questions

*None. All token values, component requirements, and architectural contracts are fully specified in `design.md` and `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md`.*


<!-- blueprint:completion {"schemaVersion":1,"specBytes":11087,"specSha256":"59fae3630df7ad2a2b47843e776c7ed757e4ea6c4f28f540d91729893975acdc","branch":"refs/heads/feature/design-system-and-reusable-ui-components","head":"446e22170c0014e2eee12d920c1320936896dbf2","baseRef":"refs/heads/main","baseCommit":"446e22170c0014e2eee12d920c1320936896dbf2","sourceTree":"430cd220ef7376508b648296e9946950dc88a09c","absentOptional":[]} -->
