const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// @route   GET /api/forecast/demand
// @desc    Get demand predictions using ARIMA
// @access  Private (Admin only)
router.get('/demand', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('forecast:read')
], async (req, res) => {
  try {
    const { 
      cylinderType = 'all', 
      days = 30, 
      branchId,
      startDate,
      endDate 
    } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    } else {
      // Default to last 90 days for forecasting
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      dateFilter = {
        date: {
          [Op.between]: [startDate, endDate]
        }
      };
    }

    // Build branch filter
    let branchFilter = {};
    if (branchId) {
      branchFilter = { branchId };
    }

    // Get historical transaction data
    const where = { ...dateFilter, ...branchFilter };
    
    const transactions = await Transaction.findAll({
      where,
      attributes: [
        'id', 'date', 'load_6kg', 'load_13kg', 'load_50kg', 
        'total_load', 'total_bill', 'branchId'
      ],
      order: [['date', 'ASC']]
    });

    // Process data for forecasting
    const forecastData = await generateDemandForecast(transactions, cylinderType, parseInt(days));

    res.json({
      success: true,
      data: forecastData,
      parameters: {
        cylinderType,
        days: parseInt(days),
        branchId,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Error generating demand forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/forecast/inventory
// @desc    Get inventory forecast based on demand patterns
// @access  Private (Admin only)
router.get('/inventory', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('forecast:read')
], async (req, res) => {
  try {
    const { days = 30, branchId } = req.query;

    // Get current inventory levels
    const currentInventory = await Inventory.findAll({
      where: branchId ? { branchId } : {},
      include: [
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'name', 'location']
        }
      ]
    });

    // Get historical demand data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const transactions = await Transaction.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        },
        ...(branchId ? { branchId } : {})
      },
      attributes: ['date', 'load_6kg', 'load_13kg', 'load_50kg'],
      order: [['date', 'ASC']]
    });

    // Generate inventory forecasts
    const inventoryForecasts = await generateInventoryForecast(
      currentInventory, 
      transactions, 
      parseInt(days)
    );

    res.json({
      success: true,
      data: inventoryForecasts,
      parameters: {
        days: parseInt(days),
        branchId
      }
    });

  } catch (error) {
    console.error('Error generating inventory forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/forecast/sales
// @desc    Get sales forecast and trends
// @access  Private (Admin only)
router.get('/sales', [
  authenticateToken,
  authorizeRoles(['admin']),
  requirePermission('forecast:read')
], async (req, res) => {
  try {
    const { 
      days = 30, 
      branchId,
      startDate,
      endDate 
    } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    } else {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      dateFilter = {
        date: {
          [Op.between]: [startDate, endDate]
        }
      };
    }

    const where = {
      ...dateFilter,
      ...(branchId ? { branchId } : {})
    };

    const transactions = await Transaction.findAll({
      where,
      attributes: ['date', 'total_bill', 'load_6kg', 'load_13kg', 'load_50kg'],
      order: [['date', 'ASC']]
    });

    const salesForecast = await generateSalesForecast(transactions, parseInt(days));

    res.json({
      success: true,
      data: salesForecast,
      parameters: {
        days: parseInt(days),
        branchId,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Error generating sales forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to generate demand forecast using simple moving average
async function generateDemandForecast(transactions, cylinderType, days) {
  const cylinderTypes = ['6KG', '13KG', '50KG'];
  const forecasts = {};

  for (const type of cylinderTypes) {
    if (cylinderType !== 'all' && cylinderType !== type) continue;

    const field = `load_${type.toLowerCase().replace('kg', 'kg')}`;
    const historicalData = transactions.map(t => ({
      date: t.date,
      value: t[field] || 0
    }));

    // Calculate daily averages
    const dailyAverages = calculateDailyAverages(historicalData);
    
    // Simple moving average forecast
    const forecast = calculateMovingAverageForecast(dailyAverages, days);
    
    forecasts[type] = {
      historical: dailyAverages,
      forecast: forecast,
      trend: calculateTrend(dailyAverages),
      confidence: calculateConfidence(dailyAverages)
    };
  }

  return forecasts;
}

// Helper function to generate inventory forecast
async function generateInventoryForecast(currentInventory, transactions, days) {
  const forecasts = [];

  for (const item of currentInventory) {
    const cylinderType = item.cylinder_type;
    const field = `load_${cylinderType.toLowerCase().replace('kg', 'kg')}`;
    
    // Get historical demand for this cylinder type
    const historicalDemand = transactions.map(t => ({
      date: t.date,
      demand: t[field] || 0
    }));

    const dailyDemand = calculateDailyAverages(historicalDemand);
    const avgDailyDemand = dailyDemand.reduce((sum, day) => sum + day.value, 0) / dailyDemand.length;
    
    // Calculate forecast
    const projectedDemand = avgDailyDemand * days;
    const currentStock = item.available_stock_kg;
    const daysRemaining = Math.floor(currentStock / avgDailyDemand);
    const recommendedOrder = Math.max(0, projectedDemand - currentStock);
    
    forecasts.push({
      ...item.toJSON(),
      current_stock_kg: currentStock,
      current_stock_tons: item.available_stock_tons,
      avg_daily_demand: avgDailyDemand,
      projected_demand: projectedDemand,
      days_remaining: daysRemaining,
      recommended_order: recommendedOrder,
      status: daysRemaining < 7 ? 'LOW' : daysRemaining < 14 ? 'MEDIUM' : 'GOOD'
    });
  }

  return forecasts;
}

// Helper function to generate sales forecast
async function generateSalesForecast(transactions, days) {
  const dailySales = calculateDailyAverages(
    transactions.map(t => ({
      date: t.date,
      value: parseFloat(t.total_bill) || 0
    }))
  );

  const forecast = calculateMovingAverageForecast(dailySales, days);
  const trend = calculateTrend(dailySales);
  const confidence = calculateConfidence(dailySales);

  return {
    historical: dailySales,
    forecast: forecast,
    trend: trend,
    confidence: confidence,
    summary: {
      avg_daily_sales: dailySales.reduce((sum, day) => sum + day.value, 0) / dailySales.length,
      projected_revenue: forecast.reduce((sum, day) => sum + day.value, 0),
      growth_rate: trend
    }
  };
}

// Helper function to calculate daily averages
function calculateDailyAverages(data) {
  const dailyTotals = {};
  const dailyCounts = {};

  data.forEach(item => {
    const date = new Date(item.date).toISOString().split('T')[0];
    if (!dailyTotals[date]) {
      dailyTotals[date] = 0;
      dailyCounts[date] = 0;
    }
    dailyTotals[date] += item.value;
    dailyCounts[date]++;
  });

  return Object.keys(dailyTotals).map(date => ({
    date: new Date(date),
    value: dailyTotals[date] / dailyCounts[date]
  })).sort((a, b) => a.date - b.date);
}

// Helper function to calculate moving average forecast
function calculateMovingAverageForecast(data, days) {
  if (data.length === 0) return [];

  const windowSize = Math.min(7, data.length); // 7-day moving average
  const forecast = [];
  
  // Calculate average of last windowSize days
  const recentData = data.slice(-windowSize);
  const avgValue = recentData.reduce((sum, item) => sum + item.value, 0) / recentData.length;
  
  // Generate forecast
  const lastDate = new Date(data[data.length - 1].date);
  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    forecast.push({
      date: forecastDate,
      value: avgValue
    });
  }

  return forecast;
}

// Helper function to calculate trend
function calculateTrend(data) {
  if (data.length < 2) return 0;
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
  
  return ((secondAvg - firstAvg) / firstAvg) * 100;
}

// Helper function to calculate confidence
function calculateConfidence(data) {
  if (data.length < 3) return 0.5;
  
  const values = data.map(item => item.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Higher confidence for lower coefficient of variation
  const coefficientOfVariation = stdDev / mean;
  return Math.max(0.1, Math.min(0.9, 1 - coefficientOfVariation));
}

module.exports = router;
