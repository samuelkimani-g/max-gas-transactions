const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { authenticateToken, authorizePermissions, authorizeRoles } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Helper function to calculate transaction total
function calculateTransactionTotal(transaction) {
  // MaxGas Refills - Price is per kg
  const refillTotal =
    (transaction.return6kg || 0) * 6 * (transaction.refillPrice6kg || 135) +
    (transaction.return13kg || 0) * 13 * (transaction.refillPrice13kg || 135) +
    (transaction.return50kg || 0) * 50 * (transaction.refillPrice50kg || 135)

  // MaxGas Outright - Price is per cylinder
  const outrightTotal =
    (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200) +
    (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500) +
    (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500)

  // Swipes - Price is per kg
  const swipeTotal =
    (transaction.swipeReturn6kg || 0) * 6 * (transaction.swipeRefillPrice6kg || 160) +
    (transaction.swipeReturn13kg || 0) * 13 * (transaction.swipeRefillPrice13kg || 160) +
    (transaction.swipeReturn50kg || 0) * 50 * (transaction.swipeRefillPrice50kg || 160)

  return refillTotal + outrightTotal + swipeTotal
}

// @route   GET /api/transactions
// @desc    Get all transactions with pagination and filters
// @access  Private
router.get('/', [
  authenticateToken,
  requirePermission('transactions:read')
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      customerId = '',
      branchId = '',
      userId = '',
      startDate = '',
      endDate = '',
      status = '',
      paymentMethod = '',
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Customer filter
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Branch filter
    if (branchId) {
      whereClause.branchId = branchId;
    } else if (req.user.role === 'operator') {
      // Operators can see all transactions (no filtering by user for now)
      // This allows operators to see transactions they didn't create
      // TODO: Implement proper user tracking for transactions
    } else if (req.user.role === 'manager') {
      // Managers can see all transactions from their branch
      whereClause.branchId = req.user.branchId;
    }
    // Admins can see all transactions (no filter)

    // User filter
    if (userId) {
      whereClause.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.date[Op.lte] = new Date(endDate);
      }
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Payment method filter
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }

    // Get transactions with pagination
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'Customer',
          attributes: ['id', 'name', 'phone', 'category']
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'city']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        transactions,
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
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get transaction by ID
// @access  Private
router.get('/:id', [
  authenticateToken,
  requirePermission('transactions:read')
], async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          as: 'Customer',
          attributes: ['id', 'name', 'phone', 'email', 'category', 'balance']
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'city', 'phone']
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', [
  authenticateToken,
  requirePermission('transactions:create'),
  body('customerId', 'Customer ID is required').isInt(),
  body('date', 'Date is required').isISO8601(),
  // Payment method is completely optional - no validation
  body('notes').optional().isString()
], async (req, res) => {
  try {
    console.log('[DEBUG] POST /transactions - Request body:', req.body);
    console.log('[DEBUG] POST /transactions - paymentMethod in body:', req.body.paymentMethod);
    console.log('[DEBUG] POST /transactions - paid amount:', req.body.paid);
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      customerId,
      date,
      maxGas6kgLoad = 0,
      maxGas13kgLoad = 0,
      maxGas50kgLoad = 0,
      return6kg = 0,
      return13kg = 0,
      return50kg = 0,
      outright6kg = 0,
      outright13kg = 0,
      outright50kg = 0,
      swipeReturn6kg = 0,
      swipeReturn13kg = 0,
      swipeReturn50kg = 0,
      refillPrice6kg = 135,
      refillPrice13kg = 135,
      refillPrice50kg = 135,
      outrightPrice6kg = 3200,
      outrightPrice13kg = 3500,
      outrightPrice50kg = 8500,
      swipeRefillPrice6kg = 160,
      swipeRefillPrice13kg = 160,
      swipeRefillPrice50kg = 160,
      paid = 0,
      paymentMethod = null,
      notes,
      reference
    } = req.body;

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Convert all values to numbers to prevent string concatenation
    const numReturn6kg = Number(return6kg) || 0;
    const numReturn13kg = Number(return13kg) || 0;
    const numReturn50kg = Number(return50kg) || 0;
    const numOutright6kg = Number(outright6kg) || 0;
    const numOutright13kg = Number(outright13kg) || 0;
    const numOutright50kg = Number(outright50kg) || 0;
    const numSwipeReturn6kg = Number(swipeReturn6kg) || 0;
    const numSwipeReturn13kg = Number(swipeReturn13kg) || 0;
    const numSwipeReturn50kg = Number(swipeReturn50kg) || 0;
    const numRefillPrice6kg = Number(refillPrice6kg) || 135;
    const numRefillPrice13kg = Number(refillPrice13kg) || 135;
    const numRefillPrice50kg = Number(refillPrice50kg) || 135;
    const numOutrightPrice6kg = Number(outrightPrice6kg) || 3200;
    const numOutrightPrice13kg = Number(outrightPrice13kg) || 3500;
    const numOutrightPrice50kg = Number(outrightPrice50kg) || 8500;
    const numSwipeRefillPrice6kg = Number(swipeRefillPrice6kg) || 160;
    const numSwipeRefillPrice13kg = Number(swipeRefillPrice13kg) || 160;
    const numSwipeRefillPrice50kg = Number(swipeRefillPrice50kg) || 160;
    const numPaid = Number(paid) || 0;

    // Calculate total with proper numeric operations
    const refillTotal = 
      (numReturn6kg * 6 * numRefillPrice6kg) +
      (numReturn13kg * 13 * numRefillPrice13kg) +
      (numReturn50kg * 50 * numRefillPrice50kg);

    const outrightTotal = 
      (numOutright6kg * numOutrightPrice6kg) +
      (numOutright13kg * numOutrightPrice13kg) +
      (numOutright50kg * numOutrightPrice50kg);

    const swipeTotal = 
      (numSwipeReturn6kg * 6 * numSwipeRefillPrice6kg) +
      (numSwipeReturn13kg * 13 * numSwipeRefillPrice13kg) +
      (numSwipeReturn50kg * 50 * numSwipeRefillPrice50kg);

    const total = parseFloat((refillTotal + outrightTotal + swipeTotal).toFixed(2));
    const balance = parseFloat((total - numPaid).toFixed(2));

    console.log('[DEBUG] Calculated total:', total, 'balance:', balance);

    // Credit limit check removed - allow all transactions regardless of payment

    // Generate invoice number
    const invoiceNumber = await Transaction.generateInvoiceNumber();

    // Create transaction
    const transaction = await Transaction.create({
      customerId: Number(customerId),
      userId: req.user.id,
      branchId: req.user.branchId,
      date: new Date(date),
      maxGas6kgLoad: Number(maxGas6kgLoad) || 0,
      maxGas13kgLoad: Number(maxGas13kgLoad) || 0,
      maxGas50kgLoad: Number(maxGas50kgLoad) || 0,
      return6kg: numReturn6kg,
      return13kg: numReturn13kg,
      return50kg: numReturn50kg,
      outright6kg: numOutright6kg,
      outright13kg: numOutright13kg,
      outright50kg: numOutright50kg,
      swipeReturn6kg: numSwipeReturn6kg,
      swipeReturn13kg: numSwipeReturn13kg,
      swipeReturn50kg: numSwipeReturn50kg,
      refillPrice6kg: numRefillPrice6kg,
      refillPrice13kg: numRefillPrice13kg,
      refillPrice50kg: numRefillPrice50kg,
      outrightPrice6kg: numOutrightPrice6kg,
      outrightPrice13kg: numOutrightPrice13kg,
      outrightPrice50kg: numOutrightPrice50kg,
      swipeRefillPrice6kg: numSwipeRefillPrice6kg,
      swipeRefillPrice13kg: numSwipeRefillPrice13kg,
      swipeRefillPrice50kg: numSwipeRefillPrice50kg,
      total,
      paid: numPaid,
      balance,
      paymentMethod: 'credit', // Always default to credit - payments can be recorded later
      notes,
      reference,
      invoiceNumber,
      status: 'completed'
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', [
  authenticateToken,
  requirePermission('transactions:update'),
  body('date').optional().isISO8601(),
  body('paymentMethod').optional().isIn(['cash', 'card', 'transfer', 'credit']),
  body('status').optional().isIn(['pending', 'completed', 'cancelled', 'refunded'])
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

    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Allow updates to all transaction fields
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.customerId;
    delete updateData.userId;
    delete updateData.branchId;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.invoiceNumber;
    
    // Recalculate total and balance if pricing or quantities changed
    if (updateData.return6kg !== undefined || updateData.return13kg !== undefined || 
        updateData.return50kg !== undefined || updateData.outright6kg !== undefined || 
        updateData.outright13kg !== undefined || updateData.outright50kg !== undefined ||
        updateData.swipeReturn6kg !== undefined || updateData.swipeReturn13kg !== undefined || 
        updateData.swipeReturn50kg !== undefined || updateData.refillPrice6kg !== undefined ||
        updateData.refillPrice13kg !== undefined || updateData.refillPrice50kg !== undefined ||
        updateData.outrightPrice6kg !== undefined || updateData.outrightPrice13kg !== undefined ||
        updateData.outrightPrice50kg !== undefined || updateData.swipeRefillPrice6kg !== undefined ||
        updateData.swipeRefillPrice13kg !== undefined || updateData.swipeRefillPrice50kg !== undefined) {
      
      const total = (
        ((updateData.return6kg || transaction.return6kg) * 6 * (updateData.refillPrice6kg || transaction.refillPrice6kg)) +
        ((updateData.return13kg || transaction.return13kg) * 13 * (updateData.refillPrice13kg || transaction.refillPrice13kg)) +
        ((updateData.return50kg || transaction.return50kg) * 50 * (updateData.refillPrice50kg || transaction.refillPrice50kg)) +
        ((updateData.outright6kg || transaction.outright6kg) * (updateData.outrightPrice6kg || transaction.outrightPrice6kg)) +
        ((updateData.outright13kg || transaction.outright13kg) * (updateData.outrightPrice13kg || transaction.outrightPrice13kg)) +
        ((updateData.outright50kg || transaction.outright50kg) * (updateData.outrightPrice50kg || transaction.outrightPrice50kg)) +
        ((updateData.swipeReturn6kg || transaction.swipeReturn6kg) * 6 * (updateData.swipeRefillPrice6kg || transaction.swipeRefillPrice6kg)) +
        ((updateData.swipeReturn13kg || transaction.swipeReturn13kg) * 13 * (updateData.swipeRefillPrice13kg || transaction.swipeRefillPrice13kg)) +
        ((updateData.swipeReturn50kg || transaction.swipeReturn50kg) * 50 * (updateData.swipeRefillPrice50kg || transaction.swipeRefillPrice50kg))
      );
      
      updateData.total = total;
      updateData.balance = total - (updateData.paid || transaction.paid);
    }

    await transaction.update(updateData);

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction (Admin only)
// @access  Private (Admin only)
router.delete('/:id', [
  authenticateToken,
  requirePermission('transactions:delete')
], async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if transaction is recent (within 7 days for business flexibility)
    const hoursSinceCreation = (new Date() - transaction.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 168) { // 7 days = 168 hours
      return res.status(400).json({
        success: false,
        message: 'Cannot delete transactions older than 7 days'
      });
    }

    await transaction.destroy();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/transactions/:id/payment
// @desc    Record additional payment for transaction
// @access  Private
router.post('/:id/payment', [
  authenticateToken,
  requirePermission('transactions:update'),
  body('amount', 'Amount is required').isFloat({ min: 0.01 }),
  body('method', 'Payment method is required').isIn(['cash', 'card', 'transfer']),
  body('notes').optional().isString()
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

    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const { amount, method, notes } = req.body;

    // Record payment
    await transaction.recordPayment(amount, method, notes);

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/transactions/stats/summary
// @desc    Get transaction summary statistics
// @access  Private
router.get('/stats/summary', [
  authenticateToken,
  requirePermission('transactions:read')
], async (req, res) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const whereClause = {};

    // Date range filter
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.date[Op.lte] = new Date(endDate);
      }
    }

    // Branch filter
    if (branchId) {
      whereClause.branchId = branchId;
    } else if (req.user.role !== 'admin') {
      whereClause.branchId = req.user.branchId;
    }

    // Get summary statistics
    const [
      totalTransactions,
      totalRevenue,
      totalPaid,
      outstandingAmount,
      todayTransactions,
      todayRevenue
    ] = await Promise.all([
      Transaction.count({ where: whereClause }),
      Transaction.sum('total', { where: whereClause }),
      Transaction.sum('paid', { where: whereClause }),
      Transaction.sum('balance', { where: { ...whereClause, balance: { [Op.gt]: 0 } } }),
      Transaction.count({
        where: {
          ...whereClause,
          date: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
            [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      Transaction.sum('total', {
        where: {
          ...whereClause,
          date: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
            [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalTransactions: totalTransactions || 0,
          totalRevenue: parseFloat(totalRevenue || 0).toFixed(2),
          totalPaid: parseFloat(totalPaid || 0).toFixed(2),
          outstandingAmount: parseFloat(outstandingAmount || 0).toFixed(2),
          todayTransactions: todayTransactions || 0,
          todayRevenue: parseFloat(todayRevenue || 0).toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Bulk delete transactions
router.delete('/bulk-delete', [
  authenticateToken,
  requirePermission('transactions:delete')
], async (req, res) => {
  try {
    const { ids } = req.body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Transaction IDs are required' })
    }

    await Transaction.destroy({
      where: {
        id: ids
      }
    })

    res.json({ message: `${ids.length} transactions deleted successfully` })
  } catch (error) {
    console.error('Bulk delete transactions error:', error)
    res.status(500).json({ error: 'Failed to delete transactions' })
  }
})

// Bulk update transaction payments
router.put('/bulk-payment', [
  authenticateToken,
  requirePermission('transactions:update')
], async (req, res) => {
  try {
    const { ids, amount } = req.body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Transaction IDs are required' })
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' })
    }

    const paymentPerTransaction = amount / ids.length

    await Transaction.update(
      { 
        paid: paymentPerTransaction,
        updatedAt: new Date()
      },
      {
        where: {
          id: ids
        }
      }
    )

    res.json({ message: `Payment of ${amount} applied to ${ids.length} transactions` })
  } catch (error) {
    console.error('Bulk payment update error:', error)
    res.status(500).json({ error: 'Failed to update payments' })
  }
})

// Bulk customer payment
router.put('/bulk-customer-payment', [
  authenticateToken,
  requirePermission('transactions:update')
], async (req, res) => {
  try {
    const { customerId, amount, note } = req.body
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' })
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' })
    }

    // Get all customer transactions
    const customerTransactions = await Transaction.findAll({
      where: { customerId },
      order: [['date', 'ASC']] // Oldest first
    })

    let remainingAmount = amount
    const updatedTransactions = []

    for (const transaction of customerTransactions) {
      if (remainingAmount <= 0) break

      const total = calculateTransactionTotal(transaction)
      const currentPaid = transaction.paid || 0
      const outstanding = total - currentPaid

      if (outstanding <= 0) continue

      const paymentForThis = Math.min(outstanding, remainingAmount)
      remainingAmount -= paymentForThis

      const updatedTransaction = await transaction.update({
        paid: currentPaid + paymentForThis,
        notes: transaction.notes ? `${transaction.notes}\n${note}` : note,
        updatedAt: new Date()
      })

      updatedTransactions.push(updatedTransaction)
    }

    res.json({ 
      message: `Payment of ${amount} applied to customer transactions`,
      updatedTransactions: updatedTransactions.length
    })
  } catch (error) {
    console.error('Bulk customer payment error:', error)
    res.status(500).json({ error: 'Failed to process customer payment' })
  }
})

module.exports = router; 