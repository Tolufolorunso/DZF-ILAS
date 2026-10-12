# Feature: Vercel Production Deployment Readiness, Database Resilience & High-Speed Performance Optimization

**From build-plan:** feature 40
**Build attempt:** 1
**Branch:** feature/vercel-production-deployment-readiness-database-resilience-high-speed-performance-optimization
**Status:** verified

## Goal

Prepare DZF-ILAS for robust, high-performance Vercel serverless production deployment. Establish a production `vercel.json` deployment specification with enterprise HTTP security headers and static asset caching directives; harden serverless MongoDB connection pooling and timeout guards in `connectDB` against dropped sockets and cold/warm lambda lifecycles; add root and global React error boundary fallbacks (`src/app/error.tsx` and `src/app/global-error.tsx`) to eliminate unhandled runtime crashes; and validate clean production compilation (`npm run build`) and typecheck across all 43 App Router routes.

## In scope

- Create `vercel.json` at repository root with standard HTTP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `Permissions-Policy`) and edge caching directives for `_next/static/(.*)`.
- Harden `src/lib/db.ts` to detect disconnected/stale sockets in cached lambda singletons (`readyState !== 1`), add `connectTimeoutMS: 10000` and `heartbeatFrequencyMS: 10000` guards alongside existing pool limits (`maxPoolSize: 10`), and cleanly recover failed connection promises.
- Implement root `src/app/error.tsx` with DZF brand styling, clear error reporting, "Try Again" (`reset()`), and "Return to Home" (`/`) navigation.
- Implement root `src/app/global-error.tsx` containing necessary `<html>` and `<body>` tags for critical layout-level failures with an accessible retry action.
- Verify index coverage and `.lean()` query execution on core read endpoints (`/api/admin/tasks`, `/api/patrons`, `/api/catalog`, `/api/circulations`, `/api/attendance`).
- Validate end-to-end production build (`npm run build`) and strict typecheck (`npx tsc --noEmit`) with zero errors.

## Out of scope

- Provisioning remote cloud infrastructure, Vercel account tokens, or MongoDB Atlas clusters (handled via deployment environment variables).
- Altering existing business logic, role hierarchy, or task creator governance rules.
- Introducing external third-party error tracking platforms (e.g., Sentry) or Redis connection brokers.
- Modifying client-side SSE reconnect logic or Web Push notifications (already verified in Phase 14 / Feature 35).

## Build loop

Feature-level review (`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`). Small implementation steps are built sequentially without per-step approval pauses; one complete review packet is presented when all steps are finished.

## Build steps

- [x] 1. **Create `vercel.json` Production Deployment Specification**
  - Create `vercel.json` at repository root with structured routing and header rules:
    - Standard HTTP security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Permissions-Policy: camera=(self), microphone=(), geolocation=(), browsing-topics=()`.
    - Static asset caching directives for `_next/static/(.*)` with `Cache-Control: public, max-age=31536000, immutable`.
  - Done when: `vercel.json` exists at the workspace root with valid JSON formatting and matches Vercel deployment specifications.

- [x] 2. **Harden Serverless MongoDB Connection Pooling & Timeout Guards**
  - Update `src/lib/db.ts` to verify `cached.conn && mongoose.connection.readyState === 1`.
  - If a connection exists in `cached.conn` but its socket has dropped (`readyState !== 1`), clear the cached reference and promise to trigger a clean reconnect.
  - Configure timeout guards in `ConnectOptions`: `connectTimeoutMS: 10000`, `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`, `heartbeatFrequencyMS: 10000`, and `maxPoolSize: 10`.
  - Ensure failed promises reset `cached.promise = null` so subsequent requests can re-attempt connection.
  - Preserve `getDatabaseState()` and `getConnectionState()` backwards compatibility.
  - Done when: `src/lib/db.ts` handles reconnect and state inspection cleanly, and `/api/health/db` returns `{ status: "ok" }` with active connection state.

- [x] 3. **Implement Root & Global React Error Boundaries**
  - Create `src/app/error.tsx`: Root route error boundary for marketing, public routes, and general app pages. Renders DZF branded card with Outfit/Inter typography, error message display, "Try Again" (`reset()`), and "Return to Home" (`/`).
  - Create `src/app/global-error.tsx`: Top-level boundary catching root `app/layout.tsx` errors. Renders `<html>` and `<body>` tags with inline/MUI styling, DZF palette colors, and "Refresh Application" retry button.
  - Done when: Both error boundary components compile cleanly without hydration mismatches and adhere to Next.js App Router error handling specifications.

- [x] 4. **Index Coverage Audit, Lean Execution & Clean Production Build Verification**
  - Verify that high-traffic read operations across core endpoints utilize `.lean()` for high-throughput serialization and memory efficiency.
  - Verify compound index alignment on `Task`, `Patron`, `Cataloging`, and `Attendance` collections.
  - Execute `npx tsc --noEmit` and `npm run build` to validate that all 43 App Router routes compile cleanly into production bundles.
  - Done when: Typecheck and production build finish with exit code 0 and all Next.js routes are compiled successfully.

## Files / areas

- `vercel.json` (New - Vercel deployment specification, security headers, caching directives)
- `src/lib/db.ts` (Modified - Connection state verification, serverless reconnect guards, timeout options)
- `src/app/error.tsx` (New - Root Next.js route error boundary)
- `src/app/global-error.tsx` (New - Root Next.js layout error boundary with html/body)
- `src/models/` and `src/app/api/` (Audited - Index coverage and lean query execution)

## Data / contracts

- `vercel.json`: Valid JSON schema containing `headers` array defining path matchers and header key-value pairs.
- `src/lib/db.ts`: Connection contract exporting `connectDB(): Promise<Mongoose>` and `getConnectionState(): { readyState: number; status: string }`.
- Error boundary props: `{ error: Error & { digest?: string }; reset: () => void }`.
- Health check API contract (`/api/health/db`): `200 OK` JSON `{ status: "ok", database: { status: "connected", readyState: 1, host: string, name: string } }`.

## Testing

- Typecheck verification: `npx tsc --noEmit` must pass with 0 errors.
- Build verification: `npm run build` must compile all static and dynamic routes into production artifacts without errors.
- Health check verification: `GET /api/health/db` returns 200 with connected status.

## Notes for the AI

- Preserve the user's manual edit in `src/app/api/auth/register/route.ts` line 41 (`/^[a-z0-9_]{2,25}$/`).
- `src/app/global-error.tsx` MUST include `<html>` and `<body>` tags because it replaces the root layout when active.
- `src/app/error.tsx` does NOT include `<html>` or `<body>` tags because it renders inside the root layout.
- In `src/lib/db.ts`, check `mongoose.connection.readyState === 1` before returning `cached.conn`.
