const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transaction_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
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
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // Detailed Load Tracking (What customer took)
  load_6kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  load_13kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  load_50kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Returns breakdown (JSONB for flexibility)
  returns_breakdown: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  outright_breakdown: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  // Calculated totals
  total_returns: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_load: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Detailed cylinder balance by size
  cylinder_balance_6kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cylinder_balance_13kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cylinder_balance_50kg: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  cylinder_balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Financial fields
  financial_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  total_bill: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'mpesa', 'card', 'transfer', 'credit'),
    defaultValue: 'cash'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['customer_id'] },
    { fields: ['user_id'] },
    { fields: ['date'] },
    { fields: ['transaction_number'], unique: true }
  ]
});

// Generate serial number with format: YYMMDD-XXXXXX (Year, Month, Day + 6 random alphanumeric)
const generateTransactionNumber = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Generate 6 random alphanumeric characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomSuffix = '';
  for (let i = 0; i < 6; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${year}${month}${day}-${randomSuffix}`;
};

// Add the hook after model definition
Transaction.addHook('beforeCreate', async (transaction) => {
  transaction.transaction_number = await generateTransactionNumber();
});

Transaction.generateTransactionNumber = generateTransactionNumber;

module.exports = Transaction; 