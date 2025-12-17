#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('Generating database migration...');

try {
  // Generate migration using drizzle-kit
  execSync('npx drizzle-kit generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('Migration generated successfully!');
  console.log('To apply the migration, run: npm run db:migrate');
} catch (error) {
  console.error('Failed to generate migration:', error.message);
  process.exit(1);
}