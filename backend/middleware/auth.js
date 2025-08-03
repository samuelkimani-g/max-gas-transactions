const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Authorization header:', authHeader);
      console.log('[AUTH] Token extracted:', token ? token.substring(0, 20) + '...' : null);
    }

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] No token provided');
      }
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] Token decoded:', decoded);
    }
    
    const user = await User.findByPk(decoded.userId);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] User from token:', user ? user.username : null);
    }

    if (!user || !user.is_active) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] User not found or inactive');
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] Invalid token');
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH] Token expired');
      }
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('[AUTH] Middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const authorizePermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has required permissions
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizePermissions
}; 