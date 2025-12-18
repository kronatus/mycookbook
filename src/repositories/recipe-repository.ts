import { db } from '../db/connection';
import { recipes } from '../db/schema';
import { eq, and, ilike, or, sql, desc } from 'drizzle-orm';
import type { Recipe, NewRecipe } from '../db/schema';

export interface RecipeFilters {
  categories?: string[];
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  maxCookingTime?: number;
  maxPrepTime?: number;
}

export class RecipeRepository {
  async create(recipeData: NewRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values({
      ...recipeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return recipe;
  }

  async findById(id: string): Promise<Recipe | null> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || null;
  }

  async findByUserId(userId: string): Promise<Recipe[]> {
    // Use composite index for user_id + updated_at ordering
    return await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.updatedAt));
  }

  async findByUserIdWithFilters(userId: string, filters: RecipeFilters): Promise<Recipe[]> {
    // Build WHERE conditions array for better query optimization
    const conditions = [eq(recipes.userId, userId)];

    // Apply category filter using JSONB contains (uses GIN index)
    if (filters.categories && filters.categories.length > 0) {
      conditions.push(sql`${recipes.categories} ?| ${filters.categories}`);
    }

    // Apply tags filter using JSONB contains (uses GIN index)
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${recipes.tags} ?| ${filters.tags}`);
    }

    // Apply difficulty filter (uses partial index)
    if (filters.difficulty) {
      conditions.push(eq(recipes.difficulty, filters.difficulty));
    }

    // Apply cooking time filter (uses partial index)
    if (filters.maxCookingTime) {
      conditions.push(sql`${recipes.cookingTime} <= ${filters.maxCookingTime}`);
    }

    // Apply prep time filter (uses partial index)
    if (filters.maxPrepTime) {
      conditions.push(sql`${recipes.prepTime} <= ${filters.maxPrepTime}`);
    }

    // Use composite index for user_id + updated_at ordering
    return await db
      .select()
      .from(recipes)
      .where(and(...conditions))
      .orderBy(desc(recipes.updatedAt));
  }

  async search(userId: string, searchTerm: string): Promise<Recipe[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    // Use full-text search if search_vector exists, fallback to ILIKE search
    const tsQuery = this.prepareTsQuery(searchTerm);
    
    try {
      // Try full-text search first
      return await db
        .select()
        .from(recipes)
        .where(
          and(
            eq(recipes.userId, userId),
            sql`${recipes.searchVector} @@ to_tsquery('english', ${tsQuery})`
          )
        )
        .orderBy(desc(sql`ts_rank(${recipes.searchVector}, to_tsquery('english', ${tsQuery}))`));
    } catch (error) {
      // Fallback to ILIKE search if full-text search fails
      console.warn('Full-text search failed, falling back to ILIKE search:', error);
      return await db
        .select()
        .from(recipes)
        .where(
          and(
            eq(recipes.userId, userId),
            or(
              ilike(recipes.title, `%${searchTerm}%`),
              ilike(recipes.description, `%${searchTerm}%`),
              // Search in ingredients JSON - this will search ingredient names
              sql`EXISTS (
                SELECT 1 FROM jsonb_array_elements(${recipes.ingredients}) AS ingredient
                WHERE ingredient->>'name' ILIKE ${`%${searchTerm}%`}
              )`,
              // Search in instructions JSON - this will search instruction descriptions
              sql`EXISTS (
                SELECT 1 FROM jsonb_array_elements(${recipes.instructions}) AS instruction
                WHERE instruction->>'description' ILIKE ${`%${searchTerm}%`}
              )`
            )
          )
        )
        .orderBy(recipes.updatedAt);
    }
  }

  /**
   * Prepare PostgreSQL tsquery from user input
   */
  private prepareTsQuery(searchTerm: string): string {
    // Clean and prepare the search term
    const cleaned = searchTerm
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleaned) {
      return '';
    }

    // Split into words and create OR query for better matching
    const words = cleaned.split(' ').filter(word => word.length > 0);
    
    if (words.length === 1) {
      // Single word - use prefix matching
      return `${words[0]}:*`;
    } else {
      // Multiple words - create OR query with prefix matching
      return words.map(word => `${word}:*`).join(' | ');
    }
  }

  async update(id: string, recipeData: Partial<NewRecipe>): Promise<Recipe | null> {
    const [recipe] = await db
      .update(recipes)
      .set({
        ...recipeData,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id))
      .returning();
    return recipe || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return result.rowCount > 0;
  }

  async findByCategory(userId: string, category: string): Promise<Recipe[]> {
    // Use GIN index for JSONB category search and composite index for ordering
    return await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.userId, userId),
          sql`${recipes.categories} ? ${category}`
        )
      )
      .orderBy(desc(recipes.updatedAt));
  }

  async findByTag(userId: string, tag: string): Promise<Recipe[]> {
    // Use GIN index for JSONB tag search and composite index for ordering
    return await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.userId, userId),
          sql`${recipes.tags} ? ${tag}`
        )
      )
      .orderBy(desc(recipes.updatedAt));
  }

  async countByUserId(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recipes)
      .where(eq(recipes.userId, userId));
    return result.count;
  }

  /**
   * Find all recipes (not user-specific) - for anonymous access
   */
  async findAll(): Promise<Recipe[]> {
    return await db
      .select()
      .from(recipes)
      .orderBy(desc(recipes.updatedAt));
  }

  /**
   * Find all recipes with filters (not user-specific) - for anonymous access
   */
  async findWithFilters(filters: RecipeFilters): Promise<Recipe[]> {
    // Build WHERE conditions array for better query optimization
    const conditions = [];

    // Apply category filter using JSONB contains (uses GIN index)
    if (filters.categories && filters.categories.length > 0) {
      conditions.push(sql`${recipes.categories} ?| ${filters.categories}`);
    }

    // Apply tags filter using JSONB contains (uses GIN index)
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(sql`${recipes.tags} ?| ${filters.tags}`);
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      conditions.push(eq(recipes.difficulty, filters.difficulty));
    }

    // Apply cooking time filter
    if (filters.maxCookingTime) {
      conditions.push(sql`${recipes.cookingTime} <= ${filters.maxCookingTime}`);
    }

    // Apply prep time filter
    if (filters.maxPrepTime) {
      conditions.push(sql`${recipes.prepTime} <= ${filters.maxPrepTime}`);
    }

    // Use composite index for ordering
    return await db
      .select()
      .from(recipes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(recipes.updatedAt));
  }

  /**
   * Count all recipes (not user-specific) - for anonymous access
   */
  async countAll(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recipes);
    return result.count;
  }
}