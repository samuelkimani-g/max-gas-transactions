const { sequelize } = require('../config/database');
const Transaction = require('../models/Transaction');

// Generate new serial number with format: YYMMDD-XXXXXX
const generateNewTransactionNumber = (date) => {
  const transactionDate = new Date(date);
  const year = transactionDate.getFullYear().toString().slice(-2);
  const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
  const day = String(transactionDate.getDate()).padStart(2, '0');
  
  // Generate 6 random alphanumeric characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomSuffix = '';
  for (let i = 0; i < 6; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${year}${month}${day}-${randomSuffix}`;
};

const updateTransactionNumbers = async () => {
  try {
    console.log('Starting transaction number update...');
    
    // Get all transactions with old format (A0001, B0002, etc.)
    const transactions = await Transaction.findAll();
    const oldFormatTransactions = transactions.filter(t => 
      /^[A-Z][0-9]{4}$/.test(t.transaction_number)
    );
    
    console.log(`Found ${oldFormatTransactions.length} transactions to update`);
    
    for (const transaction of oldFormatTransactions) {
      const newNumber = generateNewTransactionNumber(transaction.date);
      
      console.log(`Updating transaction ${transaction.id}: ${transaction.transaction_number} -> ${newNumber}`);
      
      await transaction.update({
        transaction_number: newNumber
      });
    }
    
    console.log('Transaction number update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating transaction numbers:', error);
    process.exit(1);
  }
};

updateTransactionNumbers(); 