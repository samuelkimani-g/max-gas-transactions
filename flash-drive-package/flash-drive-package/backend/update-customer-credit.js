const { Customer } = require('./models');

async function updateCustomerCredit() {
  try {
    console.log('🔧 Updating customer credit limits...');
    
    // Update all existing customers to have a higher credit limit
    const updatedCount = await Customer.update(
      { creditLimit: 100000.00 },
      { 
        where: { 
          creditLimit: { [require('sequelize').Op.lt]: 100000.00 } 
        } 
      }
    );
    
    console.log(`✅ Updated ${updatedCount[0]} customers with higher credit limit`);
    
    // Show current customers and their credit limits
    const customers = await Customer.findAll({
      attributes: ['id', 'name', 'phone', 'creditLimit', 'balance']
    });
    
    console.log('\n📋 Current customers:');
    customers.forEach(customer => {
      console.log(`- ${customer.name} (${customer.phone}): Credit Limit: ${customer.creditLimit}, Balance: ${customer.balance}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateCustomerCredit(); 