const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, canManageTargetUser, filterDataByRole } = require('../middleware/rbac');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin and manager only)
// @access  Private (Admin/Manager)
router.get('/', [
  authenticateToken,
  requirePermission('users:read'),
  filterDataByRole
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = '',
      branchId = '',
      sortBy = 'fullName',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Role filter
    if (role) {
      whereClause.role = role;
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Branch filter
    if (branchId) {
      whereClause.branchId = branchId;
    }

    // Role-based filtering
    if (req.user.role === 'manager') {
      // Managers can only see operators and other managers, not admins
      whereClause.role = { [Op.ne]: 'admin' };
    }

    // Get users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'city']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password'] }
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin/Manager)
router.get('/:id', [
  authenticateToken,
  requirePermission('users:read'),
  canManageTargetUser
], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'city', 'phone']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin/Manager)
router.put('/:id', [
  authenticateToken,
  requirePermission('users:update'),
  canManageTargetUser,
  body('fullName').optional().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['admin', 'manager', 'operator']),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('phone').optional().isLength({ min: 10, max: 20 })
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

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Role assignment restrictions
    if (req.body.role) {
      if (req.user.role === 'manager') {
        // Managers can only assign operator role
        if (req.body.role !== 'operator') {
          return res.status(403).json({
            success: false,
            message: 'Managers can only assign operator role'
          });
        }
      }
      
      // Prevent changing admin roles unless you're admin
      if (user.role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can modify admin accounts'
        });
      }
    }

    // Update user
    await user.update(req.body);

    // Return updated user without password
    const updatedUser = await User.findByPk(req.params.id, {
      include: [
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'city']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', [
  authenticateToken,
  requirePermission('users:delete'),
  canManageTargetUser
], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin account'
        });
      }
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/:id/change-password
// @desc    Change user password
// @access  Private (Admin/Manager)
router.post('/:id/change-password', [
  authenticateToken,
  requirePermission('users:update'),
  canManageTargetUser,
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

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = req.body.newPassword;
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

module.exports = router; 