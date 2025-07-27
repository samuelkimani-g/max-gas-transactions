const User = require('../models/User');

// Role hierarchy (higher number = more privileges)
const ROLE_HIERARCHY = {
  'operator': 1,
  'manager': 2,
  'admin': 3
};

// Permission definitions
const PERMISSIONS = {
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
  'customers:delete': ['admin'], // Only admin can delete customers directly
  
  // Approval System
  'approvals:read': ['admin'], // Only admin can see approval management
  'approvals:create': ['manager', 'operator'], // Manager and operator can create approval requests
  'approvals:approve': ['admin'], // Only admin can approve requests
  
  // Transaction Management
  'transactions:read': ['admin', 'manager', 'operator'],
  'transactions:create': ['admin', 'manager', 'operator'],
  'transactions:update': ['admin', 'manager', 'operator'],
  'transactions:delete': ['admin'], // Only admin can delete transactions directly
  
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
const hasRoleLevel = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Check if user can manage target user
const canManageUser = (currentUser, targetUser) => {
  // Admin can manage anyone
  if (currentUser.role === 'admin') return true;
  
  // Manager can manage operators and other managers, but not admins
  if (currentUser.role === 'manager') {
    return targetUser.role !== 'admin';
  }
  
  // Operators can't manage anyone
  return false;
};

// Check if user has permission
const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
};

// Role checking middleware
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RBAC] No user in request for role check');
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[RBAC] Checking role:', req.user.role, 'required:', requiredRole);
    }
    
    if (!hasRoleLevel(req.user.role, requiredRole)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RBAC] Role check failed');
      }
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${requiredRole}`
      });
    }

    next();
  };
};

// Permission checking middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RBAC] No user in request for permission check');
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[RBAC] Checking permission:', permission, 'for user:', req.user.username, 'role:', req.user.role);
    }
    
    if (!hasPermission(req.user.role, permission)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RBAC] Permission check failed');
      }
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

// Middleware to check if user can manage target user
const canManageTargetUser = (req, res, next) => {
  const targetUserId = req.params.id || req.body.userId;
  
  if (!targetUserId) {
    return next();
  }

  User.findByPk(targetUserId)
    .then(targetUser => {
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Target user not found'
        });
      }

      if (!canManageUser(req.user, targetUser)) {
        return res.status(403).json({
          success: false,
          message: 'You cannot manage this user'
        });
      }

      req.targetUser = targetUser;
      next();
    })
    .catch(error => {
      console.error('Error checking user management permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    });
};

// Middleware to filter data based on role
const filterDataByRole = (req, res, next) => {
  // Add role-based filtering to the request
  req.roleFilter = {
    canManageUsers: req.user.role === 'admin' || req.user.role === 'manager',
    canDeleteUsers: req.user.role === 'admin',
    canAssignRoles: req.user.role === 'admin',
    canSeeAllData: req.user.role === 'admin' || req.user.role === 'manager',
    canExportData: req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'operator',
    canManageSystem: req.user.role === 'admin'
  };
  
  next();
};

module.exports = {
  ROLE_HIERARCHY,
  PERMISSIONS,
  hasRoleLevel,
  hasPermission,
  canManageUser,
  requireRole,
  requirePermission,
  canManageTargetUser,
  filterDataByRole
}; 