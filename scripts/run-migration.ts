import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../src/db/connection';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Running full-text search migration...');
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'drizzle', '0001_add_fulltext_search.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    await db.execute(sql.raw(migrationSQL));
    
    console.log('Migration completed successfully!');
    
    // Test the search functionality
    console.log('Testing search functionality...');
    
    // Test the search vector trigger
    const testResult = await db.execute(sql`
      SELECT 
        title,
        search_vector IS NOT NULL as has_search_vector
      FROM recipes 
      LIMIT 1
    `);
    
    if (testResult.rows.length > 0) {
      console.log('Search vector test:', testResult.rows[0]);
    }
    
    // Test the search function
    const functionTest = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_search_suggestions'
      ) as function_exists
    `);
    
    console.log('Search function exists:', functionTest.rows[0]?.function_exists);
    
    console.log('Full-text search setup completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export { runMigration };