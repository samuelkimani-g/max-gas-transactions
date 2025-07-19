const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'full_name' // Map to snake_case database column
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'operator'),
    defaultValue: 'operator',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'branch_id', // Map to snake_case database column
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login' // Map to snake_case database column
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Class methods
User.findByCredentials = async function(username, password) {
  const { Op } = require('sequelize');
  
  const user = await this.findOne({ 
    where: { 
      [Op.or]: [
        { username: username },
        { email: username }
      ],
      status: 'active'
    }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

module.exports = User; 