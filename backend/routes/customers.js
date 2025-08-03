const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Branch = require('../models/Branch');
const { authenticateToken, authorizePermissions, authorizeRoles } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// @route   GET /api/customers
// @desc    Get all customers with pagination and search
// @access  Private (All roles)
router.get('/', [
  authenticateToken,
  requirePermission('customers:read')
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }





    // Get customers with pagination
    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
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
        customers,
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
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private (All roles)
router.get('/:id', [
  authenticateToken,
  requirePermission('customers:read')
], async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { customer_id: customer.id },
      order: [['date', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        customer,
        recentTransactions
      }
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customers
// @desc    Create a new customer
// @access  Private (Admin/Manager)
router.post('/', [
  authenticateToken,
  requirePermission('customers:create'),
  body('name', 'Name is required').notEmpty().isLength({ min: 2, max: 100 }),
  body('phone', 'Phone number is required').notEmpty().isLength({ min: 10, max: 20 }),
  body('email').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty values
    }
    if (!require('validator').isEmail(value)) {
      throw new Error('Invalid email format');
    }
    return true;
  }),
  body('category').optional().isIn(['regular', 'premium', 'wholesale', 'retail']),
  body('creditLimit').optional().isFloat({ min: 0 })
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

    const {
      name,
      phone,
      email,
      address,
      category = 'regular',
      branchId,
      creditLimit = 0,
      notes,
      tags = []
    } = req.body;

    // Convert empty email to null
    const cleanEmail = email === '' ? null : email;

    // Check if phone number already exists
    const existingCustomer = await Customer.findOne({ where: { phone } });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }

    // Create customer
    const customer = await Customer.create({
      name,
      phone,
      email: cleanEmail,
      address
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer }
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', [
  authenticateToken,
  authorizePermissions('customers', 'all'),
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('phone').optional().isLength({ min: 10, max: 20 }),
  body('email').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) {
      return true; // Allow empty values
    }
    if (!require('validator').isEmail(value)) {
      throw new Error('Invalid email format');
    }
    return true;
  }),
  body('category').optional().isIn(['regular', 'premium', 'wholesale', 'retail']),
  body('creditLimit').optional().isFloat({ min: 0 })
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

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if phone number is being changed and if it already exists
    if (req.body.phone && req.body.phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({ where: { phone: req.body.phone } });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Convert empty email to null
    const updateData = { ...req.body };
    if (updateData.email === '') {
      updateData.email = null;
    }

    // Update customer
    await customer.update(updateData);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer }
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private (Admin/Manager only)
router.delete('/:id', [
  authenticateToken,
  authorizeRoles('admin', 'manager')
], async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check for force delete parameter (for testing)
    const forceDelete = req.query.force === 'true';
    
    if (!forceDelete) {
      // Check if customer has significant outstanding balance (allow for rounding errors)
      const balance = parseFloat(customer.balance || 0);
      if (Math.abs(balance) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete customer with outstanding balance of ${balance.toFixed(2)}. Use ?force=true to override.`
        });
      }

      // Check if customer has transactions
      const transactionCount = await Transaction.count({
        where: { customer_id: customer.id }
      });

      if (transactionCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete customer with ${transactionCount} existing transactions. Use ?force=true to override.`
        });
      }
    } else {
      // Force delete: Remove all related transactions first
      console.log(`🗑️ Force deleting customer ${customer.name} and all related data...`);
      
      const deletedTransactions = await Transaction.destroy({
        where: { customer_id: customer.id },
        force: true
      });
      
      if (deletedTransactions > 0) {
        console.log(`✅ Deleted ${deletedTransactions} related transactions`);
      }
    }

    await customer.destroy();

    res.json({
      success: true,
      message: forceDelete ? 
        'Customer and all related data deleted successfully' : 
        'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/customers/:id/debug
// @desc    Debug customer data for deletion issues (temporary)
// @access  Public (for debugging only)
router.get('/:id/debug', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get transaction count
    const transactionCount = await Transaction.count({
      where: { customerId: customer.id }
    });

          // Get actual transactions
      const transactions = await Transaction.findAll({
        where: { customer_id: customer.id },
        attributes: ['id', 'total_bill', 'amount_paid', 'financial_balance', 'date']
      });

    // Parse balance
    const balance = parseFloat(customer.balance || 0);
    const absBalance = Math.abs(balance);

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          balance: customer.balance,
          parsedBalance: balance,
          absBalance: absBalance,
          balanceCheck: absBalance > 0.01,
          status: customer.status
        },
        transactionCount,
        transactions,
        deletionChecks: {
          hasSignificantBalance: absBalance > 0.01,
          hasTransactions: transactionCount > 0,
          canDelete: absBalance <= 0.01 && transactionCount === 0
        }
      }
    });

  } catch (error) {
    console.error('Debug customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/customers/:id/transactions
// @desc    Get customer transactions
// @access  Private
router.get('/:id/transactions', [
  authenticateToken,
  authorizePermissions('customers', 'all')
], async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: { customer_id: customer.id },
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        customer,
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get customer transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/customers/search/quick
// @desc    Quick search customers
// @access  Private
router.get('/search/quick', [
  authenticateToken,
  authorizePermissions('customers', 'all'),
  query('q', 'Search query is required').notEmpty()
], async (req, res) => {
  try {
    const { q } = req.query;
    const customers = await Customer.searchCustomers(q, 10);

    res.json({
      success: true,
      data: { customers }
    });

  } catch (error) {
    console.error('Quick search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customers/:id/payment
// @desc    Record payment for customer
// @access  Private
router.post('/:id/payment', [
  authenticateToken,
  authorizePermissions('customers', 'all'),
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

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const { amount, method, notes } = req.body;

    // Update customer balance
    const currentBalance = Number(customer.financial_balance) || 0;
    const newBalance = currentBalance - amount; // Negative because it's a payment
    await customer.update({ financial_balance: newBalance });

    // Create payment transaction
    const paymentTransaction = await Transaction.create({
      customer_id: customer.id,
      user_id: req.user.id,
      date: new Date(),
      total_bill: 0,
      amount_paid: amount,
      financial_balance: -amount,
      payment_method: method,
      notes: `Payment: ${notes || ''}`
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        customer,
        paymentTransaction
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 