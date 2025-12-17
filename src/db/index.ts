// Main database exports
export { db, sql, checkConnection } from './connection';
export * from './schema';
export { userOperations, recipeOperations, wishlistOperations, initializeDatabase } from './utils';
export { runMigrations } from './migrate';

// Re-export services, repositories, and validators
export * from '../services';
export * from '../repositories';
export * from '../validators';

// Re-export types for convenience
export type {
  User,
  NewUser,
  Recipe,
  NewRecipe,
  WishlistItem,
  NewWishlistItem,
} from './schema';