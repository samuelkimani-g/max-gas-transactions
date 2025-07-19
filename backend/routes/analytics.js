const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// @route   GET /api/analytics
// @desc    Get all analytics
router.get('/', async (req, res) => {
  try {
    const analytics = await Analytics.findAll({
      order: [['date', 'DESC']]
    });
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// @route   POST /api/analytics
// @desc    Create new analytics
router.post('/', async (req, res) => {
  try {
    const analyticsData = req.body;
    
    // Set default values
    analyticsData.date = analyticsData.date || new Date();
    analyticsData.generatedBy = analyticsData.generatedBy || 1; // Default to admin user
    analyticsData.status = analyticsData.status || 'generated';
    
    const analytics = await Analytics.create(analyticsData);
    res.status(201).json(analytics);
  } catch (error) {
    console.error('Create analytics error:', error);
    res.status(500).json({ error: 'Failed to create analytics' });
  }
});

// @route   GET /api/analytics/:id
// @desc    Get analytics by ID
router.get('/:id', async (req, res) => {
  try {
    const analytics = await Analytics.findByPk(req.params.id);
    if (!analytics) {
      return res.status(404).json({ error: 'Analytics not found' });
    }
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// @route   PUT /api/analytics/:id
// @desc    Update analytics
router.put('/:id', async (req, res) => {
  try {
    const analytics = await Analytics.findByPk(req.params.id);
    if (!analytics) {
      return res.status(404).json({ error: 'Analytics not found' });
    }
    
    await analytics.update(req.body);
    res.json(analytics);
  } catch (error) {
    console.error('Update analytics error:', error);
    res.status(500).json({ error: 'Failed to update analytics' });
  }
});

// @route   DELETE /api/analytics/:id
// @desc    Delete analytics
router.delete('/:id', async (req, res) => {
  try {
    const analytics = await Analytics.findByPk(req.params.id);
    if (!analytics) {
      return res.status(404).json({ error: 'Analytics not found' });
    }
    
    await analytics.destroy();
    res.json({ message: 'Analytics deleted successfully' });
  } catch (error) {
    console.error('Delete analytics error:', error);
    res.status(500).json({ error: 'Failed to delete analytics' });
  }
});

// @route   GET /api/analytics/type/:type
// @desc    Get analytics by type
router.get('/type/:type', async (req, res) => {
  try {
    const analytics = await Analytics.findAll({
      where: { type: req.params.type },
      order: [['date', 'DESC']]
    });
    res.json(analytics);
  } catch (error) {
    console.error('Get analytics by type error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// @route   GET /api/analytics/ping
// @desc    Simple ping endpoint for keep-alive services
// @access  Public
router.get('/ping', async (req, res) => {
  res.json({
    success: true,
    message: 'Server is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router; 