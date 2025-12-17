import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Environment-specific database URLs
const getDatabaseUrl = () => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return process.env.NEON_DATABASE_URL;
    case 'development':
    case 'test':
    default:
      return process.env.NEON_DEV_DATABASE_URL || process.env.NEON_DATABASE_URL;
  }
};

const databaseUrl = getDatabaseUrl();

// In test environment without database URL, create a mock connection
let sql: any;
let db: any;

if (!databaseUrl) {
  if (process.env.NODE_ENV === 'test') {
    // Create mock functions for testing without database
    sql = () => Promise.resolve([]);
    db = {
      select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
      insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
      delete: () => ({ where: () => Promise.resolve({ rowCount: 0 }) }),
    };
  } else {
    throw new Error(
      'Database URL not found. Please set NEON_DATABASE_URL or NEON_DEV_DATABASE_URL environment variable.'
    );
  }
} else {
  // Create Neon serverless connection
  sql = neon(databaseUrl);
  // Create Drizzle instance with schema
  db = drizzle(sql, { schema });
}

export { db, sql };

// Connection health check
export async function checkConnection() {
  try {
    // If we don't have a real database URL, return false
    if (!databaseUrl) {
      return { 
        success: false, 
        message: 'No database URL configured' 
      };
    }
    
    if (typeof sql === 'function') {
      await sql`SELECT 1`;
    }
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}