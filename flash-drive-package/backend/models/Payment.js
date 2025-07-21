const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'credit', 'mobile_money'),
    allowNull: false
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  receiptNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'completed',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    {
      fields: ['transaction_id']
    },
    {
      fields: ['customer_id']
    },
    {
      fields: ['payment_date']
    },
    {
      fields: ['receipt_number']
    }
  ]
});

// Instance methods
Payment.prototype.getFormattedAmount = function() {
  return parseFloat(this.amount).toFixed(2);
};

Payment.prototype.isRefundable = function() {
  return this.status === 'completed' && this.paymentDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
};

// Class methods
Payment.getCustomerPayments = async function(customerId, limit = 50) {
  return await this.findAll({
    where: { customerId },
    order: [['paymentDate', 'DESC']],
    limit
  });
};

Payment.getTransactionPayments = async function(transactionId) {
  return await this.findAll({
    where: { transactionId },
    order: [['paymentDate', 'ASC']]
  });
};

Payment.getPaymentsByDateRange = async function(startDate, endDate, branchId = null) {
  const where = {
    paymentDate: { [sequelize.Op.between]: [startDate, endDate] }
  };
  
  if (branchId) where.branchId = branchId;
  
  return await this.findAll({
    where,
    order: [['paymentDate', 'DESC']]
  });
};

Payment.generateReceiptNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Get count of payments today
  const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  
  const count = await this.count({
    where: {
      paymentDate: { [sequelize.Op.between]: [todayStart, todayEnd] }
    }
  });
  
  return `RCP-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
};

module.exports = Payment; 