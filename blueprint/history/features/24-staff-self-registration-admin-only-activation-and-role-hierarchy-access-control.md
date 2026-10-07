# Feature: Staff Self-Registration, Admin-Only Activation & Role Hierarchy Access Control

**From build-plan:** feature 24
**Build attempt:** 1
**Branch:** feature/staff-self-registration-admin-only-activation-and-role-hierarchy-access-control

## Goal
Implement a secure staff self-registration system (`/auth/register`) creating inactive accounts, an Admin-Only account activation and staff governance dashboard within the Admin Control Center, pending registration notifications, and top-to-bottom role access control filtering the AppShell navigation and securing routes across the operational hierarchy (IMA -> Country Manager -> Admin -> Asst Admin -> ICT -> Librarian -> Intern).

## In scope
1. **Public Staff Self-Registration (`/auth/register`, `POST /api/auth/register`):**
   - Registration page styled with DZF design system tokens (Scholastic Navy, DZF Maroon, Academic Gold).
   - Form fields: Full Name, Staff Username (alphanumeric, unique), Password (min 6 chars, with confirm password & toggle visibility), Phone Number, and Desired Role selector.
   - Creates `User` document with `active: false` (inactive by default).
   - Dispatches in-app `account_pending` notification to all active administrators (`admin`, `country_manager`, `ima`).
   - Friendly post-registration confirmation view informing the applicant that their account is pending Administrator activation.
   - Link between `/auth/login` and `/auth/register` ("New staff member? Request Account" / "Already registered? Sign In").
2. **Login Rejection for Inactive Accounts (`POST /api/auth/login`):**
   - Clear, user-friendly error response when an inactive account attempts to log in: `"Account pending activation. Please contact the Foundation Administrator to activate your account."`
3. **Admin-Only Account Activation & Staff Governance API:**
   - `GET /api/admin/users`: Lists staff accounts with status (`pending`, `active`, `all`), role, and search filters.
   - `PATCH /api/admin/users/[id]/activate`: Activates an inactive staff account (`active: true`), with optional role assignment adjustment and audit log (`STAFF_ACCOUNT_ACTIVATED`).
   - `PATCH /api/admin/users/[id]/deactivate`: Deactivates an active staff account (`active: false`) with self-deactivation protection and audit log (`STAFF_ACCOUNT_DEACTIVATED`).
   - `PATCH /api/admin/users/[id]/role`: Updates a staff member's assigned role with audit log (`STAFF_ROLE_UPDATED`).
   - `DELETE /api/admin/users/[id]`: Rejects/deletes a pending registration or removes an account with self-deletion protection and audit log (`STAFF_ACCOUNT_DELETED`).
   - Strict privilege check: Only `admin`, `country_manager`, and `ima` can perform staff activation and modification.
4. **Admin Control Center Staff Activation & Directory Tab:**
   - Add Tab 6 in `AdminControlCenterClient.tsx`: **Staff Accounts & Activation Queue**.
   - Pending Activation Queue: Highlighted alert/cards showing pending staff applications with one-click "Activate Account" (with optional role change dialog) and "Reject Application".
   - Active Staff Directory: Searchable, filterable list of all registered staff with role badges, status chips, and quick action controls (Change Role, Deactivate, Reactivate).
5. **AppShell Role Hierarchy Navigation Filtering:**
   - Dynamically filter `navSections` in `src/components/layout/AppShell.tsx` based on `user.role`:
     - Hide `admin` (Staff Admin & Security) from non-admin roles (only visible to `ima`, `country_manager`, `admin`, `asst_admin`).
     - Hide specialized management items (`circulations`, `cohorts`, `competitions`, `certificates`) from roles lacking required permissions.
     - Interns and basic staff only see relevant general workspace sections.
6. **Middleware & Route Security Enforcement:**
   - Add `/auth/register` and `/api/auth/register` to public routes.
   - Guard `/dashboard/admin`: Redirect non-administrative staff to `/dashboard`.
   - Guard `/api/admin/*`: Return 403 Forbidden for non-administrative roles.

## Out of scope
- Isolated POS Thermal Print Engine overhaul (Feature 25).
- Third-party OAuth / SSO integration (Google, Microsoft).
- Automated email/SMS OTP verification (institutional intranet staff workflow).

## Build loop
- Quality gates: TypeScript check (`npx tsc --noEmit`) and production build (`npm run build`).
- Work conducted on local feature branch: `feature/staff-self-registration-admin-only-activation-and-role-hierarchy-access-control`.

## Build steps
1. **Middleware & RBAC Helper Extensions:**
   - Add `/auth/register` and `/api/auth/register` to `PUBLIC_PATHS` in `src/middleware.ts`.
   - Add route protection in `src/middleware.ts` redirecting non-admins attempting to access `/dashboard/admin`.
   - In `src/lib/auth/rbac.ts`, add helper `canActivateStaff(role)` strictly checking `['ima', 'country_manager', 'admin'].includes(role)`.
   - In `src/app/api/auth/login/route.ts`, refine inactive account message to `"Account pending activation. Please contact the Foundation Administrator to activate your account."`
   - *Done when:* Visiting `/auth/register` is permitted without auth; inactive accounts receive clear activation error; RBAC helper compiles.
2. **Build Staff Self-Registration Endpoint (`POST /api/auth/register`):**
   - Create `src/app/api/auth/register/route.ts` validating name, unique username, password hash, phone, and desired role.
   - Persist user with `active: false`.
   - Dispatch `account_pending` notification to all active administrators.
   - *Done when:* Valid registration returns 201 with `active: false` user in MongoDB and dispatches admin notification.
3. **Build Staff Self-Registration UI Page (`/auth/register`):**
   - Create `src/app/auth/register/page.tsx` with DZF brand styling, role selector, password visibility toggle, validation, and success state.
   - Add navigation links between `/auth/login` and `/auth/register`.
   - *Done when:* Prospective staff can fill and submit registration form, view success confirmation, and navigate between login and register.
4. **Build Admin Staff Governance & Activation API Routes:**
   - Create `src/app/api/admin/users/route.ts` supporting `GET` to list staff users with filters (`pending`, `active`, `role`, `search`).
   - Create `src/app/api/admin/users/[id]/activate/route.ts` supporting `PATCH` to activate accounts and optionally adjust role.
   - Create `src/app/api/admin/users/[id]/deactivate/route.ts` supporting `PATCH` to deactivate accounts.
   - Create `src/app/api/admin/users/[id]/role/route.ts` supporting `PATCH` to update staff roles.
   - Update `src/app/api/admin/users/[id]/route.ts` (or create it) supporting `DELETE` to remove accounts.
   - *Done when:* Admins can query pending/active staff, activate with role adjustment, deactivate, and delete accounts via API.
5. **Build Staff Accounts & Activation Queue Component (`StaffActivationQueue.tsx`):**
   - Create `src/components/admin/StaffActivationQueue.tsx` with:
     - Pending Activation Queue banner and cards with "Activate Account" and "Reject Application".
     - Active Staff Directory table with search, role badges, status chips, and action menus (Change Role, Deactivate).
     - Role change confirmation dialog.
   - Export from `src/components/admin/index.ts`.
   - *Done when:* Component renders pending and active staff with responsive management controls.
6. **Integrate into Admin Control Center (`AdminControlCenterClient.tsx`):**
   - Add Tab 6 in `AdminControlCenterClient.tsx` ("Staff Accounts & Activation Queue") with pending count badge on the tab header.
   - Mount `StaffActivationQueue` component.
   - *Done when:* Admin can switch to Tab 6 and manage pending staff activations.
7. **Filter AppShell Navigation by Role Hierarchy:**
   - In `src/components/layout/AppShell.tsx`, dynamically filter `navSections` based on `user.role` (hide Admin for non-admins, hide circulation/cohort/competition for unauthorized staff).
   - Run `npx tsc --noEmit` and `npm run build` to verify zero regressions across all pages.
   - *Done when:* Interns/non-admins see only authorized sections; typecheck and build pass with 0 errors.

## Files / areas
- `src/middleware.ts` - Add register public routes and `/dashboard/admin` protection.
- `src/lib/auth/rbac.ts` - Add `canActivateStaff` and role navigation mapping.
- `src/app/api/auth/register/route.ts` - New registration route with inactive default and admin notification.
- `src/app/api/auth/login/route.ts` - Clear pending activation message.
- `src/app/auth/register/page.tsx` - New staff registration page.
- `src/app/auth/login/page.tsx` - Add link to registration page.
- `src/app/api/admin/users/route.ts` - Staff directory query endpoint.
- `src/app/api/admin/users/[id]/activate/route.ts` - Account activation endpoint.
- `src/app/api/admin/users/[id]/deactivate/route.ts` - Account deactivation endpoint.
- `src/app/api/admin/users/[id]/role/route.ts` - Role modification endpoint.
- `src/app/api/admin/users/[id]/route.ts` - Account deletion endpoint.
- `src/components/admin/StaffActivationQueue.tsx` - New activation queue and staff directory UI component.
- `src/components/admin/index.ts` - Export new component.
- `src/app/dashboard/admin/AdminControlCenterClient.tsx` - Mount Tab 6 for staff governance.
- `src/components/layout/AppShell.tsx` - Dynamic role-based navigation filtering.

## Data / contracts
- **User Document Registration Default:**
  ```ts
  {
    name: string;
    username: string; // lowercase, unique
    password: string; // bcrypt hash
    phone: string;
    role: UserRole; // default requested role
    active: false;  // inactive until admin activates
    createdAt: Date;
    updatedAt: Date;
  }
  ```
- **Activation Payload (`PATCH /api/admin/users/[id]/activate`):**
  ```ts
  {
    role?: UserRole; // optional override by admin upon activation
  }
  ```
- **Notification Type:** `'account_pending'` dispatched to all active admins.

## Testing
- Logic testing: Verify self-registration creates `active: false` user in MongoDB and cannot log in until activated. (PASSED - verified in integration test)
- Activation testing: Verify admin can activate user, change role, and that the activated user can then log in successfully. (PASSED - verified in integration test)
- Navigation testing: Verify AppShell hides administrative items for non-admin accounts. (PASSED - verified capability matrix and dynamic navSections filtering)
- Build verification: `npx tsc --noEmit` and `npm run build`. (PASSED - 0 errors, 43 routes compiled cleanly)

## Status
- Implementation complete and verified across all 7 steps.
- Ready for final check and completion review (`/complete`).

## Notes for the AI
- Self-deactivation and self-deletion must be strictly prevented so administrators cannot lock themselves out.
- Ensure all passwords are securely hashed using `hashPassword` before saving.
- Dispatched admin notifications must include direct link to `/dashboard/admin?tab=staff`.
- Follow DZF design system colors (Scholastic Navy, DZF Maroon, Academic Gold).

## Open questions
- None. Requirements and role hierarchy are well-established.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":11166,"specSha256":"a2278cbcb731e144c8ada77bf63713337a45a41e6a45679521e868e0167784d0","branch":"refs/heads/feature/staff-self-registration-admin-only-activation-and-role-hierarchy-access-control","head":"4c4910d1493209d05f19c89c961956d5ab014c31","baseRef":"refs/heads/main","baseCommit":"4c4910d1493209d05f19c89c961956d5ab014c31","sourceTree":"dbf4dcb2a7d3e8294ccf528ed0d40e2c5ccb67e9","absentOptional":[]} -->
