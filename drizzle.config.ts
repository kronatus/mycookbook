import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.NEON_DEV_DATABASE_URL || process.env.NEON_DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;