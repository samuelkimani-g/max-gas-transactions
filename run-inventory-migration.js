#!/usr/bin/env node

// Simple script to run inventory migration
// This can be run locally to migrate your production Neon database

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Running inventory migration for production database...');
console.log('📋 This will create the inventory table in your Neon database');
console.log('');

// Run the migration script
const migrationScript = path.join(__dirname, 'backend', 'scripts', 'migrate-inventory-to-production.js');

exec(`node "${migrationScript}"`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  if (stderr) {
    console.error('⚠️  Warnings:', stderr);
  }
  
  console.log('✅ Migration output:');
  console.log(stdout);
  console.log('');
  console.log('🎉 Inventory migration completed!');
  console.log('📝 Your production database now has the inventory table.');
  console.log('💡 You can now create transactions without errors.');
});
