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

// Advanced transaction number generator
const generateTransactionNumber = async () => {
  const lastTransaction = await Transaction.findOne({
    order: [['id', 'DESC']],
    attributes: ['transaction_number']
  });

  if (!lastTransaction || !lastTransaction.transaction_number) {
    return 'A0001';
  }

  const lastNumber = lastTransaction.transaction_number;
  
  // Parse the current number
  const match = lastNumber.match(/^([A-Z]+)(\d{4})([A-Z]*)$/);
  if (!match) return 'A0001';
  
  const [, prefix, digits, suffix] = match;
  const currentNum = parseInt(digits, 10);
  
  // If we can increment the number (not at 9999)
  if (currentNum < 9999) {
    return `${prefix}${String(currentNum + 1).padStart(4, '0')}${suffix}`;
  }
  
  // Need to increment prefix
  if (!suffix) {
    // Single letter prefix (A9999 -> B0001)
    if (prefix === 'Z') {
      return 'AA0001'; // Z9999 -> AA0001
    } else {
      const nextChar = String.fromCharCode(prefix.charCodeAt(0) + 1);
      return `${nextChar}0001`;
    }
  } else {
    // Has suffix (AA0001A format)
    const suffixChar = suffix.charCodeAt(0);
    if (suffixChar < 90) { // Not Z
      return `${prefix}0001${String.fromCharCode(suffixChar + 1)}`;
    } else {
      // Suffix is Z, need to increment prefix
      if (prefix === 'ZZ') {
        return 'AA0001A'; // ZZ9999Z -> AA0001A (restart with suffix)
      } else if (prefix.length === 1) {
        return 'AA0001'; // Shouldn't happen, but safety
      } else {
        // Increment double letter prefix
        let newPrefix = prefix;
        if (prefix[1] === 'Z') {
          const firstChar = String.fromCharCode(prefix.charCodeAt(0) + 1);
          newPrefix = `${firstChar}A`;
        } else {
          const secondChar = String.fromCharCode(prefix.charCodeAt(1) + 1);
          newPrefix = `${prefix[0]}${secondChar}`;
        }
        return `${newPrefix}0001`;
      }
    }
  }
};

// Add the hook after model definition
Transaction.addHook('beforeCreate', async (transaction) => {
  transaction.transaction_number = await generateTransactionNumber();
});

module.exports = Transaction; 