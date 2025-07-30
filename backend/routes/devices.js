const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { requirePermission } = require('../middleware/rbac');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to validate device identifier format
const isValidDeviceIdentifier = (deviceId) => {
  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(deviceId);
};

// Helper function to validate role
const isValidRole = (role) => {
  return ['admin', 'manager', 'operator'].includes(role);
};

// POST /api/devices/register - Admin registers a new trusted device
router.post('/register', requirePermission('system:settings'), async (req, res) => {
  try {
    const { device_identifier, userId, role, notes } = req.body;
    
    // Input validation
    if (!device_identifier || !userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'device_identifier, userId, and role are required'
      });
    }

    if (!isValidDeviceIdentifier(device_identifier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device identifier format'
      });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, manager, or operator'
      });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, username FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if device already exists
    const existingDevice = await pool.query(
      'SELECT id, user_id, role, is_active FROM trusted_devices WHERE device_identifier = $1',
      [device_identifier]
    );

    if (existingDevice.rows.length > 0) {
      // Update existing device
      await pool.query(
        `UPDATE trusted_devices 
         SET user_id = $1, role = $2, is_active = TRUE, notes = $3, created_by = $4
         WHERE device_identifier = $5`,
        [userId, role, notes || null, req.user.id, device_identifier]
      );

      return res.json({
        success: true,
        message: 'Device updated successfully',
        device: {
          device_identifier,
          user_id: userId,
          username: userCheck.rows[0].username,
          role,
          is_active: true
        }
      });
    }

    // Insert new device
    const result = await pool.query(
      `INSERT INTO trusted_devices (device_identifier, user_id, role, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, device_identifier, user_id, role, is_active, created_at`,
      [device_identifier, userId, role, notes || null, req.user.id]
    );

    res.json({
      success: true,
      message: 'Device registered successfully',
      device: {
        ...result.rows[0],
        username: userCheck.rows[0].username
      }
    });

  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/devices - Admin views all registered trusted devices
router.get('/', requirePermission('system:settings'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        td.id,
        td.device_identifier,
        td.user_id,
        u.username,
        td.role,
        td.is_active,
        td.created_at,
        td.last_accessed_at,
        td.notes,
        td.created_by,
        creator.username as created_by_username
      FROM trusted_devices td
      LEFT JOIN users u ON td.user_id = u.id
      LEFT JOIN users creator ON td.created_by = creator.id
      ORDER BY td.created_at DESC
    `);

    res.json({
      success: true,
      devices: result.rows
    });

  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/devices/:id/update - Admin updates a device
router.put('/:id/update', requirePermission('system:settings'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role, isActive, notes } = req.body;

    // Check if device exists
    const deviceCheck = await pool.query(
      'SELECT id FROM trusted_devices WHERE id = $1',
      [id]
    );

    if (deviceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (userId !== undefined) {
      // Verify user exists
      const userCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      updateFields.push(`user_id = $${paramCount}`);
      updateValues.push(userId);
      paramCount++;
    }

    if (role !== undefined) {
      if (!isValidRole(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be admin, manager, or operator'
        });
      }
      updateFields.push(`role = $${paramCount}`);
      updateValues.push(role);
      paramCount++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      updateValues.push(isActive);
      paramCount++;
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      updateValues.push(notes);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(id);
    const updateQuery = `
      UPDATE trusted_devices 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Device updated successfully',
      device: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/devices/:id/revoke - Admin revokes device access
router.delete('/:id/revoke', requirePermission('system:settings'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE trusted_devices SET is_active = FALSE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device access revoked successfully',
      device: result.rows[0]
    });

  } catch (error) {
    console.error('Error revoking device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/devices/stats - Get device statistics (admin only)
router.get('/stats', requirePermission('system:settings'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_devices,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_devices,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_devices,
        COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_devices,
        COUNT(CASE WHEN role = 'operator' THEN 1 END) as operator_devices,
        MAX(last_accessed_at) as last_device_activity
      FROM trusted_devices
    `);

    res.json({
      success: true,
      stats: stats.rows[0]
    });

  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 