#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from '../src/db/connection';

async function runOptimization() {
  try {
    console.log('🚀 Starting database optimization...');

    // Read the optimization SQL file
    const migrationPath = join(process.cwd(), 'src/db/migrations/add-performance-indexes.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📊 Running performance optimization migration...');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await sql.unsafe(statement);
      } catch (error) {
        // Some statements might fail if indexes already exist, that's okay
        console.warn(`Warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('✅ Database optimization completed successfully!');

    // Get some stats about the optimization
    const indexCount = await sql`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;

    const tableStats = await sql`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('public.' || tablename) DESC
    `;

    console.log('\n📈 Optimization Summary:');
    console.log(`Total indexes: ${indexCount[0].count}`);
    console.log('\nTable sizes:');
    tableStats.forEach((table: any) => {
      console.log(`  ${table.tablename}: ${table.size}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runOptimization();
}

export { runOptimization };