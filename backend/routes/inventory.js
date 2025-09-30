const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get all inventory with calculations
// @access  Private (Admin only)
router.get('/', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('inventory:read')
], async (req, res) => {
  try {
    const { branchId, cylinderType } = req.query;
    
    let where = {};
    if (branchId) where.branchId = branchId;
    if (cylinderType) where.cylinder_type = cylinderType;
    
    const inventories = await Inventory.findAll({
      where,
      include: [
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'location']
        }
      ],
      order: [['cylinder_type', 'ASC']]
    });
    
    // Add calculated fields
    const inventoriesWithCalculations = inventories.map(inventory => ({
      ...inventory.toJSON(),
      total_value: inventory.getTotalValue(),
      stock_in_tons: inventory.available_stock_tons
    }));
    
    res.json({
      success: true,
      data: inventoriesWithCalculations,
      count: inventoriesWithCalculations.length
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/inventory/report
// @desc    Get inventory report with detailed calculations
// @access  Private (Admin only)
router.get('/report', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('inventory:read')
], async (req, res) => {
  try {
    const { branchId } = req.query;
    
    const inventories = await Inventory.getAllWithCalculations(branchId);
    
    // Calculate summary statistics
    const summary = {
      total_items: inventories.length,
      total_stock_kg: inventories.reduce((sum, item) => sum + parseFloat(item.available_stock_kg), 0),
      total_stock_tons: inventories.reduce((sum, item) => sum + parseFloat(item.available_stock_tons), 0),
      total_value: inventories.reduce((sum, item) => sum + parseFloat(item.total_value), 0),
      average_cost_per_kg: inventories.length > 0 
        ? inventories.reduce((sum, item) => sum + parseFloat(item.cost_per_kg), 0) / inventories.length 
        : 0
    };
    
    res.json({
      success: true,
      data: inventories,
      summary,
      count: inventories.length
    });
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/inventory/add
// @desc    Add new stock to inventory
// @access  Private (Admin only)
router.post('/add', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('inventory:write'),
  body('cylinder_type').notEmpty().withMessage('Cylinder type is required'),
  body('quantity_kg').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('supplier_place').notEmpty().withMessage('Supplier place is required'),
  body('cost_per_kg').isFloat({ min: 0 }).withMessage('Cost per kg must be a positive number'),
  body('total_amount_paid').isFloat({ min: 0 }).withMessage('Total amount paid must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const {
      cylinder_type,
      quantity_kg,
      supplier_place,
      cost_per_kg,
      total_amount_paid,
      branch_id
    } = req.body;
    
    const userId = req.user.id;
    const branchId = branch_id || req.user.branchId;
    
    // Add stock to inventory
    const inventory = await Inventory.addStock(
      cylinder_type,
      parseFloat(quantity_kg),
      supplier_place,
      parseFloat(cost_per_kg),
      parseFloat(total_amount_paid),
      branchId,
      userId
    );
    
    res.status(201).json({
      success: true,
      message: 'Stock added successfully',
      data: {
        ...inventory.toJSON(),
        total_value: inventory.getTotalValue(),
        stock_in_tons: inventory.available_stock_tons
      }
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/inventory/update/:id
// @desc    Update inventory item
// @access  Private (Admin only)
router.put('/update/:id', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('inventory:write'),
  body('cylinder_type').optional().notEmpty().withMessage('Cylinder type cannot be empty'),
  body('available_stock_kg').optional().isFloat({ min: 0 }).withMessage('Stock must be a positive number'),
  body('supplier_place').optional().notEmpty().withMessage('Supplier place cannot be empty'),
  body('cost_per_kg').optional().isFloat({ min: 0 }).withMessage('Cost per kg must be a positive number'),
  body('total_amount_paid').optional().isFloat({ min: 0 }).withMessage('Total amount paid must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    await inventory.update(updateData);
    
    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        ...inventory.toJSON(),
        total_value: inventory.getTotalValue(),
        stock_in_tons: inventory.available_stock_tons
      }
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Admin only)
router.delete('/:id', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('inventory:write')
], async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventory = await Inventory.findByPk(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    await inventory.destroy();
    
    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/inventory/cylinder-types
// @desc    Get all unique cylinder types
// @access  Private (All roles)
router.get('/cylinder-types', [
  authenticateToken,
  requirePermission('inventory:read')
], async (req, res) => {
  try {
    const cylinderTypes = await Inventory.findAll({
      attributes: ['cylinder_type'],
      group: ['cylinder_type'],
      order: [['cylinder_type', 'ASC']]
    });
    
    const types = cylinderTypes.map(item => item.cylinder_type);
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Error fetching cylinder types:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get inventory items with low stock
// @access  Private (Admin only)
router.get('/low-stock', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('inventory:read')
], async (req, res) => {
  try {
    const { threshold = 100 } = req.query; // Default threshold: 100kg
    
    const lowStockItems = await Inventory.findAll({
      where: {
        available_stock_kg: {
          [Op.lt]: parseFloat(threshold)
        }
      },
      include: [
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'location']
        }
      ],
      order: [['available_stock_kg', 'ASC']]
    });
    
    const itemsWithCalculations = lowStockItems.map(item => ({
      ...item.toJSON(),
      total_value: item.getTotalValue(),
      stock_in_tons: item.available_stock_tons
    }));
    
    res.json({
      success: true,
      data: itemsWithCalculations,
      count: itemsWithCalculations.length,
      threshold: parseFloat(threshold)
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
