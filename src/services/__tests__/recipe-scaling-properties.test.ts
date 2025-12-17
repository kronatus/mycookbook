import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { RecipeService } from '../recipe-service';
import { RecipeRepository } from '../../repositories/recipe-repository';
import type { Recipe } from '../../db/schema';

/**
 * Feature: personal-cookbook, Property 13: Recipe scaling proportionality
 * **Validates: Requirements 6.4**
 */

// Mock the repository
vi.mock('../../repositories/recipe-repository');

describe('Recipe Scaling Property Tests', () => {
  let recipeService: RecipeService;
  let mockRepository: any;

  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    recipeService = new RecipeService();
    mockRepository = vi.mocked(RecipeRepository.prototype);
  });

  it('Property 13: Recipe scaling maintains proportional ingredient quantities', async () => {
    // Simple property test: scaling from 4 servings to various other amounts
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }).filter(n => n !== 4), // new servings (different from 4)
        async (newServings: number) => {
          const originalRecipe: Recipe = {
            id: 'test-recipe-id',
            title: 'Test Recipe',
            description: null,
            ingredients: [
              { name: 'flour', quantity: 2, unit: 'cups', notes: null },
              { name: 'sugar', quantity: 1, unit: 'cup', notes: null }
            ],
            instructions: [{ stepNumber: 1, description: 'Mix ingredients', duration: null }],
            cookingTime: null,
            prepTime: null,
            servings: 4, // Original servings
            difficulty: null,
            categories: [],
            tags: [],
            sourceUrl: null,
            sourceType: 'manual',
            personalNotes: null,
            userId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Mock repository to return the original recipe
          mockRepository.findById.mockResolvedValue(originalRecipe);

          const result = await recipeService.scaleRecipe({
            recipeId: originalRecipe.id,
            newServings: newServings,
            userId: mockUserId
          });

          expect(result.success).toBe(true);
          
          if (result.success) {
            const scaledRecipe = result.recipe;
            
            // Check that servings are updated correctly
            expect(scaledRecipe.servings).toBe(newServings);
            
            // Calculate expected scaling factor
            const expectedScalingFactor = newServings / 4;
            
            // Check that flour quantity is scaled proportionally
            const expectedFlourQuantity = 2 * expectedScalingFactor;
            expect(scaledRecipe.ingredients[0].quantity).toBeCloseTo(expectedFlourQuantity, 5);
            
            // Check that sugar quantity is scaled proportionally
            const expectedSugarQuantity = 1 * expectedScalingFactor;
            expect(scaledRecipe.ingredients[1].quantity).toBeCloseTo(expectedSugarQuantity, 5);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 13: Scaling preserves ingredient ratios', async () => {
    // Test that the ratio between flour and sugar remains constant when scaling
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }).filter(n => n !== 4), // new servings (different from 4)
        async (newServings: number) => {
          const originalRecipe: Recipe = {
            id: 'test-recipe-id',
            title: 'Test Recipe',
            description: null,
            ingredients: [
              { name: 'flour', quantity: 2, unit: 'cups', notes: null },
              { name: 'sugar', quantity: 1, unit: 'cup', notes: null }
            ],
            instructions: [{ stepNumber: 1, description: 'Mix ingredients', duration: null }],
            cookingTime: null,
            prepTime: null,
            servings: 4, // Original servings
            difficulty: null,
            categories: [],
            tags: [],
            sourceUrl: null,
            sourceType: 'manual',
            personalNotes: null,
            userId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          mockRepository.findById.mockResolvedValue(originalRecipe);

          const result = await recipeService.scaleRecipe({
            recipeId: originalRecipe.id,
            newServings: newServings,
            userId: mockUserId
          });

          expect(result.success).toBe(true);
          
          if (result.success) {
            const scaledRecipe = result.recipe;
            
            // Check that ratios between ingredients are preserved
            const originalFlour = 2; // Original flour quantity
            const originalSugar = 1; // Original sugar quantity
            const scaledFlour = scaledRecipe.ingredients[0].quantity!;
            const scaledSugar = scaledRecipe.ingredients[1].quantity!;
            
            const originalRatio = originalFlour / originalSugar; // Should be 2
            const scaledRatio = scaledFlour / scaledSugar;
            
            // Ratios should be preserved (within floating point precision)
            expect(scaledRatio).toBeCloseTo(originalRatio, 5);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 13: Scaling by same servings returns identical quantities', async () => {
    // Test that scaling to the same number of servings doesn't change quantities
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // servings
        async (servings: number) => {
          const originalRecipe: Recipe = {
            id: 'test-recipe-id',
            title: 'Test Recipe',
            description: null,
            ingredients: [
              { name: 'flour', quantity: 2.5, unit: 'cups', notes: null },
              { name: 'sugar', quantity: 1, unit: 'cup', notes: null }
            ],
            instructions: [{ stepNumber: 1, description: 'Mix ingredients', duration: null }],
            cookingTime: null,
            prepTime: null,
            servings: servings, // Same as new servings
            difficulty: null,
            categories: [],
            tags: [],
            sourceUrl: null,
            sourceType: 'manual',
            personalNotes: null,
            userId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          mockRepository.findById.mockResolvedValue(originalRecipe);

          const result = await recipeService.scaleRecipe({
            recipeId: originalRecipe.id,
            newServings: servings, // Same servings = scaling factor of 1
            userId: mockUserId
          });

          expect(result.success).toBe(true);
          
          if (result.success) {
            const scaledRecipe = result.recipe;
            
            // All ingredient quantities should remain exactly the same
            expect(scaledRecipe.ingredients[0].quantity).toBe(2.5);
            expect(scaledRecipe.ingredients[1].quantity).toBe(1);
            
            // Servings should remain the same
            expect(scaledRecipe.servings).toBe(servings);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});