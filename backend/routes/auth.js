const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sequelize } = require('../config/database');
const { requirePermission } = require('../middleware/rbac');

// Helper function to validate device identifier format
const isValidDeviceIdentifier = (deviceId) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(deviceId);
};

// POST /api/auth/login - Manual login (existing)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = await User.findOne({
      where: { username: username }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/auto-login - Auto-login for trusted devices
router.post('/auto-login', async (req, res) => {
  try {
    const { device_identifier } = req.body;

    if (!device_identifier) {
      return res.status(400).json({
        success: false,
        message: 'Device identifier is required'
      });
    }

    if (!isValidDeviceIdentifier(device_identifier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device identifier format'
      });
    }

    // Check if device is trusted and active
    const trustedDevice = await sequelize.query(`
      SELECT td.*, u.username, u.email
      FROM trusted_devices td
      JOIN users u ON td.user_id = u.id
      WHERE td.device_identifier = ? AND td.is_active = 1
    `, {
      replacements: [device_identifier],
      type: sequelize.QueryTypes.SELECT
    });

    if (trustedDevice.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Device not trusted or inactive',
        code: 'DEVICE_NOT_TRUSTED'
      });
    }

    const device = trustedDevice[0];

    // Update last accessed timestamp
    await sequelize.query(
      'UPDATE trusted_devices SET last_accessed_at = datetime("now") WHERE device_identifier = ?',
      {
        replacements: [device_identifier]
      }
    );

    // Generate JWT with role from trusted device
    const token = jwt.sign(
      { 
        userId: device.user_id, 
        username: device.username, 
        role: device.role,
        deviceId: device_identifier
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Auto-login successful',
      token,
      user: {
        id: device.user_id,
        username: device.username,
        role: device.role
      },
      device: {
        identifier: device_identifier,
        lastAccessed: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Auto-login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/verify - Verify JWT token
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'username', 'role']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      user: user
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/logout - Logout (optional, for audit purposes)
router.post('/logout', async (req, res) => {
  try {
    // For trusted devices, you might want to log the logout
    const { device_identifier } = req.body;
    
    if (device_identifier) {
      await sequelize.query(
        'UPDATE trusted_devices SET last_accessed_at = datetime("now") WHERE device_identifier = ?',
        {
          replacements: [device_identifier]
        }
      );
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 