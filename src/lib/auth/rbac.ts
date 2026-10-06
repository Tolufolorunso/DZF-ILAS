import type { UserRole } from '@/models/User';

export const ALL_ROLES: UserRole[] = [
  'admin',
  'asst_admin',
  'librarian',
  'cohort_lead',
  'transcomm_author',
  'ima',
  'ict',
  'facility',
];

export const ADMIN_ROLES: UserRole[] = ['admin', 'asst_admin'];
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


