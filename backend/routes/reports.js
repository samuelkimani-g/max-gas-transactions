const express = require('express');
const { query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Branch = require('../models/Branch');
const User = require('../models/User');
const { authenticateToken, authorizeRoles, authorizePermissions } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/sales
// @desc    Get sales report with filters
// @access  Private
router.get('/sales', [
  authenticateToken,
  authorizePermissions('reports', 'all'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('branchId').optional().isInt(),
  query('customerId').optional().isInt(),
  query('groupBy').optional().isIn(['day', 'week', 'month', 'year'])
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

    const { startDate, endDate, branchId, customerId, groupBy = 'day' } = req.query;
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

    // Customer filter
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Get sales data
    const salesData = await Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'Customer',
          attributes: ['id', 'name', 'category']
        },
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'city']
        }
      ],
      order: [['date', 'ASC']]
    });

    // Group data by specified period
    const groupedData = groupSalesData(salesData, groupBy);

    // Calculate totals
    const totals = calculateSalesTotals(salesData);

    res.json({
      success: true,
      data: {
        salesData: groupedData,
        totals,
        filters: {
          startDate,
          endDate,
          branchId,
          customerId,
          groupBy
        }
      }
    });

  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/customers
// @desc    Get customer analytics report
// @access  Private
router.get('/customers', [
  authenticateToken,
  authorizePermissions('reports', 'all'),
  query('branchId').optional().isInt()
], async (req, res) => {
  try {
    const { branchId } = req.query;
    const whereClause = {};

    // Branch filter
    if (branchId) {
      whereClause.branchId = branchId;
    } else if (req.user.role !== 'admin') {
      whereClause.branchId = req.user.branchId;
    }

    // Get customer statistics
    const [
      totalCustomers,
      activeCustomers,
      customersByCategory,
      topCustomers,
      customersWithBalance
    ] = await Promise.all([
      Customer.count({ where: whereClause }),
      Customer.count({ where: { ...whereClause, status: 'active' } }),
      Customer.findAll({
        where: whereClause,
        attributes: [
          'category',
          [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count']
        ],
        include: [{
          model: Transaction,
          as: 'Transactions',
          attributes: []
        }],
        group: ['category']
      }),
      Customer.findAll({
        where: whereClause,
        include: [{
          model: Transaction,
          as: 'Transactions',
          attributes: []
        }],
        order: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('total')), 'DESC']],
        limit: 10
      }),
      Customer.findAll({
        where: { ...whereClause, balance: { [Op.gt]: 0 } },
        order: [['balance', 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          activeCustomers,
          inactiveCustomers: totalCustomers - activeCustomers
        },
        customersByCategory,
        topCustomers,
        customersWithBalance
      }
    });

  } catch (error) {
    console.error('Customer report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/inventory
// @desc    Get inventory/cylinder usage report
// @access  Private
router.get('/inventory', [
  authenticateToken,
  authorizePermissions('reports', 'all'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('branchId').optional().isInt()
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

    // Get cylinder usage data
    const cylinderData = await Transaction.findAll({
      where: whereClause,
      attributes: [
        'return6kg', 'return13kg', 'return50kg',
        'outright6kg', 'outright13kg', 'outright50kg',
        'swipeReturn6kg', 'swipeReturn13kg', 'swipeReturn50kg'
      ]
    });

    // Calculate cylinder totals
    const totals = {
      '6kg': {
        refills: 0,
        outright: 0,
        swipes: 0,
        total: 0
      },
      '13kg': {
        refills: 0,
        outright: 0,
        swipes: 0,
        total: 0
      },
      '50kg': {
        refills: 0,
        outright: 0,
        swipes: 0,
        total: 0
      }
    };

    cylinderData.forEach(transaction => {
      // 6kg cylinders
      totals['6kg'].refills += transaction.return6kg || 0;
      totals['6kg'].outright += transaction.outright6kg || 0;
      totals['6kg'].swipes += transaction.swipeReturn6kg || 0;
      totals['6kg'].total += (transaction.return6kg || 0) + (transaction.outright6kg || 0) + (transaction.swipeReturn6kg || 0);

      // 13kg cylinders
      totals['13kg'].refills += transaction.return13kg || 0;
      totals['13kg'].outright += transaction.outright13kg || 0;
      totals['13kg'].swipes += transaction.swipeReturn13kg || 0;
      totals['13kg'].total += (transaction.return13kg || 0) + (transaction.outright13kg || 0) + (transaction.swipeReturn13kg || 0);

      // 50kg cylinders
      totals['50kg'].refills += transaction.return50kg || 0;
      totals['50kg'].outright += transaction.outright50kg || 0;
      totals['50kg'].swipes += transaction.swipeReturn50kg || 0;
      totals['50kg'].total += (transaction.return50kg || 0) + (transaction.outright50kg || 0) + (transaction.swipeReturn50kg || 0);
    });

    res.json({
      success: true,
      data: {
        cylinderUsage: totals,
        filters: {
          startDate,
          endDate,
          branchId
        }
      }
    });

  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/branches
// @desc    Get branch performance report
// @access  Private (Admin only)
router.get('/branches', [
  authenticateToken,
  authorizeRoles('admin'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
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

    // Get all branches
    const branches = await Branch.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Transaction,
          as: 'Transactions',
          where: whereClause,
          required: false,
          attributes: []
        }
      ]
    });

    // Calculate branch performance
    const branchPerformance = await Promise.all(
      branches.map(async (branch) => {
        const branchStats = await branch.getStats();
        const branchRevenue = await branch.getRevenue(
          startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1),
          endDate ? new Date(endDate) : new Date()
        );

        return {
          id: branch.id,
          name: branch.name,
          city: branch.city,
          type: branch.type,
          stats: branchStats,
          revenue: branchRevenue
        };
      })
    );

    res.json({
      success: true,
      data: {
        branchPerformance,
        filters: {
          startDate,
          endDate
        }
      }
    });

  } catch (error) {
    console.error('Branch report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/reports/export
// @desc    Export data to Excel/CSV
// @access  Private
router.get('/export', [
  authenticateToken,
  authorizePermissions('reports', 'all'),
  query('type').isIn(['transactions', 'customers', 'sales']),
  query('format').isIn(['excel', 'csv']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('branchId').optional().isInt()
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

    const { type, format, startDate, endDate, branchId } = req.query;
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

    let data;
    let filename;

    switch (type) {
      case 'transactions':
        data = await Transaction.findAll({
          where: whereClause,
          include: [
            {
              model: Customer,
              as: 'Customer',
              attributes: ['name', 'phone']
            },
            {
              model: Branch,
              as: 'Branch',
              attributes: ['name', 'city']
            }
          ],
          order: [['date', 'DESC']]
        });
        filename = `transactions_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'customers':
        data = await Customer.findAll({
          where: branchId ? { branchId } : {},
          include: [
            {
              model: Branch,
              as: 'Branch',
              attributes: ['name', 'city']
            }
          ],
          order: [['name', 'ASC']]
        });
        filename = `customers_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'sales':
        data = await Transaction.findAll({
          where: whereClause,
          include: [
            {
              model: Customer,
              as: 'Customer',
              attributes: ['name', 'category']
            }
          ],
          order: [['date', 'ASC']]
        });
        filename = `sales_${new Date().toISOString().split('T')[0]}`;
        break;
    }

    // For now, return JSON data
    // In production, you would use a library like 'exceljs' or 'csv-writer' to generate files
    res.json({
      success: true,
      data: {
        type,
        format,
        filename: `${filename}.${format}`,
        records: data.length,
        data: data.slice(0, 10) // Return first 10 records as preview
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper functions
function groupSalesData(salesData, groupBy) {
  const grouped = {};
  
  salesData.forEach(transaction => {
    let key;
    const date = new Date(transaction.date);
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        total: 0,
        count: 0,
        transactions: []
      };
    }
    
    grouped[key].total += parseFloat(transaction.total);
    grouped[key].count += 1;
    grouped[key].transactions.push(transaction);
  });
  
  return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function calculateSalesTotals(salesData) {
  return salesData.reduce((totals, transaction) => {
    totals.totalRevenue += parseFloat(transaction.total);
    totals.totalPaid += parseFloat(transaction.paid);
    totals.totalBalance += parseFloat(transaction.balance);
    totals.transactionCount += 1;
    return totals;
  }, {
    totalRevenue: 0,
    totalPaid: 0,
    totalBalance: 0,
    transactionCount: 0
  });
}

module.exports = router; 