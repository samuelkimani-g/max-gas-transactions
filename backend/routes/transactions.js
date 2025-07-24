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
router.post('/', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      customerId, 
      loadBreakdown,
      returnsBreakdown, 
      outrightBreakdown, 
      amountPaid, 
      paymentMethod, 
      notes 
    } = req.body;

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Calculate detailed load
    const load_6kg = loadBreakdown?.kg6 || 0;
    const load_13kg = loadBreakdown?.kg13 || 0;
    const load_50kg = loadBreakdown?.kg50 || 0;
    const total_load = load_6kg + load_13kg + load_50kg;

    // Calculate total returns by size
    const returns_6kg = (returnsBreakdown?.max_empty?.kg6 || 0) + 
                       (returnsBreakdown?.swap_empty?.kg6 || 0) + 
                       (returnsBreakdown?.return_full?.kg6 || 0);
    const returns_13kg = (returnsBreakdown?.max_empty?.kg13 || 0) + 
                        (returnsBreakdown?.swap_empty?.kg13 || 0) + 
                        (returnsBreakdown?.return_full?.kg13 || 0);
    const returns_50kg = (returnsBreakdown?.max_empty?.kg50 || 0) + 
                        (returnsBreakdown?.swap_empty?.kg50 || 0) + 
                        (returnsBreakdown?.return_full?.kg50 || 0);
    const total_returns = returns_6kg + returns_13kg + returns_50kg;

    // Fix outright breakdown structure to match frontend
    const outright_6kg = outrightBreakdown?.kg6 || 0;
    const outright_13kg = outrightBreakdown?.kg13 || 0;
    const outright_50kg = outrightBreakdown?.kg50 || 0;
    const outright_price6 = outrightBreakdown?.price6 || 0;
    const outright_price13 = outrightBreakdown?.price13 || 0;
    const outright_price50 = outrightBreakdown?.price50 || 0;

    // Calculate detailed cylinder balances
    const cylinder_balance_6kg = load_6kg - (returns_6kg + outright_6kg);
    const cylinder_balance_13kg = load_13kg - (returns_13kg + outright_13kg);
    const cylinder_balance_50kg = load_50kg - (returns_50kg + outright_50kg);
    const cylinder_balance = cylinder_balance_6kg + cylinder_balance_13kg + cylinder_balance_50kg;

    // Calculate financial totals
    const maxEmptyTotal = ((returnsBreakdown?.max_empty?.kg6 || 0) * (returnsBreakdown?.max_empty?.price6 || 0)) +
                         ((returnsBreakdown?.max_empty?.kg13 || 0) * (returnsBreakdown?.max_empty?.price13 || 0)) +
                         ((returnsBreakdown?.max_empty?.kg50 || 0) * (returnsBreakdown?.max_empty?.price50 || 0));
    
    const swapEmptyTotal = ((returnsBreakdown?.swap_empty?.kg6 || 0) * (returnsBreakdown?.swap_empty?.price6 || 0)) +
                          ((returnsBreakdown?.swap_empty?.kg13 || 0) * (returnsBreakdown?.swap_empty?.price13 || 0)) +
                          ((returnsBreakdown?.swap_empty?.kg50 || 0) * (returnsBreakdown?.swap_empty?.price50 || 0));
    
    const outrightTotal = (outright_6kg * outright_price6) +
                         (outright_13kg * outright_price13) +
                         (outright_50kg * outright_price50);
    
    const total_bill = maxEmptyTotal + swapEmptyTotal + outrightTotal;
    const financial_balance = total_bill - (amountPaid || 0);

    // Generate transaction number using static method
    const transaction_number = await Transaction.generateTransactionNumber();

    // Debug log
    console.log('[DEBUG] Creating transaction with:', {
      customerId,
      userId: req.user.id,
      load_6kg,
      load_13kg,
      load_50kg,
      total_load,
      returnsBreakdown,
      outrightBreakdown,
      outright_6kg, outright_13kg, outright_50kg,
      outright_price6, outright_price13, outright_price50,
      total_returns,
      cylinder_balance_6kg, cylinder_balance_13kg, cylinder_balance_50kg, cylinder_balance,
      total_bill, amountPaid, financial_balance,
      transaction_number
    });

    // Create transaction record
    let newTransaction = await Transaction.create({
      customerId,
      userId: req.user.id,
      load_6kg,
      load_13kg,
      load_50kg,
      total_load,
      returns_breakdown: returnsBreakdown || {},
      outright_breakdown: outrightBreakdown || {},
      total_returns,
      cylinder_balance_6kg,
      cylinder_balance_13kg,
      cylinder_balance_50kg,
      cylinder_balance,
      total_bill,
      amount_paid: amountPaid || 0,
      financial_balance,
      payment_method: paymentMethod || 'cash',
      notes: notes || '',
      transaction_number
    }, { transaction });

    // Failsafe: If transaction_number is still null, generate and update it
    if (!newTransaction.transaction_number) {
      const TransactionModel = require('../models/Transaction');
      const generateTransactionNumber = TransactionModel.generateTransactionNumber || (await import('../models/Transaction')).generateTransactionNumber;
      const transaction_number = await (typeof generateTransactionNumber === 'function' ? generateTransactionNumber() : 'A0001');
      await newTransaction.update({ transaction_number }, { transaction });
    }

    // Update customer balances with detailed tracking
    const currentCustomer = await Customer.findByPk(customerId, { transaction });
    // Ensure all values are numbers to avoid string concatenation
    const currentFinBal = Number(currentCustomer.financial_balance) || 0;
    const currentCylBal = Number(currentCustomer.cylinder_balance) || 0;
    const currentCylBal6 = Number(currentCustomer.cylinder_balance_6kg) || 0;
    const currentCylBal13 = Number(currentCustomer.cylinder_balance_13kg) || 0;
    const currentCylBal50 = Number(currentCustomer.cylinder_balance_50kg) || 0;
    const newFinBal = Number(financial_balance) || 0;
    const newCylBal = Number(cylinder_balance) || 0;
    const newCylBal6 = Number(cylinder_balance_6kg) || 0;
    const newCylBal13 = Number(cylinder_balance_13kg) || 0;
    const newCylBal50 = Number(cylinder_balance_50kg) || 0;

    const newFinancialBalance = currentFinBal + newFinBal;
    const newCylinderBalance = currentCylBal + newCylBal;
    const newCylinderBalance6kg = currentCylBal6 + newCylBal6;
    const newCylinderBalance13kg = currentCylBal13 + newCylBal13;
    const newCylinderBalance50kg = currentCylBal50 + newCylBal50;

    await Customer.update({
      financial_balance: newFinancialBalance,
      cylinder_balance: newCylinderBalance,
      cylinder_balance_6kg: newCylinderBalance6kg,
      cylinder_balance_13kg: newCylinderBalance13kg,
      cylinder_balance_50kg: newCylinderBalance50kg
    }, { 
      where: { id: customerId },
      transaction 
    });

    await transaction.commit();

    // Fetch the complete transaction with user details
    const completeTransaction = await Transaction.findByPk(newTransaction.id, {
      include: [
        { model: Customer, as: 'Customer', attributes: ['name', 'phone'] },
        { model: User, as: 'User', attributes: ['username'] }
      ]
    });

    res.json({
      success: true,
      data: { transaction: completeTransaction }
    });

  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Transaction creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction: ' + error.message
    });
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

// @route   PUT /api/transactions/bulk-customer-payment
// @desc    Record a bulk payment for a customer across multiple transactions
// @access  Private
router.put('/bulk-customer-payment', [
  authenticateToken,
  requirePermission('transactions:update')
], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { customerId, amount, note } = req.body;

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Get all transactions for this customer, sorted by date (oldest first)
    const customerTransactions = await Transaction.findAll({
      where: { customerId },
      order: [['date', 'ASC']],
      transaction
    });

    let remainingAmount = amount;
    const updatedTransactions = [];

    // Process each transaction and apply payment
    for (const transactionRecord of customerTransactions) {
      if (remainingAmount <= 0) {
        updatedTransactions.push(transactionRecord);
        continue;
      }

      const total = transactionRecord.total_bill || 0;
      const currentPaid = transactionRecord.amount_paid || 0;
      const outstanding = total - currentPaid;

      if (outstanding <= 0) {
        updatedTransactions.push(transactionRecord);
        continue;
      }

      const paymentForThis = Math.min(outstanding, remainingAmount);
      remainingAmount -= paymentForThis;

      const updatedTransaction = await transactionRecord.update({
        amount_paid: Math.round((currentPaid + paymentForThis) * 100) / 100,
        notes: transactionRecord.notes ? `${transactionRecord.notes}\n${note}` : note,
      }, { transaction });

      updatedTransactions.push(updatedTransaction);
    }

    // Update customer's financial balance
    const totalPaid = amount - remainingAmount;
    const newFinancialBalance = (customer.financial_balance || 0) - totalPaid;
    
    await Customer.update({
      financial_balance: newFinancialBalance
    }, { 
      where: { id: customerId },
      transaction 
    });

    await transaction.commit();

    res.json({
      success: true,
      data: { 
        message: `Bulk payment of ${totalPaid} recorded successfully`,
        remainingAmount,
        updatedTransactions: updatedTransactions.length
      }
    });

  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Bulk payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record bulk payment: ' + error.message
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', [
  authenticateToken,
  requirePermission('transactions:update')
], async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      customerId, 
      loadBreakdown,
      returnsBreakdown, 
      outrightBreakdown, 
      amountPaid, 
      paymentMethod, 
      notes 
    } = req.body;

    // Find the transaction
    const existingTransaction = await Transaction.findByPk(id);
    if (!existingTransaction) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Calculate detailed load
    const load_6kg = loadBreakdown?.kg6 || 0;
    const load_13kg = loadBreakdown?.kg13 || 0;
    const load_50kg = loadBreakdown?.kg50 || 0;
    const total_load = load_6kg + load_13kg + load_50kg;

    // Calculate total returns by size
    const returns_6kg = (returnsBreakdown?.max_empty?.kg6 || 0) + 
                       (returnsBreakdown?.swap_empty?.kg6 || 0) + 
                       (returnsBreakdown?.return_full?.kg6 || 0);
    const returns_13kg = (returnsBreakdown?.max_empty?.kg13 || 0) + 
                        (returnsBreakdown?.swap_empty?.kg13 || 0) + 
                        (returnsBreakdown?.return_full?.kg13 || 0);
    const returns_50kg = (returnsBreakdown?.max_empty?.kg50 || 0) + 
                        (returnsBreakdown?.swap_empty?.kg50 || 0) + 
                        (returnsBreakdown?.return_full?.kg50 || 0);
    const total_returns = returns_6kg + returns_13kg + returns_50kg;

    // Fix outright breakdown structure to match frontend
    const outright_6kg = outrightBreakdown?.kg6 || 0;
    const outright_13kg = outrightBreakdown?.kg13 || 0;
    const outright_50kg = outrightBreakdown?.kg50 || 0;
    const outright_price6 = outrightBreakdown?.price6 || 0;
    const outright_price13 = outrightBreakdown?.price13 || 0;
    const outright_price50 = outrightBreakdown?.price50 || 0;

    // Calculate detailed cylinder balances
    const cylinder_balance_6kg = load_6kg - (returns_6kg + outright_6kg);
    const cylinder_balance_13kg = load_13kg - (returns_13kg + outright_13kg);
    const cylinder_balance_50kg = load_50kg - (returns_50kg + outright_50kg);
    const cylinder_balance = cylinder_balance_6kg + cylinder_balance_13kg + cylinder_balance_50kg;

    // Calculate financial totals
    const maxEmptyTotal = ((returnsBreakdown?.max_empty?.kg6 || 0) * (returnsBreakdown?.max_empty?.price6 || 0)) +
                         ((returnsBreakdown?.max_empty?.kg13 || 0) * (returnsBreakdown?.max_empty?.price13 || 0)) +
                         ((returnsBreakdown?.max_empty?.kg50 || 0) * (returnsBreakdown?.max_empty?.price50 || 0));
    
    const swapEmptyTotal = ((returnsBreakdown?.swap_empty?.kg6 || 0) * (returnsBreakdown?.swap_empty?.price6 || 0)) +
                          ((returnsBreakdown?.swap_empty?.kg13 || 0) * (returnsBreakdown?.swap_empty?.price13 || 0)) +
                          ((returnsBreakdown?.swap_empty?.kg50 || 0) * (returnsBreakdown?.swap_empty?.price50 || 0));
    
    const outrightTotal = (outright_6kg * outright_price6) +
                         (outright_13kg * outright_price13) +
                         (outright_50kg * outright_price50);
    
    const total_bill = maxEmptyTotal + swapEmptyTotal + outrightTotal;
    const financial_balance = total_bill - (amountPaid || 0);

    // Update the transaction
    await existingTransaction.update({
      customerId,
      load_6kg,
      load_13kg,
      load_50kg,
      total_load,
      returns_breakdown: returnsBreakdown,
      outright_breakdown: outrightBreakdown,
      cylinder_balance_6kg,
      cylinder_balance_13kg,
      cylinder_balance_50kg,
      cylinder_balance,
      total_bill,
      amount_paid: amountPaid || 0,
      payment_method: paymentMethod || 'cash',
      financial_balance,
      notes: notes || '',
      updatedAt: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      data: existingTransaction,
      message: 'Transaction updated successfully'
    });

  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction: ' + error.message
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', [
  authenticateToken,
  requirePermission('transactions:delete')
], async (req, res) => {
  try {
    const { id } = req.params;

    // Find the transaction
    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    // Delete the transaction
    await transaction.destroy();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction: ' + error.message
    });
  }
});

module.exports = router; 