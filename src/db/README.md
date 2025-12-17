# Database Setup

This directory contains the database schema, connection configuration, and utilities for the Personal Cookbook application.

## Overview

The application uses:
- **Neon PostgreSQL** as the database provider
- **Drizzle ORM** for type-safe database operations
- **Database branching** for environment isolation

## Environment Configuration

### Required Environment Variables

```bash
# Production database (Neon main branch)
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/main

# Development database (Neon dev branch)
NEON_DEV_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dev
```

### Environment Strategy

- **Production**: Uses `NEON_DATABASE_URL` (main branch)
- **Development**: Uses `NEON_DEV_DATABASE_URL` (dev branch)
- **Local Development**: Uses `NEON_DEV_DATABASE_URL` (dev branch)
- **Testing**: Gracefully handles missing database URLs with mock connections

## Database Schema

### Tables

1. **users** - User accounts and preferences
2. **recipes** - Recipe data with ingredients and instructions
3. **wishlist_items** - Kitchen equipment wishlist

### Key Features

- **JSONB columns** for flexible data storage (ingredients, instructions, preferences)
- **Full-text search indexes** for recipe search functionality
- **Foreign key relationships** with cascade delete
- **Optimized indexes** for common query patterns

## Usage

### Running Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Database Operations

```typescript
import { db, userOperations, recipeOperations, wishlistOperations } from '@/db';

// Create a user
const user = await userOperations.create({
  email: 'user@example.com',
  name: 'John Doe'
});

// Create a recipe
const recipe = await recipeOperations.create({
  title: 'Chocolate Cake',
  ingredients: [
    { name: 'flour', quantity: 2, unit: 'cups' }
  ],
  instructions: [
    { stepNumber: 1, description: 'Mix ingredients' }
  ],
  userId: user.id
});
```

### Connection Health Check

```typescript
import { checkConnection } from '@/db';

const result = await checkConnection();
if (result.success) {
  console.log('Database connected successfully');
} else {
  console.error('Database connection failed:', result.message);
}
```

## Testing

The database layer includes comprehensive tests that:
- Validate schema definitions and types
- Test CRUD operations for all entities
- Handle graceful fallbacks when database is unavailable
- Use mock connections in test environments

Run tests with:
```bash
npm test
```

## Files

- `schema.ts` - Database schema definitions using Drizzle
- `connection.ts` - Database connection and configuration
- `utils.ts` - Database operation utilities and helpers
- `migrate.ts` - Migration runner
- `index.ts` - Main exports for the database layer
- `__tests__/` - Test files for database functionality