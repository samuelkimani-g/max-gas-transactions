const User = require('./User');
const Customer = require('./Customer');
const Transaction = require('./Transaction');
const Branch = require('./Branch');
const Forecast = require('./Forecast');
const Analytics = require('./Analytics');
const Payment = require('./Payment');
const PendingApproval = require('./PendingApproval');

// Define associations - Simplified for current schema
Transaction.belongsTo(Customer, { foreignKey: 'customer_id', as: 'Customer' });
Customer.hasMany(Transaction, { foreignKey: 'customer_id', as: 'Transactions' });

Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'Transactions' });

// Payment associations
Payment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'Transaction' });
Transaction.hasMany(Payment, { foreignKey: 'transactionId', as: 'Payments' });

Payment.belongsTo(Customer, { foreignKey: 'customerId', as: 'Customer' });
Customer.hasMany(Payment, { foreignKey: 'customerId', as: 'Payments' });

Payment.belongsTo(User, { foreignKey: 'processedBy', as: 'ProcessedBy' });
User.hasMany(Payment, { foreignKey: 'processedBy', as: 'ProcessedPayments' });

// Approval associations
PendingApproval.belongsTo(User, { foreignKey: 'requestedBy', as: 'RequestedByUser' });
User.hasMany(PendingApproval, { foreignKey: 'requestedBy', as: 'RequestedApprovals' });

PendingApproval.belongsTo(User, { foreignKey: 'approvedBy', as: 'ApprovedByUser' });
User.hasMany(PendingApproval, { foreignKey: 'approvedBy', as: 'ApprovedApprovals' });

module.exports = {
  User,
  Customer,
  Transaction,
  Branch,
  Forecast,
  Analytics,
  Payment,
  PendingApproval
}; 