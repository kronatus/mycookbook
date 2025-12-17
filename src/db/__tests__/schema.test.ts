import { describe, it, expect, beforeAll } from 'vitest';
import type { NewUser, NewRecipe, NewWishlistItem } from '../schema';

// Check if database URL is available
const isDatabaseAvailable = !!(process.env.NEON_DATABASE_URL || process.env.NEON_DEV_DATABASE_URL);

describe('Database Schema and Operations', () => {
  beforeAll(() => {
    if (!isDatabaseAvailable) {
      console.warn('Database connection not available, running schema validation tests only');
    }
  });

  describe('User Operations', () => {
    it('should create and retrieve a user', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping user operations test - no database connection');
        return;
      }

      const { userOperations } = await import('../utils');
      
      const newUser: NewUser = {
        email: 'test@example.com',
        name: 'Test User',
        preferences: {
          defaultServings: 4,
          preferredUnits: 'metric',
          dietaryRestrictions: ['vegetarian'],
          favoriteCategories: ['baking']
        }
      };

      try {
        const createdUser = await userOperations.create(newUser);
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(newUser.email);
        expect(createdUser.name).toBe(newUser.name);
        expect(createdUser.id).toBeDefined();
        expect(createdUser.createdAt).toBeDefined();

        // Clean up
        await userOperations.delete(createdUser.id);
      } catch (error) {
        // If database is not available, skip this test
        if (error instanceof Error && error.message.includes('connection')) {
          console.warn('Skipping database test - connection not available');
          return;
        }
        throw error;
      }
    });
  });

  describe('Recipe Operations', () => {
    it('should create and retrieve a recipe', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping recipe operations test - no database connection');
        return;
      }

      const { userOperations, recipeOperations } = await import('../utils');

      // First create a user
      const newUser: NewUser = {
        email: 'recipe-test@example.com',
        name: 'Recipe Test User'
      };

      try {
        const user = await userOperations.create(newUser);

        const newRecipe: NewRecipe = {
          title: 'Test Recipe',
          description: 'A test recipe',
          ingredients: [
            { name: 'flour', quantity: 2, unit: 'cups' },
            { name: 'sugar', quantity: 1, unit: 'cup' }
          ],
          instructions: [
            { stepNumber: 1, description: 'Mix ingredients' },
            { stepNumber: 2, description: 'Bake for 30 minutes' }
          ],
          cookingTime: 30,
          prepTime: 15,
          servings: 4,
          difficulty: 'easy',
          categories: ['baking'],
          tags: ['dessert', 'easy'],
          sourceType: 'manual',
          userId: user.id
        };

        const createdRecipe = await recipeOperations.create(newRecipe);
        expect(createdRecipe).toBeDefined();
        expect(createdRecipe.title).toBe(newRecipe.title);
        expect(createdRecipe.ingredients).toEqual(newRecipe.ingredients);
        expect(createdRecipe.instructions).toEqual(newRecipe.instructions);
        expect(createdRecipe.userId).toBe(user.id);

        // Clean up
        await recipeOperations.delete(createdRecipe.id);
        await userOperations.delete(user.id);
      } catch (error) {
        if (error instanceof Error && error.message.includes('connection')) {
          console.warn('Skipping database test - connection not available');
          return;
        }
        throw error;
      }
    });
  });

  describe('Wishlist Operations', () => {
    it('should create and retrieve a wishlist item', async () => {
      if (!isDatabaseAvailable) {
        console.warn('Skipping wishlist operations test - no database connection');
        return;
      }

      const { userOperations, wishlistOperations } = await import('../utils');

      // First create a user
      const newUser: NewUser = {
        email: 'wishlist-test@example.com',
        name: 'Wishlist Test User'
      };

      try {
        const user = await userOperations.create(newUser);

        const newWishlistItem: NewWishlistItem = {
          name: 'Stand Mixer',
          description: 'KitchenAid stand mixer',
          category: 'appliances',
          estimatedPrice: '299.99',
          priority: 'high',
          userId: user.id
        };

        const createdItem = await wishlistOperations.create(newWishlistItem);
        expect(createdItem).toBeDefined();
        expect(createdItem.name).toBe(newWishlistItem.name);
        expect(createdItem.category).toBe(newWishlistItem.category);
        expect(createdItem.priority).toBe(newWishlistItem.priority);
        expect(createdItem.isPurchased).toBe(false);
        expect(createdItem.userId).toBe(user.id);

        // Test marking as purchased
        const purchasedItem = await wishlistOperations.markAsPurchased(createdItem.id);
        expect(purchasedItem?.isPurchased).toBe(true);
        expect(purchasedItem?.purchaseDate).toBeDefined();

        // Clean up
        await wishlistOperations.delete(createdItem.id);
        await userOperations.delete(user.id);
      } catch (error) {
        if (error instanceof Error && error.message.includes('connection')) {
          console.warn('Skipping database test - connection not available');
          return;
        }
        throw error;
      }
    });
  });

  describe('Schema Validation', () => {
    it('should have proper type definitions', async () => {
      // Test that our schema exports the expected types
      const { userOperations, recipeOperations, wishlistOperations } = await import('../utils');
      expect(typeof userOperations.create).toBe('function');
      expect(typeof recipeOperations.create).toBe('function');
      expect(typeof wishlistOperations.create).toBe('function');
    });

    it('should export correct schema types', async () => {
      // Test that we can import the types without errors
      const schema = await import('../schema');
      expect(schema.users).toBeDefined();
      expect(schema.recipes).toBeDefined();
      expect(schema.wishlistItems).toBeDefined();
    });
  });
});