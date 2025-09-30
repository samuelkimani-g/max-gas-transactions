const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cylinder_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'cylinder_type'
  },
  available_stock_kg: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    field: 'available_stock_kg'
  },
  available_stock_tons: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    field: 'available_stock_tons'
  },
  supplier_place: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'supplier_place'
  },
  cost_per_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'cost_per_kg'
  },
  total_amount_paid: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'total_amount_paid'
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'branch_id',
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'inventory',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    { fields: ['cylinder_type'] },
    { fields: ['branch_id'] },
    { fields: ['created_by'] }
  ]
});

// Virtual field for total value
Inventory.prototype.getTotalValue = function() {
  return parseFloat(this.available_stock_kg * this.cost_per_kg).toFixed(2);
};

// Auto-calculate tons from kg
Inventory.addHook('beforeSave', (inventory) => {
  if (inventory.available_stock_kg !== undefined) {
    inventory.available_stock_tons = parseFloat((inventory.available_stock_kg / 1000).toFixed(3));
  }
});

// Class methods
Inventory.getByCylinderType = async function(cylinderType, branchId = null) {
  const where = { cylinder_type: cylinderType };
  if (branchId) where.branchId = branchId;
  
  return await this.findOne({ where });
};

Inventory.getByBranch = async function(branchId) {
  return await this.findAll({
    where: { branchId },
    order: [['cylinder_type', 'ASC']]
  });
};

Inventory.getAllWithCalculations = async function(branchId = null) {
  const where = branchId ? { branchId } : {};
  
  const inventories = await this.findAll({
    where,
    order: [['cylinder_type', 'ASC']]
  });
  
  return inventories.map(inventory => ({
    ...inventory.toJSON(),
    total_value: inventory.getTotalValue(),
    stock_in_tons: inventory.available_stock_tons
  }));
};

Inventory.updateStock = async function(cylinderType, quantityKg, operation = 'subtract', branchId = null) {
  const where = { cylinder_type: cylinderType };
  if (branchId) where.branchId = branchId;
  
  const inventory = await this.findOne({ where });
  
  if (!inventory) {
    throw new Error(`Inventory not found for cylinder type: ${cylinderType}`);
  }
  
  const currentStock = parseFloat(inventory.available_stock_kg);
  const newStock = operation === 'add' 
    ? currentStock + quantityKg 
    : Math.max(0, currentStock - quantityKg);
  
  await inventory.update({
    available_stock_kg: newStock
  });
  
  return inventory;
};

Inventory.addStock = async function(cylinderType, quantityKg, supplierPlace, costPerKg, totalAmountPaid, branchId, createdBy) {
  const where = { cylinder_type: cylinderType };
  if (branchId) where.branchId = branchId;
  
  let inventory = await this.findOne({ where });
  
  if (inventory) {
    // Update existing inventory
    const newStock = parseFloat(inventory.available_stock_kg) + quantityKg;
    const newTotalPaid = parseFloat(inventory.total_amount_paid) + parseFloat(totalAmountPaid);
    
    await inventory.update({
      available_stock_kg: newStock,
      supplier_place: supplierPlace,
      cost_per_kg: costPerKg,
      total_amount_paid: newTotalPaid
    });
  } else {
    // Create new inventory entry
    inventory = await this.create({
      cylinder_type: cylinderType,
      available_stock_kg: quantityKg,
      supplier_place: supplierPlace,
      cost_per_kg: costPerKg,
      total_amount_paid: totalAmountPaid,
      branchId,
      createdBy
    });
  }
  
  return inventory;
};

module.exports = Inventory;
