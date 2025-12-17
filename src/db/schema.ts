import { pgTable, text, integer, timestamp, boolean, decimal, uuid, jsonb, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  preferences: jsonb('preferences').$type<{
    defaultServings: number;
    preferredUnits: 'metric' | 'imperial';
    dietaryRestrictions: string[];
    favoriteCategories: string[];
  }>().default({
    defaultServings: 4,
    preferredUnits: 'metric',
    dietaryRestrictions: [],
    favoriteCategories: []
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Recipes table
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  ingredients: jsonb('ingredients').$type<Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>>().notNull().default([]),
  instructions: jsonb('instructions').$type<Array<{
    stepNumber: number;
    description: string;
    duration?: number;
  }>>().notNull().default([]),
  cookingTime: integer('cooking_time'), // in minutes
  prepTime: integer('prep_time'), // in minutes
  servings: integer('servings'),
  difficulty: text('difficulty').$type<'easy' | 'medium' | 'hard'>(),
  categories: jsonb('categories').$type<string[]>().notNull().default([]),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  sourceUrl: text('source_url'),
  sourceType: text('source_type').$type<'web' | 'video' | 'document' | 'manual'>().notNull().default('manual'),
  personalNotes: text('personal_notes'),
  searchVector: text('search_vector'), // tsvector for full-text search
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('recipes_user_id_idx').on(table.userId),
  titleIdx: index('recipes_title_idx').on(table.title),
  // Note: GIN indexes for JSONB and tsvector will be created via raw SQL in migrations
  categoriesIdx: index('recipes_categories_idx').on(table.categories),
  tagsIdx: index('recipes_tags_idx').on(table.tags),
}));

// Wishlist items table
export const wishlistItems = pgTable('wishlist_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  estimatedPrice: decimal('estimated_price', { precision: 10, scale: 2 }),
  priority: text('priority').$type<'low' | 'medium' | 'high'>().notNull().default('medium'),
  isPurchased: boolean('is_purchased').notNull().default(false),
  purchaseDate: timestamp('purchase_date'),
  notes: text('notes'),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('wishlist_items_user_id_idx').on(table.userId),
  categoryIdx: index('wishlist_items_category_idx').on(table.category),
  isPurchasedIdx: index('wishlist_items_is_purchased_idx').on(table.isPurchased),
}));

// Search history table
export const searchHistory = pgTable('search_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  searchTerm: text('search_term').notNull(),
  searchCount: integer('search_count').notNull().default(1),
  lastSearchedAt: timestamp('last_searched_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('search_history_user_id_idx').on(table.userId),
  userTermIdx: index('search_history_user_term_idx').on(table.userId, table.searchTerm),
  lastSearchedIdx: index('search_history_last_searched_idx').on(table.userId, table.lastSearchedAt),
}));

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  recipes: many(recipes),
  wishlistItems: many(wishlistItems),
  searchHistory: many(searchHistory),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

// Export types for use in the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;