const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');

// @route   GET /api/payments
// @desc    Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        { model: Transaction, as: 'Transaction' },
        { model: Customer, as: 'Customer' }
      ],
      order: [['paymentDate', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// @route   POST /api/payments
// @desc    Create new payment
router.post('/', async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Set default values
    paymentData.paymentDate = paymentData.paymentDate || new Date();
    paymentData.processedBy = paymentData.processedBy || 1; // Default to admin user
    paymentData.status = paymentData.status || 'completed';
    
    // Generate receipt number if not provided
    if (!paymentData.receiptNumber) {
      paymentData.receiptNumber = await Payment.generateReceiptNumber();
    }
    
    const payment = await Payment.create(paymentData);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    await payment.update(req.body);
    res.json(payment);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    await payment.destroy();
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// @route   GET /api/payments/customer/:customerId
// @desc    Get payments by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { customerId: req.params.customerId },
      order: [['paymentDate', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    console.error('Get payments by customer error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// @route   GET /api/payments/transaction/:transactionId
// @desc    Get payments by transaction
router.get('/transaction/:transactionId', async (req, res) => {
  try {
    console.log('[BACKEND DEBUG] Fetching payments for transaction:', req.params.transactionId);
    const payments = await Payment.getTransactionPayments(req.params.transactionId);
    console.log('[BACKEND DEBUG] Found payments:', payments.map(p => ({
      id: p.id,
      amount: p.amount,
      amountType: typeof p.amount,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId
    })));
    res.json(payments);
  } catch (error) {
    console.error('Get payments by transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

module.exports = router; 