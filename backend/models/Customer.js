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

  
  // -- Standard Fields --
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