// Frontend Role-Based Access Control System

// Role hierarchy (higher number = more privileges)
export const ROLE_HIERARCHY = {
  'operator': 1,
  'manager': 2,
  'admin': 3
};

// Permission definitions (matching backend)
export const PERMISSIONS = {
  // User Management
  'users:read': ['admin', 'manager'],
  'users:create': ['admin'],
  'users:update': ['admin', 'manager'],
  'users:delete': ['admin'],
  'users:assign_roles': ['admin'],
  
  // Customer Management
  'customers:read': ['admin', 'manager', 'operator'],
  'customers:create': ['admin', 'manager', 'operator'],
  'customers:update': ['admin', 'manager', 'operator'],
  'customers:delete': ['admin', 'manager'], // Operators need approval
  
  // Approval System
  'approvals:read': ['admin', 'manager', 'operator'],
  'approvals:create': ['operator'],
  'approvals:approve': ['admin', 'manager'],
  
  // Transaction Management
  'transactions:read': ['admin', 'manager', 'operator'],
  'transactions:create': ['admin', 'manager', 'operator'],
  'transactions:update': ['admin', 'manager', 'operator'],
  'transactions:delete': ['admin', 'manager'], // Operators need approval
  
  // Analytics & Reports
  'analytics:read': ['admin', 'manager'],
  'reports:generate': ['admin', 'manager'],
  'reports:export': ['admin', 'manager', 'operator'],
  
  // System Management
  'system:settings': ['admin'],
  'system:backup': ['admin'],
  'system:logs': ['admin'],
  
  // Branch Management
  'branches:read': ['admin', 'manager'],
  'branches:create': ['admin'],
  'branches:update': ['admin'],
  'branches:delete': ['admin']
};

// Check if user has required role level
export const hasRoleLevel = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Check if user has permission
export const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
};

// Check if user can manage target user
export const canManageUser = (currentUser, targetUser) => {
  // Admin can manage anyone
  if (currentUser.role === 'admin') return true;
  
  // Manager can manage operators and other managers, but not admins
  if (currentUser.role === 'manager') {
    return targetUser.role !== 'admin';
  }
  
  // Operators can't manage anyone
  return false;
};

// Get role-based UI permissions
export const getUIPermissions = (userRole) => {
  return {
    // Navigation
    canAccessUsers: hasPermission(userRole, 'users:read'),
    canAccessAnalytics: hasPermission(userRole, 'analytics:read'),
    canAccessReports: hasPermission(userRole, 'reports:generate'),
    canAccessExport: hasPermission(userRole, 'reports:export'),
    
    // Customer actions
    canAddCustomer: hasPermission(userRole, 'customers:create'),
    canEditCustomer: hasPermission(userRole, 'customers:update'),
    canDeleteCustomer: hasPermission(userRole, 'customers:delete'),
    
    // Approval actions
    canRequestApproval: hasPermission(userRole, 'approvals:create'),
    canApproveRequests: hasPermission(userRole, 'approvals:approve'),
    canViewApprovals: hasPermission(userRole, 'approvals:read'),
    
    // Transaction actions
    canAddTransaction: hasPermission(userRole, 'transactions:create'),
    canEditTransaction: hasPermission(userRole, 'transactions:update'),
    canDeleteTransaction: hasPermission(userRole, 'transactions:delete'),
    
    // User management
    canCreateUser: hasPermission(userRole, 'users:create'),
    canEditUser: hasPermission(userRole, 'users:update'),
    canDeleteUser: hasPermission(userRole, 'users:delete'),
    canAssignRoles: hasPermission(userRole, 'users:assign_roles'),
    
    // System management
    canManageSystem: hasPermission(userRole, 'system:settings'),
    
    // Role-specific restrictions
    canOnlyCreateOperators: userRole === 'manager',
    canSeeAllUsers: userRole === 'admin',
    canSeeNonAdmins: userRole === 'manager',
    
    // Role display
    roleDisplay: {
      'admin': { label: 'Administrator', color: 'bg-red-500', icon: '👑' },
      'manager': { label: 'Manager', color: 'bg-blue-500', icon: '👔' },
      'operator': { label: 'Operator', color: 'bg-green-500', icon: '👷' }
    }
  };
};

// Hook for using RBAC in components
export const useRBAC = (user) => {
  if (!user) return null;
  
  return {
    user,
    permissions: getUIPermissions(user.role),
    hasPermission: (permission) => hasPermission(user.role, permission),
    hasRoleLevel: (requiredRole) => hasRoleLevel(user.role, requiredRole),
    canManageUser: (targetUser) => canManageUser(user, targetUser),
    roleInfo: getUIPermissions(user.role).roleDisplay[user.role]
  };
}; 