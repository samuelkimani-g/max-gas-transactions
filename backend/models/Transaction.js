const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // MaxGas Loads (Cylinders given to customer)
  maxGas6kgLoad: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  maxGas13kgLoad: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  maxGas50kgLoad: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  // MaxGas Refills (Returns)
  return6kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  return13kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  return50kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  // MaxGas Outright Sales (Full cylinders)
  outright6kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  outright13kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  outright50kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  // Other Company Swipes
  swipeReturn6kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  swipeReturn13kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  swipeReturn50kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  // Prices
  refillPrice6kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 135.00,
    allowNull: false
  },
  refillPrice13kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 135.00,
    allowNull: false
  },
  refillPrice50kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 135.00,
    allowNull: false
  },
  outrightPrice6kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 3200.00,
    allowNull: false
  },
  outrightPrice13kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 3500.00,
    allowNull: false
  },
  outrightPrice50kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 8500.00,
    allowNull: false
  },
  swipeRefillPrice6kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 160.00,
    allowNull: false
  },
  swipeRefillPrice13kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 160.00,
    allowNull: false
  },
  swipeRefillPrice50kg: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 160.00,
    allowNull: false
  },
  // Payment
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  // Additional fields
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'refunded'),
    defaultValue: 'completed',
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'mpesa', 'card', 'transfer', 'credit'),
    defaultValue: 'credit',
    allowNull: true
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  hooks: {
    beforeCreate: async (transaction) => {
      // Calculate total
      transaction.total = calculateTransactionTotal(transaction);
      transaction.balance = transaction.total - transaction.paid;
    },
    beforeUpdate: async (transaction) => {
      if (transaction.changed('total') || transaction.changed('paid')) {
        transaction.balance = transaction.total - transaction.paid;
      }
    },
    afterCreate: async (transaction) => {
      // Update customer balance and stats
      const Customer = require('./Customer');
      const customer = await Customer.findByPk(transaction.customerId);
      if (customer) {
        await customer.updateBalance(transaction.balance);
        customer.totalTransactions += 1;
        // Ensure both values are numbers to prevent string concatenation
        customer.totalSpent = Number(customer.totalSpent || 0) + Number(transaction.total || 0);
        customer.lastTransactionDate = transaction.date;
        await customer.save();
      }
    }
  }
});

// Helper function to calculate transaction total
function calculateTransactionTotal(transaction) {
  if (!transaction) return 0;

  // MaxGas Refills (Returns) - multiply by kg weight and price per kg
  const refill6kg = (transaction.return6kg || 0) * 6 * (transaction.refillPrice6kg || 135);
  const refill13kg = (transaction.return13kg || 0) * 13 * (transaction.refillPrice13kg || 135);
  const refill50kg = (transaction.return50kg || 0) * 50 * (transaction.refillPrice50kg || 135);

  // MaxGas Outright Sales (Full cylinders) - per cylinder
  const outright6kg = (transaction.outright6kg || 0) * (transaction.outrightPrice6kg || 3200);
  const outright13kg = (transaction.outright13kg || 0) * (transaction.outrightPrice13kg || 3500);
  const outright50kg = (transaction.outright50kg || 0) * (transaction.outrightPrice50kg || 8500);

  // Other Company Swipes - multiply by kg weight and price per kg
  const swipe6kg = (transaction.swipeReturn6kg || 0) * 6 * (transaction.swipeRefillPrice6kg || 160);
  const swipe13kg = (transaction.swipeReturn13kg || 0) * 13 * (transaction.swipeRefillPrice13kg || 160);
  const swipe50kg = (transaction.swipeReturn50kg || 0) * 50 * (transaction.swipeRefillPrice50kg || 160);

  return parseFloat((refill6kg + refill13kg + refill50kg + outright6kg + outright13kg + outright50kg + swipe6kg + swipe13kg + swipe50kg).toFixed(2));
}

// Instance methods
Transaction.prototype.calculateTotal = function() {
  return calculateTransactionTotal(this);
};

Transaction.prototype.getOutstandingAmount = function() {
  return Math.max(0, parseFloat(this.balance));
};

Transaction.prototype.recordPayment = async function(amount, method = 'cash', notes = '') {
  this.paid = parseFloat(this.paid) + parseFloat(amount);
  this.balance = this.total - this.paid;
  this.paymentMethod = method;
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n${notes}` : notes;
  }
  await this.save();
  return this;
};

// Class methods
Transaction.getCustomerTransactions = async function(customerId, limit = 50) {
  return await this.findAll({
    where: { customerId },
    order: [['date', 'DESC']],
    limit
  });
};

Transaction.getCustomerBalance = async function(customerId) {
  const transactions = await this.findAll({
    where: { customerId },
    attributes: ['balance']
  });
  return transactions.reduce((total, t) => total + parseFloat(t.balance), 0);
};

Transaction.getCustomerCylinderBalance = async function(customerId) {
  const transactions = await this.findAll({
    where: { customerId },
    attributes: [
      'maxGas6kgLoad', 'maxGas13kgLoad', 'maxGas50kgLoad',
      'return6kg', 'return13kg', 'return50kg',
      'outright6kg', 'outright13kg', 'outright50kg',
      'swipeReturn6kg', 'swipeReturn13kg', 'swipeReturn50kg'
    ]
  });

  const balance = { '6kg': 0, '13kg': 0, '50kg': 0 };

  transactions.forEach(t => {
    // Loads (cylinders given to customer)
    balance['6kg'] += (t.maxGas6kgLoad || 0);
    balance['13kg'] += (t.maxGas13kgLoad || 0);
    balance['50kg'] += (t.maxGas50kgLoad || 0);

    // Returns (cylinders returned by customer)
    balance['6kg'] -= (t.return6kg || 0);
    balance['13kg'] -= (t.return13kg || 0);
    balance['50kg'] -= (t.return50kg || 0);

    // Swipes (cylinders returned by customer)
    balance['6kg'] -= (t.swipeReturn6kg || 0);
    balance['13kg'] -= (t.swipeReturn13kg || 0);
    balance['50kg'] -= (t.swipeReturn50kg || 0);

    // Outright sales (cylinders sold to customer)
    balance['6kg'] -= (t.outright6kg || 0);
    balance['13kg'] -= (t.outright13kg || 0);
    balance['50kg'] -= (t.outright50kg || 0);
  });

  return balance;
};

Transaction.generateInvoiceNumber = async function() {
  // Simple timestamp-based invoice number that will always work
  const timestamp = Date.now();
  return `INV-${timestamp}`;
};

module.exports = Transaction; 