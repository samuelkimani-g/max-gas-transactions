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
  category: {
    type: DataTypes.ENUM('regular', 'premium', 'wholesale', 'retail', 'sales_team'),
    defaultValue: 'regular',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false
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
    defaultValue: 0,
    allowNull: false,
    comment: 'The overall physical cylinder balance for the customer. Positive means they owe cylinders.'
  },
  
  // -- Standard Fields --
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  lastTransactionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalTransactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  totalSpent: {
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
    { fields: ['phone'], unique: true },
    { fields: ['status'] },
  ]
});

// Instance methods and class methods can be updated later if needed.
// The primary goal is to update the schema first.

module.exports = Customer; 