const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// @route   POST /api/transactions
// @desc    Create a new transaction using the Reconciled Ledger System
// @access  Private
router.post('/', [
  authenticateToken,
  requirePermission('transactions:create'),
  // Basic validation - more complex validation will be done in the route handler
  body('customerId', 'Customer ID is required').isInt(),
  body('date', 'Date is required').isISO8601(),
  body('total_returns', 'Total Returns count is required').isInt({ min: 0 }),
  body('total_load', 'Total Load count is required').isInt({ min: 0 }),
  body('returns_breakdown', 'Returns breakdown is required').isObject(),
  body('outright_breakdown', 'Outright breakdown is required').isObject(),
  body('amount_paid').optional().isDecimal(),
  body('payment_method').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
  }

  const t = await sequelize.transaction();

  try {
    const {
      customerId,
      date,
      total_returns,
      total_load,
      returns_breakdown,
      outright_breakdown,
      amount_paid = 0,
      payment_method = 'credit',
      notes,
    } = req.body;

    // --- 1. Validate Customer ---
    const customer = await Customer.findByPk(customerId, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // --- 2. Calculate Financials (Total Bill & Balance) ---
    let total_bill = 0;
    
    // Calculate cost from returns/swaps
    if (returns_breakdown.max_empty) {
      total_bill += (returns_breakdown.max_empty.kg6 || 0) * (returns_breakdown.max_empty.price6 || 0);
      total_bill += (returns_breakdown.max_empty.kg13 || 0) * (returns_breakdown.max_empty.price13 || 0);
      total_bill += (returns_breakdown.max_empty.kg50 || 0) * (returns_breakdown.max_empty.price50 || 0);
    }
    if (returns_breakdown.swap_empty) {
      total_bill += (returns_breakdown.swap_empty.kg6 || 0) * (returns_breakdown.swap_empty.price6 || 0);
      total_bill += (returns_breakdown.swap_empty.kg13 || 0) * (returns_breakdown.swap_empty.price13 || 0);
      total_bill += (returns_breakdown.swap_empty.kg50 || 0) * (returns_breakdown.swap_empty.price50 || 0);
    }

    // Calculate cost from outright purchases
    let total_outright_count = 0;
    if (outright_breakdown.kg6) {
      total_bill += (outright_breakdown.kg6.count || 0) * (outright_breakdown.kg6.price || 0);
      total_outright_count += (outright_breakdown.kg6.count || 0);
    }
    if (outright_breakdown.kg13) {
      total_bill += (outright_breakdown.kg13.count || 0) * (outright_breakdown.kg13.price || 0);
      total_outright_count += (outright_breakdown.kg13.count || 0);
    }
    if (outright_breakdown.kg50) {
      total_bill += (outright_breakdown.kg50.count || 0) * (outright_breakdown.kg50.price || 0);
      total_outright_count += (outright_breakdown.kg50.count || 0);
    }
    
    const financial_balance = parseFloat(total_bill) - parseFloat(amount_paid);

    // --- 3. Calculate Physical Cylinder Balance ---
    const cylinder_balance = parseInt(total_load, 10) - (parseInt(total_returns, 10) + total_outright_count);

    // --- 4. Create Transaction Record ---
    const transactionRecord = await Transaction.create({
      customerId,
      userId: req.user.id,
      date,
      total_returns,
      total_load,
      returns_breakdown,
      outright_breakdown,
      total_bill: parseFloat(total_bill).toFixed(2),
      amount_paid: parseFloat(amount_paid).toFixed(2),
      payment_method,
      financial_balance: financial_balance.toFixed(2),
      cylinder_balance,
      notes,
      status: 'completed',
    }, { transaction: t });

    // --- 5. Update Customer's Overall Balances ---
    const currentFinancialBalance = parseFloat(customer.financial_balance || 0);
    const currentCylinderBalance = parseInt(customer.cylinder_balance || 0, 10);

    customer.financial_balance = (currentFinancialBalance + financial_balance).toFixed(2);
    customer.cylinder_balance = currentCylinderBalance + cylinder_balance;
    customer.lastTransactionDate = date;
    
    await customer.save({ transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction: transactionRecord }
    });

  } catch (error) {
    await t.rollback();
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


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
      userId = '',
      startDate = '',
      endDate = '',
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = {};

    if (customerId) whereClause.customerId = customerId;
    if (userId) whereClause.userId = userId;

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }
    
    // Role-based filtering can be added here if needed

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        { model: Customer, as: 'Customer', attributes: ['id', 'name'] },
        { model: User, as: 'User', attributes: ['id', 'username'] },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Other routes (GET by ID, PUT, DELETE) would also need to be updated 
// to reflect the new data structure and logic.
// For now, focusing on the CREATE operation.

module.exports = router; 