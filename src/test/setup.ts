// Test setup file
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set test environment variables if not already set
  if (!process.env.NEON_DEV_DATABASE_URL && !process.env.NEON_DATABASE_URL) {
    console.warn('No database URL found in environment variables. Database tests will be skipped.');
  }
});