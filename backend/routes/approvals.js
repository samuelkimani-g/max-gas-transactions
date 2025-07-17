const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const PendingApproval = require('../models/PendingApproval');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// @route   GET /api/approvals
// @desc    Get pending approvals (managers see all, operators see their own)
// @access  Private
router.get('/', [
  authenticateToken,
  requirePermission('approvals:read')
], async (req, res) => {
  try {
    const whereClause = {};
    
    // Operators can only see their own requests
    if (req.user.role === 'operator') {
      whereClause.requestedBy = req.user.id;
    }
    
    // Managers can see all pending requests
    if (req.user.role === 'manager') {
      whereClause.status = 'pending';
    }
    
    // Admins can see all requests
    if (req.user.role === 'admin') {
      // No additional filters for admins
    }

    const approvals = await PendingApproval.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'RequestedByUser',
          attributes: ['id', 'username', 'fullName', 'role']
        },
        {
          model: User,
          as: 'ApprovedByUser',
          attributes: ['id', 'username', 'fullName', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { approvals }
    });

  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/approvals
// @desc    Submit a new approval request (operators only)
// @access  Private
router.post('/', [
  authenticateToken,
  requirePermission('approvals:create'),
  body('requestType').isIn(['customer_edit', 'customer_delete', 'transaction_edit', 'transaction_delete']),
  body('entityType').isIn(['customer', 'transaction']),
  body('entityId').isInt({ min: 1 }),
  body('requestedChanges').isObject(),
  body('reason').optional().isString().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      requestType,
      entityType,
      entityId,
      requestedChanges,
      reason
    } = req.body;

    // Get the original entity data
    let originalData;
    if (entityType === 'customer') {
      const customer = await Customer.findByPk(entityId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      originalData = customer.toJSON();
    } else if (entityType === 'transaction') {
      const transaction = await Transaction.findByPk(entityId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      originalData = transaction.toJSON();
    }

    // Create approval request
    const approval = await PendingApproval.create({
      requestType,
      entityType,
      entityId,
      requestedBy: req.user.id,
      originalData,
      requestedChanges,
      reason,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Approval request submitted successfully',
      data: { approval }
    });

  } catch (error) {
    console.error('Create approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/approvals/:id/approve
// @desc    Approve a pending request (managers/admins only)
// @access  Private
router.put('/:id/approve', [
  authenticateToken,
  requirePermission('approvals:approve'),
  body('managerNotes').optional().isString().isLength({ max: 500 })
], async (req, res) => {
  try {
    const approval = await PendingApproval.findByPk(req.params.id);
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found'
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Approval request has already been processed'
      });
    }

    // Apply the changes
    let updatedEntity;
    if (approval.entityType === 'customer') {
      if (approval.requestType === 'customer_edit') {
        updatedEntity = await Customer.update(approval.requestedChanges, {
          where: { id: approval.entityId },
          returning: true
        });
      } else if (approval.requestType === 'customer_delete') {
        await Customer.destroy({ where: { id: approval.entityId } });
        updatedEntity = { deleted: true };
      }
    } else if (approval.entityType === 'transaction') {
      if (approval.requestType === 'transaction_edit') {
        updatedEntity = await Transaction.update(approval.requestedChanges, {
          where: { id: approval.entityId },
          returning: true
        });
      } else if (approval.requestType === 'transaction_delete') {
        await Transaction.destroy({ where: { id: approval.entityId } });
        updatedEntity = { deleted: true };
      }
    }

    // Update approval status
    await approval.update({
      status: 'approved',
      approvedBy: req.user.id,
      managerNotes: req.body.managerNotes,
      processedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Approval request approved successfully',
      data: { approval, updatedEntity }
    });

  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/approvals/:id/reject
// @desc    Reject a pending request (managers/admins only)
// @access  Private
router.put('/:id/reject', [
  authenticateToken,
  requirePermission('approvals:approve'),
  body('managerNotes').isString().isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Manager notes are required when rejecting'
      });
    }

    const approval = await PendingApproval.findByPk(req.params.id);
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found'
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Approval request has already been processed'
      });
    }

    // Update approval status
    await approval.update({
      status: 'rejected',
      approvedBy: req.user.id,
      managerNotes: req.body.managerNotes,
      processedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Approval request rejected successfully',
      data: { approval }
    });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/approvals/:id
// @desc    Get specific approval request details
// @access  Private
router.get('/:id', [
  authenticateToken,
  requirePermission('approvals:read')
], async (req, res) => {
  try {
    const approval = await PendingApproval.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'RequestedByUser',
          attributes: ['id', 'username', 'fullName', 'role']
        },
        {
          model: User,
          as: 'ApprovedByUser',
          attributes: ['id', 'username', 'fullName', 'role']
        }
      ]
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found'
      });
    }

    // Check if user has permission to view this approval
    if (req.user.role === 'operator' && approval.requestedBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { approval }
    });

  } catch (error) {
    console.error('Get approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 