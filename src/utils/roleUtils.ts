/**
 * Role System Constants
 * 
 * The system uses role IDs from the database:
 * - ID 1: superadmin
 * - ID 2: managers  
 * - ID 3: hr
 * - ID 4: employees
 */

export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  MANAGER: 2,
  HR: 3,
  EMPLOYEE: 4,
} as const;

export const ROLE_NAMES = {
  SUPER_ADMIN: 'superadmin',
  MANAGER: 'managers',
  HR: 'hr',
  EMPLOYEE: 'employees',
} as const;

// Map role IDs to their display names
export const ROLE_ID_TO_DISPLAY: Record<number, string> = {
  [ROLE_IDS.SUPER_ADMIN]: 'Super Admin',
  [ROLE_IDS.MANAGER]: 'Manager',
  [ROLE_IDS.HR]: 'HR',
  [ROLE_IDS.EMPLOYEE]: 'Employee',
};

// Map role names to their IDs
export const ROLE_NAME_TO_ID: Record<string, number> = {
  [ROLE_NAMES.SUPER_ADMIN]: ROLE_IDS.SUPER_ADMIN,
  'super_admin': ROLE_IDS.SUPER_ADMIN, // Alias for compatibility
  [ROLE_NAMES.MANAGER]: ROLE_IDS.MANAGER,
  'manager': ROLE_IDS.MANAGER, // Alias for compatibility
  [ROLE_NAMES.HR]: ROLE_IDS.HR,
  [ROLE_NAMES.EMPLOYEE]: ROLE_IDS.EMPLOYEE,
  'employee': ROLE_IDS.EMPLOYEE, // Alias for compatibility
};

// Map role IDs to their names
export const ROLE_ID_TO_NAME: Record<number, string> = {
  [ROLE_IDS.SUPER_ADMIN]: ROLE_NAMES.SUPER_ADMIN,
  [ROLE_IDS.MANAGER]: ROLE_NAMES.MANAGER,
  [ROLE_IDS.HR]: ROLE_NAMES.HR,
  [ROLE_IDS.EMPLOYEE]: ROLE_NAMES.EMPLOYEE,
};

/**
 * Check if a user has a specific role by ID
 */
export const hasRole = (user: { role_id?: number } | null | undefined, roleId: number): boolean => {
  const result = user?.role_id === roleId;
  const stack = new Error().stack;
  const caller = stack?.split('\n')[2]?.trim() || 'unknown';
  console.log('[roleUtils] 🔑 hasRole check:', {
    user_role_id: user?.role_id,
    checking_against: roleId,
    match: result,
    caller
  });
  return result;
};

/**
 * Check if a user has any of the specified roles
 */
export const hasAnyRole = (user: { role_id?: number } | null | undefined, roleIds: number[]): boolean => {
  return roleIds.some(id => user?.role_id === id);
};

/**
 * Check if a user is a super admin
 */
export const isSuperAdmin = (user: { role_id?: number } | null | undefined): boolean => {
  return hasRole(user, ROLE_IDS.SUPER_ADMIN);
};

/**
 * Check if a user is HR
 */
export const isHR = (user: { role_id?: number } | null | undefined): boolean => {
  const result = hasRole(user, ROLE_IDS.HR);
  console.log('[roleUtils] 🔍 isHR check:', {
    user_role_id: user?.role_id,
    expected_role_id: ROLE_IDS.HR,
    result
  });
  return result;
};

/**
 * Check if a user is a manager
 */
export const isManager = (user: { role_id?: number } | null | undefined): boolean => {
  return hasRole(user, ROLE_IDS.MANAGER);
};

/**
 * Check if a user is an employee
 */
export const isEmployee = (user: { role_id?: number } | null | undefined): boolean => {
  return hasRole(user, ROLE_IDS.EMPLOYEE);
};

/**
 * Check if a user is HR or Super Admin
 */
export const isHROrAdmin = (user: { role_id?: number } | null | undefined): boolean => {
  return hasAnyRole(user, [ROLE_IDS.HR, ROLE_IDS.SUPER_ADMIN]);
};

/**
 * Check if a user is Manager or HR
 */
export const isManagerOrHR = (user: { role_id?: number } | null | undefined): boolean => {
  return hasAnyRole(user, [ROLE_IDS.MANAGER, ROLE_IDS.HR]);
};

/**
 * Get role display name from role ID
 */
export const getRoleDisplayName = (roleId: number | undefined): string => {
  if (!roleId) return 'Unknown';
  return ROLE_ID_TO_DISPLAY[roleId] || 'Unknown';
};

/**
 * Get role ID from role name (for backward compatibility)
 */
export const getRoleIdFromName = (roleName: string | undefined): number | undefined => {
  if (!roleName) return undefined;
  return ROLE_NAME_TO_ID[roleName.toLowerCase()];
};

/**
 * Get role badge color based on role ID
 */
export const getRoleBadgeColor = (roleId: number | undefined): string => {
  switch (roleId) {
    case ROLE_IDS.SUPER_ADMIN:
      return 'bg-purple-100 text-purple-800';
    case ROLE_IDS.HR:
      return 'bg-blue-100 text-blue-800';
    case ROLE_IDS.MANAGER:
      return 'bg-green-100 text-green-800';
    case ROLE_IDS.EMPLOYEE:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
