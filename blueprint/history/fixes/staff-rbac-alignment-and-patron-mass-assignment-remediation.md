# Fix: Staff RBAC Alignment and Patron Mass-Assignment Remediation

**Type:** Fix
**Status:** verified
**Branch:** fix/rbac-and-patron-hardening
**Fixes:** F-04, F-05, F-06

## The Problem

1. **F-04 (Role Hierarchy Escalation)**: `PATCH /api/admin/users/[id]/role` allows any administrator (`admin`, `country_manager`, `ima`) to assign any role in `ALL_ROLES` without hierarchy checks, and allows self-role modification. An administrator (`admin`, rank 50) can escalate themselves or assign leadership roles (`country_manager` rank 60, `ima` rank 70).
2. **F-05 (Circulation Policy Drift)**: `src/app/api/circulations/check-out/route.ts`, `check-in/route.ts`, and `renew/route.ts` hardcode `const allowedRoles = ['admin', 'librarian', 'ict']` instead of using the canonical RBAC function `canManageCirculation(auth.role)`. Consequently, Assistant Administrators (`asst_admin`), who are explicitly authorized under `CIRCULATION_ROLES`, receive an HTTP 403 Forbidden on circulation actions.
3. **F-06 (Patron Mass Assignment)**: `PUT /api/patrons/[id]` only strips `barcode` and `_id` before passing `{ $set: body }` directly to `Patron.findByIdAndUpdate`. Arbitrary protected schema attributes like `points`, `isDeleted`, `registeredBy`, `library`, and `hasBorrowedBook` can be overwritten by untrusted callers.

## The Fix

1. **F-04**:
   - Forbid self-role modification (`sessionUser.id === id` or matching username).
   - Enforce `ROLE_HIERARCHY_RANK`: require the actor to have a strictly higher rank than the target user's current role (unless `ima`), and require the assigned role to be strictly lower than or equal to the actor's rank.
2. **F-05**:
   - Align `CIRCULATION_ROLES` in `src/lib/auth/rbac.ts` to include `['ima', 'country_manager', 'admin', 'asst_admin', 'librarian', 'ict']` so all operational staff and leadership with circulation duties are recognized.
   - Replace hardcoded role arrays in `check-out/route.ts`, `check-in/route.ts`, and `renew/route.ts` with `canManageCirculation(auth.role)`.
3. **F-06**:
   - In `src/app/api/patrons/[id]/route.ts`, extract and sanitize only permitted mutable profile fields (`firstname`, `surname`, `middlename`, `email`, `phoneNumber`, `gender`, `address`, `dateOfBirth`, `patronType`, `studentSchoolInfo`, `employerInfo`, `parentInfo`, `image_url`, `messagePreferences`, `active`).
   - Discard all protected properties (`points`, `isDeleted`, `registeredBy`, `barcode`, `_id`, `library`, `registeredDate`, `hasBorrowedBook`, `lastBorrowedItem`).

## Build Steps

- [x] 1. **Enforce role hierarchy and forbid self-role modification** - In `src/app/api/admin/users/[id]/role/route.ts`, check that the actor is not modifying their own role, that the actor has higher rank than the target's current rank (unless actor is IMA), and that the requested new role rank does not exceed the actor's rank. Done when attempting self-role modification or assigning a role above the actor's rank returns HTTP 403.
- [x] 2. **Harmonize circulation Route Handlers with RBAC `canManageCirculation`** - Update `CIRCULATION_ROLES` in `src/lib/auth/rbac.ts` to include `asst_admin` and `ict` alongside admin and librarian, and replace hardcoded role checks in `src/app/api/circulations/check-out/route.ts`, `check-in/route.ts`, and `renew/route.ts` with `canManageCirculation(auth.role)`. Done when `asst_admin` can successfully access checkout, check-in, and renewal endpoints without HTTP 403.
- [x] 3. **Sanitize patron update payloads against an explicit mutable fields allowlist** - In `src/app/api/patrons/[id]/route.ts`, construct the update payload strictly from authorized profile fields, ignoring any sensitive internal attributes like `points` or `isDeleted`. Done when sending `{ points: 9999, isDeleted: true }` in a patron update request leaves existing points and deletion status unmodified in the database.

## Verify

- `npx tsc --noEmit` passes with 0 errors.
- `npm run lint` passes with 0 errors.
- `npm run build` succeeds.
- Automated API checks verify role hierarchy bounds, circulation authorization for assistant admin, and patron update mass-assignment sanitization.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":4137,"specSha256":"9eab29f2b2c576a41dea5157d93e214b98b69e723feeb9a91cef1577a7302690","branch":"refs/heads/fix/rbac-and-patron-hardening","head":"f92301926e6bcda14d5e6b7a87403da9731328d1","baseRef":"refs/heads/main","baseCommit":"f92301926e6bcda14d5e6b7a87403da9731328d1","sourceTree":"433463e24a88045b96e8917ac9a794cb008a26e8","absentOptional":[]} -->

## Findings

### staff-rbac-alignment-and-patron-mass-assignment-remediation/F-04 [P2] closed - Privilege escalation and hierarchy bypass in staff role modification

**File:** src/app/api/admin/users/[id]/role/route.ts:31
**Found:** 2026-10-07 by /audit (scope: full; lens: security)
**Why it matters:** In `PATCH /api/admin/users/[id]/role`, any user satisfying `canActivateStaff` (`ima`, `country_manager`, or `admin`) can assign ANY role from `ALL_ROLES`. An `admin` (rank 50) can assign `role: 'ima'` (rank 70) or `role: 'country_manager'` (rank 60), or promote their own account to `ima`.
**Suggested fix:** Enforce `ROLE_HIERARCHY_RANK` so an administrator can only assign roles strictly lower than or equal to their own rank, and forbid self-role modification.
**Resolution:** Repaired in fix/rbac-and-patron-hardening. Added check preventing self-role modification and enforced ROLE_HIERARCHY_RANK in PATCH /api/admin/users/[id]/role: non-IMA leadership cannot modify staff of equal/higher rank and cannot assign roles with rank exceeding their own. Re-reviewed and verified.

### staff-rbac-alignment-and-patron-mass-assignment-remediation/F-05 [P2] closed - RBAC policy drift in circulation checkout and check-in endpoints

**File:** src/app/api/circulations/check-out/route.ts:19
**Found:** 2026-10-07 by /audit (scope: full; lens: quality)
**Why it matters:** `check-out/route.ts` and `check-in/route.ts` hardcode `const allowedRoles = ['admin', 'librarian', 'ict']` instead of importing and calling `canManageCirculation(auth.role)` from `src/lib/auth/rbac.ts`. Consequently, `asst_admin` (who is authorized under `CIRCULATION_ROLES`) is denied checkout/checkin access with HTTP 403.
**Suggested fix:** Import and use `canManageCirculation(auth.role)` from `src/lib/auth/rbac.ts` in both circulation Route Handlers.
**Resolution:** Repaired in fix/rbac-and-patron-hardening. Harmonized CIRCULATION_ROLES in rbac.ts to include ima, country_manager, admin, asst_admin, librarian, and ict, and replaced hardcoded role lists with canManageCirculation across check-out, check-in, renew, and holds routes. Re-reviewed and verified.

### staff-rbac-alignment-and-patron-mass-assignment-remediation/F-06 [P2] closed - Mass assignment risk in patron profile update handler

**File:** src/app/api/patrons/[id]/route.ts:144
**Found:** 2026-10-07 by /audit (scope: full; lens: security)
**Why it matters:** `PUT /api/patrons/[id]` only deletes `barcode` and `_id` before passing `{ $set: body }` directly to `Patron.findByIdAndUpdate`. Arbitrary schema attributes such as `points`, `isDeleted`, or `registeredBy` can be manipulated without domain validation.
**Suggested fix:** Validate update payloads against an explicit allowlist or Zod schema containing only mutable profile fields (`firstname`, `surname`, `middlename`, `email`, `phoneNumber`, `gender`, `address`, `dateOfBirth`, `studentSchoolInfo`, `parentInfo`, `employerInfo`, `image_url`).
**Resolution:** Repaired in fix/rbac-and-patron-hardening. Implemented strict allowlist extraction in PUT /api/patrons/[id] mapping only mutable profile attributes into updateData and discarding all protected system fields (points, isDeleted, registeredBy, library, barcode, _id). Re-reviewed and verified.
