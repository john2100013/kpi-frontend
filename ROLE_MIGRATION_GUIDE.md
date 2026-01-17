# Frontend Role System Migration Guide

## Overview
This guide documents the migration from role-based string comparisons to role ID-based comparisons in the frontend application.

## Database Role Structure

```sql
-- Roles table in database:
ID 1: 'superadmin'
ID 2: 'managers'
ID 3: 'hr'
ID 4: 'employees'
```

## Changes Made

### 1. Created Role Utilities (`src/utils/roleUtils.ts`)
✅ **COMPLETED**

New utility file with:
- `ROLE_IDS` constants (1=SUPER_ADMIN, 2=MANAGER, 3=HR, 4=EMPLOYEE)
- Helper functions: `hasRole()`, `hasAnyRole()`, `isManager()`, `isHR()`, etc.
- Display functions: `getRoleDisplayName()`, `getRoleBadgeColor()`

### 2. Updated Type Definitions (`src/types/index.ts`)
✅ **COMPLETED**

```typescript
export interface User {
  id: number;
  name: string;
  email?: string;
  role: UserRole; // Keep for backward compatibility
  role_id: number; // ⭐ PRIMARY identifier
  // ... other fields
}
```

### 3. Updated App.tsx
✅ **COMPLETED**

- Added import: `import { ROLE_IDS, isManager } from './utils/roleUtils';`
- Updated `ProtectedRoute` to use `role_id` instead of `role`
- Changed `allowedRoles` prop type from `string[]` to `number[]`
- Updated all route definitions to use `ROLE_IDS.*` constants
- Changed manager route conditional from `user?.role === 'manager'` to `isManager(user)`

##Files Still Requiring Updates

The following files contain role string comparisons that need to be migrated to role_id comparisons:

### Critical Files:

1. **src/components/Sidebar.tsx**
   - Line 35: `if (user?.role === 'manager')` → `if (isManager(user))`
   - Line 37: `} else if (user?.role === 'employee')` → `} else if (isEmployee(user))`
   - Line 44: `if (user?.role === 'manager' && ...` → `if (isManager(user) && ...`
   - Line 46: `} else if (user?.role === 'employee' && ...` → `} else if (isEmployee(user) && ...`
   - Line 162-165: All navigation item conditionals
   - Line 240: `{(user?.role === 'hr' || user?.role === 'super_admin') && (` → `{isHROrAdmin(user) && (`

2. **src/components/Header.tsx**
   - Line 191: `{user?.role}` display → `{getRoleDisplayName(user?.role_id)}`

3. **src/features/shared/pages/**
   - **Profile.tsx**: Lines 230, 251, 382
   - **AcknowledgedKPIs.tsx**: Lines 214, 356
   - **CompletedReviews.tsx**: Lines 217, 374, 384
   - **Employees.tsx**: Lines 95, 136, 299, 302, 407
   - **EditProfile.tsx**: Line 77
   - **Notifications.tsx**: Lines 64, 66, 72

4. **src/features/superadmin/pages/UserManagement.tsx**
   - Line 167-168: Display role badge
   - Line 195: Manager check

5. **src/features/superadmin/components/EditUserModal.tsx**
   - Line 117: Employee check

6. **src/features/manager/Dashboard.tsx**
   - Line 307: `.filter(emp => emp.role === 'employee')` → `.filter(emp => emp.role_id === ROLE_IDS.EMPLOYEE)`

### Template for Updates:

**BEFORE:**
```typescript
if (user?.role === 'manager') {
  // do something
}
if (user?.role === 'hr' || user?.role === 'super_admin') {
  // do something
}
```

**AFTER:**
```typescript
import { isManager, isHROrAdmin, ROLE_IDS } from '../utils/roleUtils';

if (isManager(user)) {
  // do something
}
if (isHROrAdmin(user)) {
  // do something
}
```

## Migration Steps for Each File

### Step 1: Add Import
```typescript
import { 
  ROLE_IDS, 
  isEmployee, 
  isManager, 
  isHR, 
  isSuperAdmin,
  isHROrAdmin,
  isManagerOrHR,
  getRoleDisplayName,
  getRoleBadgeColor
} from '../utils/roleUtils';
// Adjust path based on file location
```

### Step 2: Replace Role String Comparisons

| Old Pattern | New Pattern |
|------------|-------------|
| `user?.role === 'employee'` | `isEmployee(user)` |
| `user?.role === 'manager'` | `isManager(user)` |
| `user?.role === 'hr'` | `isHR(user)` |
| `user?.role === 'super_admin'` | `isSuperAdmin(user)` |
| `user?.role === 'hr' \|\| user?.role === 'super_admin'` | `isHROrAdmin(user)` |
| `user?.role === 'hr' \|\| user?.role === 'manager'` | `isManagerOrHR(user)` |
| `user.role` (display) | `getRoleDisplayName(user.role_id)` |
| `getRoleBadgeColor(user.role)` | `getRoleBadgeColor(user.role_id)` |
| `.filter(u => u.role === 'employee')` | `.filter(u => u.role_id === ROLE_IDS.EMPLOYEE)` |

### Step 3: Update Props and Function Parameters

If a component accepts role as a prop:
```typescript
// BEFORE
interface Props {
  role: string;
}

// AFTER  
interface Props {
  roleId: number;
}
```

## Testing Checklist

After migrating each file:

- [ ] Import statement includes needed utilities
- [ ] All role string comparisons replaced
- [ ] Role displays use `getRoleDisplayName(user.role_id)`
- [ ] Badge colors use `getRoleBadgeColor(user.role_id)`
- [ ] Array filters use `ROLE_IDS.*` constants
- [ ] Type errors resolved
- [ ] Component renders correctly
- [ ] Role-based features work as expected

## Backend Compatibility

The backend ALREADY provides both `role` and `role_id` in the user object:

```javascript
// From auth.middleware.js
SELECT 
  u.id, 
  u.name, 
  u.email,
  r.name AS role,          // ← string name
  r.id AS role_id          // ← numeric ID
FROM users u
JOIN roles r ON u.role_id = r.id
```

So the frontend can use `role_id` immediately without backend changes.

## Migration Priority

### Phase 1: Core Navigation (COMPLETED ✅)
- [x] Role utilities created
- [x] Types updated
- [x] App.tsx routes updated

### Phase 2: Layout Components (IN PROGRESS ⏳)
- [ ] Sidebar.tsx
- [ ] Header.tsx

### Phase 3: Shared Pages (TODO 📋)
- [ ] Profile pages
- [ ] Employee lists
- [ ] KPI lists
- [ ] Notifications

### Phase 4: Feature-Specific Pages (TODO 📋)
- [ ] Manager features
- [ ] HR features  
- [ ] Super Admin features
- [ ] Employee features

### Phase 5: Testing & Validation (TODO 📋)
- [ ] All role checks work
- [ ] No console errors
- [ ] Navigation works for all roles
- [ ] Role-based UI elements display correctly

## Common Pitfalls to Avoid

1. ❌ **Don't compare `role_id` to strings:**
   ```typescript
   if (user.role_id === 'manager') // WRONG!
   ```

2. ❌ **Don't forget to import constants:**
   ```typescript
   if (user.role_id === 2) // WRONG! Magic number
   if (user.role_id === ROLE_IDS.MANAGER) // ✅ CORRECT
   ```

3. ❌ **Don't mix old and new patterns:**
   ```typescript
   if (user.role === 'manager' && user.role_id === ROLE_IDS.HR) // Confusing!
   ```

4. ✅ **Do use helper functions:**
   ```typescript
   if (isManager(user) || isHR(user)) // Clear and maintainable
   ```

## Benefits

1. **Type Safety**: Numbers are less error-prone than strings
2. **Performance**: Numeric comparisons are faster
3. **Maintainability**: Centralized role logic
4. **Consistency**: Single source of truth for role IDs
5. **Database Alignment**: Frontend matches backend schema

## Support

If you encounter issues during migration:
1. Check the `roleUtils.ts` file for available functions
2. Verify user object has `role_id` property
3. Ensure ROLE_IDS constants are imported correctly
4. Test with actual user data from API

---

**Last Updated:** January 14, 2026  
**Status:** Phase 1 Complete, Phase 2 In Progress
