# Feature: Staff Authentication, Session Management & Dual-Mode REST API

**From build-plan:** feature 3
**Build attempt:** 1
**Branch:** feature/staff-authentication-session-management-and-dual-mode-rest-api
**Status:** verified

## Goal

Implement complete staff authentication and session management for DZF-ILLS. Support dual-mode authentication (HTTP-only cookies for Next.js web application and Bearer token headers for the Android mobile application). Provide secure password hashing, JWT token issuance, role-based access control (RBAC), authentication Route Handlers (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`), route protection middleware, and a DZF-branded staff login interface with session persistence.

## Design reference

- `blueprint/context/project-overview.md`:
  - Usage model: Authenticated internal staff platform; staff identities verified via JWT sessions. Dual-mode API interoperability (`ils_token` cookies for web, `Authorization: Bearer <token>` for mobile).
  - RBAC roles: `admin`, `asst_admin`, `librarian`, `cohort_lead`, `transcomm_author`, `ima`, `ict`, `facility`.
  - UI/UX: `/auth/login` staff sign-in route, DZF brand tokens (Maroon `#6f1111`, Scholastic Navy `#17324d`, Academic Gold `#cca349`), `/dashboard` protected workspace.
- `SYSTEM_AUDIT_AND_REBUILD_SPECIFICATION.md`:
  - Architecture Section 3: Next.js App Router route handlers, session extraction helpers, standard HTTP response envelopes.

## In scope

- Dependencies:
  - Install `bcryptjs` and `@types/bcryptjs` for secure password hashing.
  - Install `jose` for Edge-compatible Web Crypto JWT signing and verification.
- Auth Core & Utilities (`src/lib/auth/`):
  - `password.ts`: `hashPassword` and `verifyPassword` using bcrypt.
  - `jwt.ts`: Edge-compatible JWT signing and verification with expiration (`JWT_EXPIRES_IN` / default 2 days).
  - `session.ts`: Dual-mode token extractor reading `Authorization: Bearer <token>` or `ils_token` cookie.
  - `rbac.ts`: Role hierarchy and permission check utilities (`hasRole`, `requireAuth`).
- API Route Handlers (`src/app/api/auth/`):
  - `POST /api/auth/login`: Authenticates username + password, verifies active user status, sets HTTP-only `ils_token` cookie, and returns `{ success: true, token, user }`.
  - `POST /api/auth/logout`: Clears the `ils_token` session cookie and returns success response.
  - `GET /api/auth/me`: Validates session via dual-mode extractor and returns sanitized staff user profile.
  - Initial staff seeder utility / endpoint to ensure administrative access is available on fresh databases.
- Route Protection Middleware (`src/middleware.ts`):
  - Protects private web routes (`/dashboard`, `/patrons`, `/catalog`, `/circulations`, `/attendance`, `/cohorts`, `/competitions`, `/transcomm`, `/admin`).
  - Redirects unauthenticated web requests to `/auth/login`.
  - Returns HTTP 401 JSON for unauthenticated protected `/api/*` endpoints.
- Staff Login UI (`src/app/auth/login/page.tsx`):
  - DZF academic branded sign-in screen using Material UI design tokens.
  - Username & password fields with password visibility toggle.
  - Loading states, error banners, and automatic redirect to `/dashboard` upon authentication.
- Protected Dashboard Workspace (`src/app/dashboard/page.tsx`):
  - Server-authenticated dashboard page utilizing `AppShell`.
  - Displays authenticated staff member name, role badge, and session logout button.

## Out of scope

- Patron camera registration and Cloudinary photo upload (Feature 4).
- Book catalog acquisition wizard (Feature 5).
- Circulation checkout and checkin transactions (Feature 6).
- Google Sheets API v4 OAuth service credentials integration (Feature 10).

## Build loop

- `workflow.stepReview`: `"feature"` (implement all steps in sequence, then pause for comprehensive review).
- `workflow.checkpointCommits`: `"disabled"` (work committed on feature branch upon approval).
- Verify command: `npm run lint && npx tsc --noEmit && npm run build`

## Build steps

- [x] 1. **Auth Utilities & Token Engine** - Install `bcryptjs`, `@types/bcryptjs`, and `jose`. Implement `src/lib/auth/password.ts` (bcrypt hashing/verification), `src/lib/auth/jwt.ts` (Edge-compatible signing/verification), and `src/lib/auth/rbac.ts` (role definitions and permission checks).
  - *Done when:* Helper functions pass typecheck and test hashing/verification with zero TypeScript errors.
- [x] 2. **Dual-Mode Session Resolution Helper** - Implement `src/lib/auth/session.ts` extracting credentials from either `Authorization: Bearer <token>` header (mobile) or `ils_token` HTTP-only cookie (web). Export `getSessionUser(request)` and `requireAuth(request)`.
  - *Done when:* `src/lib/auth/session.ts` compiles cleanly and correctly resolves user session payload from both sources.
- [x] 3. **Authentication Route Handlers: Login, Logout & Me** - Implement `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`, and a seed handler `src/app/api/auth/seed/route.ts` (for bootstrapping admin credentials).
  - *Done when:* API routes compile without errors, authenticate against the `User` model, set/clear HTTP-only cookies, and return dual-mode responses.
- [x] 4. **Next.js App Router Auth Middleware** - Create `src/middleware.ts` to inspect requests for valid JWT tokens via cookie or bearer header, protecting internal staff pages and returning 401 for unauthorized API calls.
  - *Done when:* Middleware compiles and route matcher guards internal routes while allowing public assets and `/auth/login`.
- [x] 5. **DZF Staff Login Page & Protected Dashboard** - Create the staff login interface at `src/app/auth/login/page.tsx` with DZF brand styling, form validation, error handling, and redirection. Create `src/app/dashboard/page.tsx` rendering `AppShell` with the authenticated staff user.
  - *Done when:* Login page and dashboard render without hydration issues and pass typecheck.
- [x] 6. **End-to-End Auth Verification & Production Build** - Test credential login, session verification via `/api/auth/me`, logout, and route protection. Run typecheck, linting, and Next.js production build.
  - *Done when:* `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass with exit code 0.

## Files / areas

- `package.json` - add `bcryptjs`, `@types/bcryptjs`, `jose` dependencies
- `src/lib/auth/password.ts` - bcrypt hashing and comparison
- `src/lib/auth/jwt.ts` - Edge-ready JWT token signing and verification
- `src/lib/auth/session.ts` - dual-mode session resolution (cookie + bearer)
- `src/lib/auth/rbac.ts` - role definitions and permission checking
- `src/lib/auth/index.ts` - auth barrel export
- `src/app/api/auth/login/route.ts` - staff credential authentication endpoint
- `src/app/api/auth/logout/route.ts` - session termination endpoint
- `src/app/api/auth/me/route.ts` - session identity resolution endpoint
- `src/app/api/auth/seed/route.ts` - admin user bootstrap seeder
- `src/middleware.ts` - App Router route guard middleware
- `src/app/auth/login/page.tsx` - DZF branded staff login UI
- `src/app/dashboard/page.tsx` - protected staff workspace landing

## Data / contracts

- JWT Payload:
  ```typescript
  export interface ITokenPayload {
    userId: string;
    username: string;
    name: string;
    role: UserRole;
  }
  ```
- Cookie Configuration:
  - Name: `ils_token`
  - Options: `{ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }`
  - MaxAge: 2 days (172800 seconds)
- Login API Contract (`POST /api/auth/login`):
  - Request: `{ username: string, password: string }`
  - Success Response (200):
    ```json
    {
      "success": true,
      "token": "<jwt-token-string>",
      "user": {
        "id": "<user-id>",
        "username": "librarian1",
        "name": "Library Staff",
        "role": "librarian",
        "phone": "0800000000"
      }
    }
    ```
  - Error Response (401 / 403):
    ```json
    {
      "success": false,
      "error": "Invalid username or password"
    }
    ```

## Testing

- Typecheck verification: `npx tsc --noEmit`
- Linter verification: `npm run lint`
- Production build: `npm run build`
- Live API validation:
  - Seed default admin user if absent
  - Test `POST /api/auth/login` receiving 200, JWT token, and Set-Cookie header
  - Test `GET /api/auth/me` with Bearer header and with Cookie
  - Test `POST /api/auth/logout` clearing cookie

## Notes for the AI

- Next.js 16 Edge runtime supports standard Web Crypto APIs; `jose` is 100% compatible in both Node.js Route Handlers and Edge Middleware.
- `bcryptjs` is pure JavaScript, preventing native C++ compilation failures on Windows environments.
- Protect cookies with `httpOnly: true` to prevent XSS exfiltration.
- Always sanitize passwords from user documents before sending them in API responses.

## Open questions

*None. Dual-mode authentication, role schemas, session expiration, and route protection requirements are fully defined in the build plan and project overview.*


<!-- blueprint:completion {"schemaVersion":1,"specBytes":9040,"specSha256":"3ae7b3caaa4bd88eca04a67a024691c4c774ccfd508e444a19dc71919cddd036","branch":"refs/heads/feature/staff-authentication-session-management-and-dual-mode-rest-api","head":"0c44a5d1aa040172fd0d480434c008a85e9e93b4","baseRef":"refs/heads/main","baseCommit":"0c44a5d1aa040172fd0d480434c008a85e9e93b4","sourceTree":"4d86d3867f3ffcb889bb284a654bbd0aa1ce7bfe","absentOptional":[]} -->
