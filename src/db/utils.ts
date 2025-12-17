import { db } from './connection';
import { users, recipes, wishlistItems } from './schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import type { User, Recipe, WishlistItem, NewUser, NewRecipe, NewWishlistItem } from './schema';

// User operations
export const userOperations = {
  async create(userData: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async update(id: string, userData: Partial<NewUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  },
};

// Recipe operations
export const recipeOperations = {
  async create(recipeData: NewRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(recipeData).returning();
    return recipe;
  },

  async findById(id: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  },

  async findByUserId(userId: string): Promise<Recipe[]> {
    return await db.select().from(recipes).where(eq(recipes.userId, userId));
  },

  async findByCategory(userId: string, category: string): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.userId, userId),
          // Using JSONB contains operator for category search
          // This will be implemented with raw SQL for proper JSONB querying
        )
      );
  },

  async search(userId: string, searchTerm: string): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.userId, userId),
          or(
            ilike(recipes.title, `%${searchTerm}%`),
            ilike(recipes.description, `%${searchTerm}%`)
          )
        )
      );
  },

  async update(id: string, recipeData: Partial<NewRecipe>): Promise<Recipe | undefined> {
    const [recipe] = await db
      .update(recipes)
      .set({ ...recipeData, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return recipe;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return result.rowCount > 0;
  },
};

// Wishlist operations
export const wishlistOperations = {
  async create(wishlistData: NewWishlistItem): Promise<WishlistItem> {
    const [item] = await db.insert(wishlistItems).values(wishlistData).returning();
    return item;
  },

  async findById(id: string): Promise<WishlistItem | undefined> {
    const [item] = await db.select().from(wishlistItems).where(eq(wishlistItems.id, id));
    return item;
  },

  async findByUserId(userId: string): Promise<WishlistItem[]> {
    return await db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId));
  },

  async findByCategory(userId: string, category: string): Promise<WishlistItem[]> {
    return await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, userId),
          eq(wishlistItems.category, category)
        )
      );
  },

  async findPurchased(userId: string): Promise<WishlistItem[]> {
    return await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, userId),
          eq(wishlistItems.isPurchased, true)
        )
      );
  },

  async markAsPurchased(id: string): Promise<WishlistItem | undefined> {
    const [item] = await db
      .update(wishlistItems)
      .set({ 
        isPurchased: true, 
        purchaseDate: new Date() 
      })
      .where(eq(wishlistItems.id, id))
      .returning();
    return item;
  },

  async update(id: string, wishlistData: Partial<NewWishlistItem>): Promise<WishlistItem | undefined> {
    const [item] = await db
      .update(wishlistItems)
      .set(wishlistData)
      .where(eq(wishlistItems.id, id))
      .returning();
    return item;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
    return result.rowCount > 0;
  },
};

// Database initialization and migration utilities
export async function initializeDatabase() {
  try {
    // This would typically run migrations
    // For now, we'll just check the connection
    const { sql } = await import('./connection');
    await sql`SELECT 1`;
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}