const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Branch = sequelize.define('Branch', {
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
  type: {
    type: DataTypes.ENUM('main', 'retail', 'warehouse', 'distribution'),
    defaultValue: 'retail',
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  zipCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(50),
    defaultValue: 'Nigeria',
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  manager: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active',
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capacity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  openingHours: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Africa/Lagos',
    allowNull: false
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'branches',
  timestamps: true
});

// Instance methods
Branch.prototype.getStats = async function() {
  const Customer = require('./Customer');
  const Transaction = require('./Transaction');
  const User = require('./User');

  const [customerCount, transactionCount, userCount] = await Promise.all([
    Customer.count({ where: { branchId: this.id } }),
    Transaction.count({ where: { branchId: this.id } }),
    User.count({ where: { branchId: this.id } })
  ]);

  return {
    customerCount,
    transactionCount,
    userCount
  };
};

Branch.prototype.getRevenue = async function(startDate, endDate) {
  const Transaction = require('./Transaction');
  
  const transactions = await Transaction.findAll({
    where: {
      branchId: this.id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    },
    attributes: ['total', 'paid']
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
  const totalPaid = transactions.reduce((sum, t) => sum + parseFloat(t.paid), 0);

  return {
    totalRevenue,
    totalPaid,
    outstanding: totalRevenue - totalPaid,
    transactionCount: transactions.length
  };
};

// Class methods
Branch.getActiveBranches = async function() {
  return await this.findAll({
    where: { status: 'active' },
    order: [['name', 'ASC']]
  });
};

Branch.searchBranches = async function(searchTerm, limit = 10) {
  return await this.findAll({
    where: {
      $or: [
        { name: { $ilike: `%${searchTerm}%` } },
        { city: { $ilike: `%${searchTerm}%` } },
        { state: { $ilike: `%${searchTerm}%` } }
      ],
      status: 'active'
    },
    limit,
    order: [['name', 'ASC']]
  });
};

module.exports = Branch; 