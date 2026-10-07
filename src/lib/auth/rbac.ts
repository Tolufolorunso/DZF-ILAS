import type { UserRole } from '@/models/User';

export const ALL_ROLES: UserRole[] = [
  'ima',
  'country_manager',
  'admin',
  'asst_admin',
  'ict',
  'librarian',
  'intern',
  'cohort_lead',
  'transcomm_author',
  'facility',
];

export const ROLE_HIERARCHY_RANK: Record<UserRole, number> = {
  ima: 70,
  country_manager: 60,
  admin: 50,
  asst_admin: 40,
  ict: 30,
  librarian: 20,
  cohort_lead: 20,
  transcomm_author: 20,
  intern: 10,
  facility: 10,
};

export const LEADERSHIP_ROLES: UserRole[] = ['ima', 'country_manager', 'admin'];

/**
 * Check if a role has executive or administrative leadership privileges
 */
export function isLeadershipRole(role: UserRole | string): boolean {
  return LEADERSHIP_ROLES.includes(role as UserRole);
}

/**
 * Task assignment hierarchy verification:
 * - Assigning to self: always permitted for any authenticated staff role (private self-assigned task).
 * - Leadership roles (IMA, Country Manager, Admin):
 *   - IMA can assign to herself, Country Manager, Admin, all staff, and broadcast to 'all'.
 *   - Country Manager can assign to Admin, all subordinate staff, and broadcast to 'all'.
 *   - Admin can assign to himself, all subordinate staff, and broadcast to 'all'.
 * - General staff (librarian, ict, cohort_lead, intern, asst_admin, facility, transcomm_author):
 *   - Can ONLY assign tasks to themselves.
 */
export function canAssignTaskTo(
  assignerRole: UserRole | string,
  targetRoleOrGroup: UserRole | string,
  assignerUsername?: string,
  targetUsername?: string
): boolean {
  // If assigning to self, always allowed for any staff role
  if (
    assignerUsername &&
    targetUsername &&
    assignerUsername.toLowerCase() === targetUsername.toLowerCase()
  ) {
    return true;
  }

  const assigner = assignerRole as UserRole;
  const target = targetRoleOrGroup as string;

  if (assigner === 'ima') {
    return true;
  }

  if (assigner === 'country_manager') {
    return target !== 'ima';
  }

  if (assigner === 'admin') {
    return target !== 'ima' && target !== 'country_manager';
  }

  // Non-leadership roles cannot delegate to anyone else or groups
  return false;
}

export const ALL_STAFF_ROLES: UserRole[] = [
  'ima',
  'country_manager',
  'admin',
  'asst_admin',
  'ict',
  'librarian',
  'cohort_lead',
  'intern',
  'facility',
  'transcomm_author',
];

/**
 * Check if a role has task creation privileges (All staff can create tasks; general staff create self-assigned tasks)
 */
export function canCreateTask(role: UserRole | string): boolean {
  return ALL_STAFF_ROLES.includes(role as UserRole);
}

export const ADMIN_ROLES: UserRole[] = ['ima', 'country_manager', 'admin', 'asst_admin'];
export const CIRCULATION_ROLES: UserRole[] = ['admin', 'asst_admin', 'librarian'];
export const COHORT_ROLES: UserRole[] = ['admin', 'asst_admin', 'cohort_lead', 'ict'];
export const EDITORIAL_ROLES: UserRole[] = ['admin', 'asst_admin', 'transcomm_author'];
export const COMPETITION_ROLES: UserRole[] = ['admin', 'asst_admin', 'librarian'];
export const CERTIFICATE_ROLES: UserRole[] = [
  'admin',
  'asst_admin',
  'librarian',
  'cohort_lead',
  'ict',
];

/**
 * Check if a given user role is included in a list of allowed roles
 */
export function hasRole(role: UserRole | string, allowed: UserRole[]): boolean {
  return allowed.includes(role as UserRole);
}

/**
 * Check if role has administrator privileges
 */
export function isAdmin(role: UserRole | string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

/**
 * Check if role has circulation (checkout/return/cataloging) privileges
 */
export function canManageCirculation(role: UserRole | string): boolean {
  return CIRCULATION_ROLES.includes(role as UserRole);
}

/**
 * Check if role has cohort management and academy instruction privileges
 */
export function canManageCohorts(role: UserRole | string): boolean {
  return COHORT_ROLES.includes(role as UserRole);
}

/**
 * Check if role has editorial article authoring and publishing privileges
 */
export function canPublishArticles(role: UserRole | string): boolean {
  return EDITORIAL_ROLES.includes(role as UserRole);
}

/**
 * Check if role has competition management, check-in, and scoring privileges
 */
export function canManageCompetitions(role: UserRole | string): boolean {
  return COMPETITION_ROLES.includes(role as UserRole);
}

/**
 * Check if role has certificate design, issuance, and studio privileges
 */
export function canManageCertificates(role: UserRole | string): boolean {
  return CERTIFICATE_ROLES.includes(role as UserRole);
}

export const PATRON_UPDATE_ROLES: UserRole[] = ['admin', 'asst_admin', 'ict'];
export const PATRON_DELETE_ROLES: UserRole[] = ['admin'];

/**
 * Check if role has privileges to update/edit patron profiles (Admin and ICT only)
 */
export function canUpdatePatron(role: UserRole | string): boolean {
  return PATRON_UPDATE_ROLES.includes(role as UserRole);
}

/**
 * Check if role has privileges to delete patrons (Admin only)
 */
export function canDeletePatron(role: UserRole | string): boolean {
  return PATRON_DELETE_ROLES.includes(role as UserRole);
}

export const CATALOG_MANAGE_ROLES: UserRole[] = ['admin', 'asst_admin', 'librarian', 'ict'];
export const BOOK_DELETE_ROLES: UserRole[] = ['admin', 'asst_admin'];

/**
 * Check if role has privileges to acquire or edit monograph catalog records
 */
export function canManageCatalog(role: UserRole | string): boolean {
  return CATALOG_MANAGE_ROLES.includes(role as UserRole);
}

/**
 * Check if role has privileges to permanently delete book records (Admin / Assistant Admin only)
 */
export function canDeleteBook(role: UserRole | string): boolean {
  return BOOK_DELETE_ROLES.includes(role as UserRole);
}

export const STAFF_ACTIVATION_ROLES: UserRole[] = ['ima', 'country_manager', 'admin'];

/**
 * Check if role has privileges to activate, deactivate, or delete staff accounts (IMA, Country Manager, Admin only)
 */
export function canActivateStaff(role: UserRole | string): boolean {
  return STAFF_ACTIVATION_ROLES.includes(role as UserRole);
}
