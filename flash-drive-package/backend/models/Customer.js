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
      isEmail: {
        args: true,
        msg: 'Invalid email format'
      }
    },
    set(value) {
      // Convert empty string to null
      this.setDataValue('email', value === '' ? null : value);
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('regular', 'premium', 'wholesale', 'retail'),
    defaultValue: 'regular',
    allowNull: false
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false
  },
  creditLimit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100000.00,
    allowNull: false
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
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
  hooks: {
    beforeCreate: async (customer) => {
      if (!customer.balance) customer.balance = 0.00;
      if (!customer.creditLimit) customer.creditLimit = 100000.00;
    }
  }
});

// Instance methods
Customer.prototype.updateBalance = async function(amount) {
  this.balance = parseFloat(this.balance) + parseFloat(amount);
  await this.save();
  return this.balance;
};

Customer.prototype.getOutstandingAmount = function() {
  return Math.max(0, parseFloat(this.balance));
};

Customer.prototype.canMakeTransaction = function(amount) {
  const newBalance = parseFloat(this.balance) + parseFloat(amount);
  return newBalance <= parseFloat(this.creditLimit);
};

// Class methods
Customer.findByPhone = async function(phone) {
  return await this.findOne({ where: { phone } });
};

Customer.searchCustomers = async function(searchTerm, limit = 10) {
  return await this.findAll({
    where: {
      $or: [
        { name: { $ilike: `%${searchTerm}%` } },
        { phone: { $ilike: `%${searchTerm}%` } },
        { email: { $ilike: `%${searchTerm}%` } }
      ],
      status: 'active'
    },
    limit,
    order: [['name', 'ASC']]
  });
};

module.exports = Customer; 