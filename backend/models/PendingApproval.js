const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PendingApproval = sequelize.define('PendingApproval', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestType: {
    type: DataTypes.ENUM('customer_edit', 'customer_delete', 'transaction_edit', 'transaction_delete'),
    allowNull: false
  },
  entityType: {
    type: DataTypes.ENUM('customer', 'transaction'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requestedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  originalData: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Original data before changes'
  },
  requestedChanges: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Requested changes to be applied'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for the change request'
  },
  managerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Manager notes when approving/rejecting'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pending_approvals',
  timestamps: true
});

module.exports = PendingApproval; 