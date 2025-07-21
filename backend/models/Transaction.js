const { DataTypes } = require('sequelize');
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
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // -- NEW Reconciled Ledger System Fields --

  // Part 1: Cylinders IN
  total_returns: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total physical cylinders customer brought IN.'
  },
  returns_breakdown: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'JSON object detailing the breakdown of returned cylinders (max_empty, swap_empty, return_full).'
    // Example: { 
    //   "max_empty": { "kg6": 5, "kg13": 0, "kg50": 0, "price6": 135, "price13": 135, "price50": 135 },
    //   "swap_empty": { "kg6": 0, "kg13": 2, "kg50": 0, "price6": 160, "price13": 160, "price50": 160 },
    //   "return_full": { "kg6": 0, "kg13": 0, "kg50": 1 }
    // }
  },

  // Part 2: Cylinders BOUGHT
  outright_breakdown: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'JSON object detailing new cylinders purchased outright.'
    // Example: { 
    //   "kg6": { "count": 1, "price": 2200 },
    //   "kg13": { "count": 0, "price": 4400 },
    //   "kg50": { "count": 0, "price": 8000 }
    // }
  },

  // Part 3: Cylinders OUT
  total_load: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total physical cylinders customer took OUT.'
  },
  
  // Part 4: Balances & Payment
  cylinder_balance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'The physical cylinder balance. Positive means customer owes us cylinders.'
  },
  financial_balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'The monetary balance. Positive means customer owes us money.'
  },
  total_bill: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'The total monetary value of the services rendered (refills, swaps, outright).'
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'mpesa', 'card', 'transfer', 'credit'),
    defaultValue: 'credit',
    allowNull: true
  },

  // -- Standard Fields --
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'cancelled'),
    defaultValue: 'completed',
    allowNull: false
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['customer_id'] },
    { fields: ['user_id'] },
    { fields: ['date'] },
  ]
});

module.exports = Transaction; 