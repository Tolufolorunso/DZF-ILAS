# Fix: Admin Role Assignment Power and Confirmation Dialog

**Type:** Fix
**Status:** verified
**Branch:** fix/admin-role-assignment-and-confirm-dialog

## The Problem

1. **Role Hierarchy Restriction in Route Handler**: Currently, `PATCH /api/admin/users/[id]/role` strictly enforces `ROLE_HIERARCHY_RANK` checks preventing administrators (`admin`, rank 50) from assigning roles with a higher rank than their own (such as `country_manager` rank 60 or `ima` rank 70). However, administrative operations require Administrators to have full authority to assign all user roles across the organization (e.g. promoting a librarian to IMA).
2. **Missing Confirmation for Role Adjustments in UI**: In `src/components/admin/StaffActivationQueue.tsx`, when an administrator selects a role for an active staff member in the role dialog, clicking "Save Role Changes" immediately executes the `PATCH` request without a confirmation prompt. Elevating or altering permissions can drastically change a staff member's administrative capabilities and access boundaries, requiring an explicit confirmation box before applying.

## The Fix

1. **Backend Route Handler Update**:
   - In `src/app/api/admin/users/[id]/role/route.ts`, permit any authenticated user with staff activation privileges (`canActivateStaff`: `ima`, `country_manager`, `admin`) to assign any valid role in `ALL_ROLES` to other staff members (e.g. changing librarian to `ima`).
   - Retain the critical safeguard that forbids self-role modification (`sessionUser.id === id || sessionUser.username === user.username`) to prevent accidental session lockouts and self-demotions.
2. **Confirmation Dialog in UI**:
   - In `src/components/admin/StaffActivationQueue.tsx`, introduce a dedicated confirmation modal/prompt step before applying role changes to an active user.
   - Display the staff member's name (@username), their current role, and the requested new role with clear confirmation messaging.
   - Dispatch the `PATCH /api/admin/users/[id]/role` request only after explicit confirmation.

## Build Steps

- [x] 1. **Permit Administrators to assign all user roles in Route Handler** - In `src/app/api/admin/users/[id]/role/route.ts`, allow users authorized with `canActivateStaff` to assign any role in `ALL_ROLES` to target staff members, while preserving the self-modification safeguard. Done when an `admin` can assign `role: 'ima'` to a staff member and receive HTTP 200 with an audit event recorded.
- [x] 2. **Add confirmation dialog for staff role changes in Staff Activation Queue** - In `src/components/admin/StaffActivationQueue.tsx`, add a confirmation step/dialog when submitting role modifications, showing current vs. new role and requiring explicit confirmation before calling the API. Done when changing an active staff member's role requires confirming the prompt before the PATCH request is dispatched.

## Verify

- `npx tsc --noEmit` passes with 0 errors.
- `npm run lint` passes with 0 errors.
- `npm run build` succeeds.
- An `admin` user can assign `role: 'ima'` to a librarian user.
- The UI presents a clear confirmation box when updating a staff member's role.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":3146,"specSha256":"1eee97a7a7ccf81984d0376ebebb7100f636e56e54e3fd36bb76313bf70a0791","branch":"refs/heads/fix/admin-role-assignment-and-confirm-dialog","head":"88e64b1158f9a6ef107403a45a3d9379240d8092","baseRef":"refs/heads/main","baseCommit":"88e64b1158f9a6ef107403a45a3d9379240d8092","sourceTree":"a30b00d51a43f97a10fe5fbfdfe7bcbbab6be585","absentOptional":[]} -->
