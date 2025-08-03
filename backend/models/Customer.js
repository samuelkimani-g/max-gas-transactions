const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      len: [10, 20]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    },
    set(value) {
      this.setDataValue('email', value === '' ? null : value);
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // -- NEW Reconciled Ledger System Balance Fields --
  financial_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'The overall monetary balance for the customer. Positive means they owe money.'
  },
  cylinder_balance: {
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
  
  // -- Standard Fields --
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  last_transaction_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_transactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  total_spent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  }
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['phone'], unique: true }
  ]
});

// Instance methods and class methods can be updated later if needed.
// The primary goal is to update the schema first.

module.exports = Customer; 