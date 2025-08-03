const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requirePermission, canManageTargetUser } = require('../middleware/rbac');
const Branch = require('../models/Branch'); // Added missing import for Branch

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('username', 'Username or email is required').notEmpty(),
  body('password', 'Password is required').notEmpty()
], async (req, res) => {
  try {
    console.log('[LOGIN] Attempt:', req.body);
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[LOGIN] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Trim whitespace from inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Find user by username or email
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: trimmedUsername },
          { email: trimmedUsername }
        ]
      }
    });
    console.log('[LOGIN] User found:', user ? user.username : null);

    if (!user) {
      console.log('[LOGIN] User not found');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      console.log('[LOGIN] User inactive');
      return res.status(401).json({
        success: false,
        message: 'User is inactive'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(trimmedPassword);
    console.log('[LOGIN] Password match:', isMatch);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Note: We removed lastLogin field from the schema
    // No need to update last login for now

    // Generate token
    const token = generateToken(user.id);
    console.log('[LOGIN] Token generated:', token.substring(0, 20) + '...');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          branch_id: user.branch_id
        }
      }
    });

  } catch (error) {
    console.error('[LOGIN] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user (admin and manager only)
// @access  Private (Admin/Manager)
router.post('/register', [
  authenticateToken,
  requirePermission('users:create'),
  body('username', 'Username is required').isLength({ min: 3, max: 50 }),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  // Removed fullName validation since we don't have that field anymore
  body('role', 'Role is required').isIn(['admin', 'manager', 'operator'])
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { username, email, password, role, branch_id } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Role assignment restrictions
    if (req.user.role === 'manager') {
      // Managers can only create operators
      if (role !== 'operator') {
        return res.status(403).json({
          success: false,
          message: 'Managers can only create operator accounts'
        });
      }
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      role,
      branch_id
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          branch_id: user.branch_id
        }
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: ['Branch']
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          branch_id: user.branch_id
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  authenticateToken,
  body('currentPassword', 'Current password is required').notEmpty(),
  body('newPassword', 'New password must be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email', 'Please include a valid email').isEmail()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real app, send email with reset link
    // For now, just return the token
    res.json({
      success: true,
      message: 'Password reset email sent',
      data: {
        resetToken // Remove this in production
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token', 'Reset token is required').notEmpty(),
  body('newPassword', 'New password must be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Reset token expired'
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/debug-users
// @desc    Debug endpoint to check and fix user credentials (temporary)
// @access  Public (for debugging only)
router.get('/debug-users', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking users in database...');
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'status']
    });
    
    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('🌱 No users found, creating default users...');
      
      // Create main branch if it doesn't exist
      let mainBranch = await Branch.findOne({ where: { name: 'Main Branch' } });
      if (!mainBranch) {
        mainBranch = await Branch.create({
          name: 'Main Branch',
          type: 'main',
          address: '123 Main Street, Lagos',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          phone: '+2348012345678',
          email: 'main@maxgas.com',
          manager: 'John Doe',
          status: 'active'
        });
        console.log('✅ Main branch created');
      }

      // Create users
      const usersToCreate = [
        {
          username: 'admin',
          email: 'admin@maxgas.com',
          password: 'admin123',
          fullName: 'System Administrator',
          role: 'admin',
          branchId: mainBranch.id,
          permissions: ['all'],
          status: 'active'
        },
        {
          username: 'manager1',
          email: 'manager1@maxgas.com',
          password: 'manager123',
          fullName: 'Jane Smith',
          role: 'manager',
          branchId: mainBranch.id,
          permissions: ['customers', 'transactions', 'reports'],
          status: 'active'
        },
        {
          username: 'operator1',
          email: 'operator1@maxgas.com',
          password: 'operator123',
          fullName: 'Michael Brown',
          role: 'operator',
          branchId: mainBranch.id,
          permissions: ['customers', 'transactions'],
          status: 'active'
        }
      ];

      for (const userData of usersToCreate) {
        const user = await User.create(userData);
        console.log(`✅ Created user: ${user.email}`);
      }
      
      return res.json({
        success: true,
        message: 'Users created successfully',
        users: usersToCreate.map(u => ({ username: u.username, email: u.email, role: u.role }))
      });
    }
    
    // Test existing users
    const userTests = [];
    for (const user of users) {
      let testPassword = '';
      if (user.email === 'admin@maxgas.com') testPassword = 'admin123';
      else if (user.email === 'manager1@maxgas.com') testPassword = 'manager123';
      else if (user.email === 'operator1@maxgas.com') testPassword = 'operator123';
      
      if (testPassword) {
        const fullUser = await User.findByPk(user.id);
        const isMatch = await fullUser.comparePassword(testPassword);
        userTests.push({
          email: user.email,
          role: user.role,
          passwordWorks: isMatch
        });
        
        if (!isMatch) {
          console.log(`🔧 Fixing password for ${user.email}...`);
          const hashedPassword = await bcrypt.hash(testPassword, 12);
          await fullUser.update({ password: hashedPassword });
          console.log(`✅ Password fixed for ${user.email}`);
          userTests[userTests.length - 1].passwordFixed = true;
        }
      }
    }
    
    res.json({
      success: true,
      message: 'User check completed',
      users: userTests,
      credentials: {
        admin: 'admin@maxgas.com / admin123',
        manager: 'manager1@maxgas.com / manager123',
        operator: 'operator1@maxgas.com / operator123'
      }
    });
    
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking users',
      error: error.message
    });
  }
});

// @route   GET /api/auth/fix-users
// @desc    Fix operator and manager users (temporary debug endpoint)
// @access  Public (for debugging only)
router.get('/fix-users', async (req, res) => {
  try {
    console.log('🔧 Fixing operator and manager users...');
    
    // Delete existing problematic users
    await User.destroy({ where: { email: 'operator1@maxgas.com' } });
    await User.destroy({ where: { email: 'manager1@maxgas.com' } });
    
    console.log('✅ Deleted existing users');
    
    // Get main branch
    let mainBranch = await Branch.findOne({ where: { name: 'Main Branch' } });
    if (!mainBranch) {
      mainBranch = await Branch.create({
        name: 'Main Branch',
        type: 'main',
        address: '123 Main Street, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        phone: '+2348012345678',
        email: 'main@maxgas.com',
        manager: 'John Doe',
        status: 'active'
      });
    }
    
    // Create new users with the same method as admin
    const managerUser = await User.create({
      username: 'manager1',
      email: 'manager1@maxgas.com',
      password: 'manager123',
      fullName: 'Jane Smith',
      role: 'manager',
      branchId: mainBranch.id,
      permissions: ['customers', 'transactions', 'reports'],
      status: 'active'
    });
    
    const operatorUser = await User.create({
      username: 'operator1',
      email: 'operator1@maxgas.com',
      password: 'operator123',
      fullName: 'Michael Brown',
      role: 'operator',
      branchId: mainBranch.id,
      permissions: ['customers', 'transactions'],
      status: 'active'
    });
    
    console.log('✅ Created new users');
    
    // Test passwords
    const managerTest = await managerUser.comparePassword('manager123');
    const operatorTest = await operatorUser.comparePassword('operator123');
    
    console.log(`Manager password test: ${managerTest ? 'PASS' : 'FAIL'}`);
    console.log(`Operator password test: ${operatorTest ? 'PASS' : 'FAIL'}`);
    
    res.json({
      success: true,
      message: 'Users recreated successfully',
      tests: {
        manager: managerTest,
        operator: operatorTest
      },
      credentials: {
        manager: 'manager1@maxgas.com / manager123',
        operator: 'operator1@maxgas.com / operator123'
      }
    });
    
  } catch (error) {
    console.error('Fix users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing users',
      error: error.message
    });
  }
});

// @route   POST /api/auth/force-reset
// @desc    Force reset a user's password (temporary debug endpoint)
// @access  Public (for debugging only)
router.post('/force-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    console.log(`🔧 Force resetting password for: ${email}`);
    
    // Find the user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Determine the correct password
    let newPassword = '';
    if (email === 'admin@maxgas.com') newPassword = 'admin123';
    else if (email === 'manager1@maxgas.com') newPassword = 'manager123';
    else if (email === 'operator1@maxgas.com') newPassword = 'operator123';
    else {
      return res.status(400).json({
        success: false,
        message: 'Unknown user email'
      });
    }
    
    // Hash the password manually
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log(`🔐 New hash for ${email}: ${hashedPassword.substring(0, 20)}...`);
    
    // Update the password directly
    await user.update({ password: hashedPassword });
    
    // Test the password immediately
    const testUser = await User.findOne({ where: { email } });
    const isMatch = await testUser.comparePassword(newPassword);
    
    console.log(`✅ Password reset for ${email}: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    
    res.json({
      success: true,
      message: `Password reset for ${email}`,
      passwordWorks: isMatch,
      credentials: `${email} / ${newPassword}`
    });
    
  } catch (error) {
    console.error('Force reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
});

module.exports = router; 