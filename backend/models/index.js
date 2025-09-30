const User = require('./User');
const Customer = require('./Customer');
const Transaction = require('./Transaction');
const Branch = require('./Branch');
const Forecast = require('./Forecast');
const Analytics = require('./Analytics');
const Payment = require('./Payment');
const PendingApproval = require('./PendingApproval');
const Inventory = require('./Inventory');

// Define associations
User.belongsTo(Branch, { foreignKey: 'branchId', as: 'Branch' });
Branch.hasMany(User, { foreignKey: 'branchId', as: 'Users' });

Customer.belongsTo(Branch, { foreignKey: 'branchId', as: 'Branch' });
Branch.hasMany(Customer, { foreignKey: 'branchId', as: 'Customers' });

Transaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'Customer' });
Customer.hasMany(Transaction, { foreignKey: 'customerId', as: 'Transactions' });

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'User' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'Transactions' });

Transaction.belongsTo(Branch, { foreignKey: 'branchId', as: 'Branch' });
Branch.hasMany(Transaction, { foreignKey: 'branchId', as: 'Transactions' });

// Payment associations
Payment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'Transaction' });
Transaction.hasMany(Payment, { foreignKey: 'transactionId', as: 'Payments' });

Payment.belongsTo(Customer, { foreignKey: 'customerId', as: 'Customer' });
Customer.hasMany(Payment, { foreignKey: 'customerId', as: 'Payments' });

Payment.belongsTo(User, { foreignKey: 'processedBy', as: 'ProcessedBy' });
User.hasMany(Payment, { foreignKey: 'processedBy', as: 'ProcessedPayments' });

Payment.belongsTo(Branch, { foreignKey: 'branchId', as: 'Branch' });
Branch.hasMany(Payment, { foreignKey: 'branchId', as: 'Payments' });

// Forecast associations
Forecast.belongsTo(Branch, { foreignKey: 'branchId', as: 'Branch' });
Branch.hasMany(Forecast, { foreignKey: 'branchId', as: 'Forecasts' });

Forecast.belongsTo(User, { foreignKey: 'createdBy', as: 'CreatedBy' });
User.hasMany(Forecast, { foreignKey: 'createdBy', as: 'CreatedForecasts' });

// Analytics associations
Analytics.belongsTo(Branch, { foreignKey: 'branchId', as: 'Branch' });
Branch.hasMany(Analytics, { foreignKey: 'branchId', as: 'Analytics' });

Analytics.belongsTo(User, { foreignKey: 'generatedBy', as: 'GeneratedBy' });
User.hasMany(Analytics, { foreignKey: 'generatedBy', as: 'GeneratedAnalytics' });

// Approval associations
PendingApproval.belongsTo(User, { foreignKey: 'requestedBy', as: 'RequestedByUser' });
User.hasMany(PendingApproval, { foreignKey: 'requestedBy', as: 'RequestedApprovals' });

PendingApproval.belongsTo(User, { foreignKey: 'approvedBy', as: 'ApprovedByUser' });
User.hasMany(PendingApproval, { foreignKey: 'approvedBy', as: 'ApprovedApprovals' });

// Inventory associations
Inventory.belongsTo(Branch, { foreignKey: 'branchId', as: 'Branch' });
Branch.hasMany(Inventory, { foreignKey: 'branchId', as: 'Inventories' });

Inventory.belongsTo(User, { foreignKey: 'createdBy', as: 'CreatedBy' });
User.hasMany(Inventory, { foreignKey: 'createdBy', as: 'CreatedInventories' });

module.exports = {
  User,
  Customer,
  Transaction,
  Branch,
  Forecast,
  Analytics,
  Payment,
  PendingApproval,
  Inventory
}; 