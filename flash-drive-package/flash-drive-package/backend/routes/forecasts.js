const express = require('express');
const router = express.Router();
const Forecast = require('../models/Forecast');

// @route   GET /api/forecasts
// @desc    Get all forecasts
router.get('/', async (req, res) => {
  try {
    const forecasts = await Forecast.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(forecasts);
  } catch (error) {
    console.error('Get forecasts error:', error);
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
});

// @route   POST /api/forecasts
// @desc    Create new forecast
router.post('/', async (req, res) => {
  try {
    const forecastData = req.body;
    
    // Set default values
    forecastData.createdBy = forecastData.createdBy || 1; // Default to admin user
    forecastData.status = forecastData.status || 'pending';
    
    const forecast = await Forecast.create(forecastData);
    res.status(201).json(forecast);
  } catch (error) {
    console.error('Create forecast error:', error);
    res.status(500).json({ error: 'Failed to create forecast' });
  }
});

// @route   GET /api/forecasts/:id
// @desc    Get forecast by ID
router.get('/:id', async (req, res) => {
  try {
    const forecast = await Forecast.findByPk(req.params.id);
    if (!forecast) {
      return res.status(404).json({ error: 'Forecast not found' });
    }
    res.json(forecast);
  } catch (error) {
    console.error('Get forecast by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

// @route   PUT /api/forecasts/:id
// @desc    Update forecast
router.put('/:id', async (req, res) => {
  try {
    const forecast = await Forecast.findByPk(req.params.id);
    if (!forecast) {
      return res.status(404).json({ error: 'Forecast not found' });
    }
    
    await forecast.update(req.body);
    res.json(forecast);
  } catch (error) {
    console.error('Update forecast error:', error);
    res.status(500).json({ error: 'Failed to update forecast' });
  }
});

// @route   DELETE /api/forecasts/:id
// @desc    Delete forecast
router.delete('/:id', async (req, res) => {
  try {
    const forecast = await Forecast.findByPk(req.params.id);
    if (!forecast) {
      return res.status(404).json({ error: 'Forecast not found' });
    }
    
    await forecast.destroy();
    res.json({ message: 'Forecast deleted successfully' });
  } catch (error) {
    console.error('Delete forecast error:', error);
    res.status(500).json({ error: 'Failed to delete forecast' });
  }
});

// @route   GET /api/forecasts/type/:type
// @desc    Get forecasts by type
router.get('/type/:type', async (req, res) => {
  try {
    const forecasts = await Forecast.findAll({
      where: { type: req.params.type },
      order: [['createdAt', 'DESC']]
    });
    res.json(forecasts);
  } catch (error) {
    console.error('Get forecasts by type error:', error);
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
});

module.exports = router; 