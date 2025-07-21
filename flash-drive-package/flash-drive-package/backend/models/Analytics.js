const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Stores all analytics data including KPIs, metrics, and insights'
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  generatedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('generated', 'processing', 'failed'),
    defaultValue: 'generated',
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata about the analytics generation'
  }
}, {
  tableName: 'analytics',
  timestamps: true,
  indexes: [
    {
      fields: ['type', 'date']
    },
    {
      fields: ['branch_id']
    },
    {
      fields: ['generated_by']
    }
  ]
});

// Instance methods
Analytics.prototype.getKPIs = function() {
  return this.data?.kpis || {};
};

Analytics.prototype.getMetrics = function() {
  return this.data?.metrics || {};
};

Analytics.prototype.getInsights = function() {
  return this.data?.insights || [];
};

Analytics.prototype.getCylinderAnalytics = function() {
  return this.data?.cylinderAnalytics || {};
};

// Class methods
Analytics.getLatestAnalytics = async function(type, branchId = null) {
  const where = { type };
  if (branchId) where.branchId = branchId;
  
  return await this.findOne({
    where,
    order: [['date', 'DESC']]
  });
};

Analytics.getAnalyticsByDateRange = async function(startDate, endDate, type = null, branchId = null) {
  const where = {
    date: { [sequelize.Op.between]: [startDate, endDate] }
  };
  
  if (type) where.type = type;
  if (branchId) where.branchId = branchId;
  
  return await this.findAll({
    where,
    order: [['date', 'ASC']]
  });
};

Analytics.generateDailyAnalytics = async function(date, branchId = null, userId) {
  // This would contain the logic to generate daily analytics
  // Implementation would be similar to the frontend analytics logic
  const analyticsData = {
    kpis: {},
    metrics: {},
    insights: [],
    cylinderAnalytics: {}
  };
  
  return await this.create({
    type: 'daily',
    date,
    data: analyticsData,
    branchId,
    generatedBy: userId,
    status: 'generated'
  });
};

module.exports = Analytics; 