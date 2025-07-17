const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Forecast = sequelize.define('Forecast', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('sales', 'demand', 'inventory', 'revenue'),
    allowNull: false
  },
  period: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  forecastData: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Stores the forecasted values and confidence intervals'
  },
  historicalData: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Stores the historical data used for forecasting'
  },
  modelType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'linear_regression'
  },
  accuracy: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: 'Model accuracy score (0-1)'
  },
  confidenceLevel: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.95
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'forecasts',
  timestamps: true,
  indexes: [
    {
      fields: ['type', 'period', 'start_date']
    },
    {
      fields: ['branch_id']
    },
    {
      fields: ['created_by']
    }
  ]
});

// Instance methods
Forecast.prototype.getForecastValues = function() {
  return this.forecastData?.values || [];
};

Forecast.prototype.getConfidenceIntervals = function() {
  return this.forecastData?.confidenceIntervals || [];
};

Forecast.prototype.getHistoricalValues = function() {
  return this.historicalData?.values || [];
};

// Class methods
Forecast.getLatestForecast = async function(type, period, branchId = null) {
  const where = { type, period };
  if (branchId) where.branchId = branchId;
  
  return await this.findOne({
    where,
    order: [['createdAt', 'DESC']]
  });
};

Forecast.getForecastsByDateRange = async function(startDate, endDate, type = null, branchId = null) {
  const where = {
    startDate: { [sequelize.Op.gte]: startDate },
    endDate: { [sequelize.Op.lte]: endDate }
  };
  
  if (type) where.type = type;
  if (branchId) where.branchId = branchId;
  
  return await this.findAll({
    where,
    order: [['startDate', 'ASC']]
  });
};

module.exports = Forecast; 