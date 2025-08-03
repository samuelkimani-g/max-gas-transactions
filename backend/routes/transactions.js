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
    const maxEmptyTotal = ((returnsBreakdown?.max_empty?.kg6 || 0) * (returnsBreakdown?.max_empty?.price6 || 0) * 6) +
                         ((returnsBreakdown?.max_empty?.kg13 || 0) * (returnsBreakdown?.max_empty?.price13 || 0) * 13) +
                         ((returnsBreakdown?.max_empty?.kg50 || 0) * (returnsBreakdown?.max_empty?.price50 || 0) * 50);
    
    const swapEmptyTotal = ((returnsBreakdown?.swap_empty?.kg6 || 0) * (returnsBreakdown?.swap_empty?.price6 || 0) * 6) +
                          ((returnsBreakdown?.swap_empty?.kg13 || 0) * (returnsBreakdown?.swap_empty?.price13 || 0) * 13) +
                          ((returnsBreakdown?.swap_empty?.kg50 || 0) * (returnsBreakdown?.swap_empty?.price50 || 0) * 50);
    
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
      customer_id: customerId,
      user_id: req.user.id,
      load_6kg,
      load_13kg,
      load_50kg,
      total_load,
      returns_breakdown: returnsBreakdown || {},
      outright_breakdown: outrightBreakdown || {},
      total_returns,
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

    // Update customer financial balance
    const currentCustomer = await Customer.findByPk(customerId, { transaction });
    const currentFinBal = Number(currentCustomer.financial_balance) || 0;
    const newFinBal = Number(financial_balance) || 0;
    const newFinancialBalance = currentFinBal + newFinBal;

    await Customer.update({
      financial_balance: newFinancialBalance
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

// @route   PUT /api/transactions/bulk-customer-payment-select
// @desc    Record a bulk payment for a customer across selected transactions
// @access  Private
router.put('/bulk-customer-payment-select', [
  authenticateToken,
  requirePermission('transactions:update')
], async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { customerId, transactionIds, amount, method, note } = req.body;
    if (!customerId || !Array.isArray(transactionIds) || transactionIds.length === 0 || !amount) {
      await dbTransaction.rollback();
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }
    // Validate customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      await dbTransaction.rollback();
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    // Get the selected transactions for this customer, in the order provided
    const transactions = await Transaction.findAll({
      where: { id: transactionIds, customerId },
      order: [['date', 'ASC']],
      transaction: dbTransaction
    });
    // Sort transactions in the order of transactionIds
    const orderedTransactions = transactionIds.map(id => transactions.find(t => t.id === id)).filter(Boolean);
    console.log('[BACKEND DEBUG] Processing bulk payment:', {
      customerId,
      transactionIds,
      amount,
      method,
      orderedTransactionsCount: orderedTransactions.length
    });
    
    let remainingAmount = amount;
    const updatedTransactions = [];
    const createdPayments = [];
    
    for (const transactionRecord of orderedTransactions) {
      console.log('[BACKEND DEBUG] Processing transaction:', {
        id: transactionRecord.id,
        total_bill: transactionRecord.total_bill,
        current_amount_paid: transactionRecord.amount_paid,
        remainingAmount
      });
      
      if (remainingAmount <= 0) {
        console.log('[BACKEND DEBUG] No remaining amount, skipping transaction');
        updatedTransactions.push(transactionRecord);
        continue;
      }
      const total = parseFloat(transactionRecord.total_bill) || 0;
      const currentPaid = parseFloat(transactionRecord.amount_paid) || 0;
      const outstanding = total - currentPaid;
      console.log('[BACKEND DEBUG] Transaction calculations:', {
        total,
        currentPaid,
        outstanding
      });
      
      if (outstanding <= 0) {
        console.log('[BACKEND DEBUG] No outstanding amount, skipping transaction');
        updatedTransactions.push(transactionRecord);
        continue;
      }
      const paymentForThis = Math.min(outstanding, remainingAmount);
      remainingAmount -= paymentForThis;
      const newAmountPaid = currentPaid + paymentForThis;
      console.log('[BACKEND DEBUG] Updating transaction:', {
        paymentForThis,
        newAmountPaid,
        remainingAmount
      });
      
      const updatedTransaction = await transactionRecord.update({
        amount_paid: Math.round(newAmountPaid * 100) / 100,
        payment_method: method || transactionRecord.payment_method,
        notes: transactionRecord.notes ? `${transactionRecord.notes}\n${note}` : note,
      }, { transaction: dbTransaction });
      
      // Create Payment record for this transaction
      const Payment = require('../models/Payment');
      console.log('[BACKEND DEBUG] Creating payment record:', {
        transactionId: transactionRecord.id,
        customerId: customerId,
        amount: paymentForThis,
        paymentMethod: method || 'cash',
        reference: note || `Bulk payment - ${new Date().toISOString()}`,
        processedBy: 1,
        status: 'completed',
        paymentDate: new Date(),
        notes: note || `Bulk payment of ${paymentForThis} for transaction ${transactionRecord.transaction_number}`
      });
      
      const paymentRecord = await Payment.create({
        transactionId: transactionRecord.id,
        customerId: customerId,
        amount: paymentForThis,
        paymentMethod: method || 'cash',
        reference: note || `Bulk payment - ${new Date().toISOString()}`,
        processedBy: 1, // Default to admin user
        status: 'completed',
        paymentDate: new Date(),
        notes: note || `Bulk payment of ${paymentForThis} for transaction ${transactionRecord.transaction_number}`
      }, { transaction: dbTransaction });
      
      console.log('[BACKEND DEBUG] Payment record created:', {
        id: paymentRecord.id,
        amount: paymentRecord.amount,
        amountType: typeof paymentRecord.amount,
        paymentMethod: paymentRecord.paymentMethod,
        transactionId: paymentRecord.transactionId
      });
      
      createdPayments.push(paymentRecord);
      
      console.log('[BACKEND DEBUG] Transaction updated and payment created:', {
        id: updatedTransaction.id,
        amount_paid: updatedTransaction.amount_paid,
        payment_method: updatedTransaction.payment_method,
        paymentId: paymentRecord.id
      });
      
      updatedTransactions.push(updatedTransaction);
    }
    // Update customer's financial balance
    const totalPaid = amount - remainingAmount;
    const newFinancialBalance = (customer.financial_balance || 0) - totalPaid;
    await Customer.update({
      financial_balance: newFinancialBalance
    }, {
      where: { id: customerId },
      transaction: dbTransaction
    });
    await dbTransaction.commit();
    res.json({
      success: true,
      message: `Bulk payment of ${amount} applied to ${updatedTransactions.length} transactions`,
      payments: createdPayments,
      data: {
        message: `Bulk payment of ${totalPaid} recorded successfully`,
        remainingAmount,
        updatedTransactions
      }
    });
  } catch (error) {
    if (dbTransaction && !dbTransaction.finished) {
      await dbTransaction.rollback();
    }
    console.error('Bulk payment select error:', error);
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
    const maxEmptyTotal = ((returnsBreakdown?.max_empty?.kg6 || 0) * (returnsBreakdown?.max_empty?.price6 || 0) * 6) +
                         ((returnsBreakdown?.max_empty?.kg13 || 0) * (returnsBreakdown?.max_empty?.price13 || 0) * 13) +
                         ((returnsBreakdown?.max_empty?.kg50 || 0) * (returnsBreakdown?.max_empty?.price50 || 0) * 50);
    
    const swapEmptyTotal = ((returnsBreakdown?.swap_empty?.kg6 || 0) * (returnsBreakdown?.swap_empty?.price6 || 0) * 6) +
                          ((returnsBreakdown?.swap_empty?.kg13 || 0) * (returnsBreakdown?.swap_empty?.price13 || 0) * 13) +
                          ((returnsBreakdown?.swap_empty?.kg50 || 0) * (returnsBreakdown?.swap_empty?.price50 || 0) * 50);
    
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