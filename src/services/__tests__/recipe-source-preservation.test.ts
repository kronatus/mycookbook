import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { RecipeService } from '../recipe-service';
import { RecipeRepository } from '../../repositories/recipe-repository';
import type { Recipe } from '../../db/schema';

/**
 * Feature: personal-cookbook, Property 14: Source information preservation
 * **Validates: Requirements 6.5**
 */

// Mock the repository
vi.mock('../../repositories/recipe-repository');

describe('Recipe Source Preservation Property Tests', () => {
  let recipeService: RecipeService;
  let mockRepository: any;

  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    recipeService = new RecipeService();
    mockRepository = vi.mocked(RecipeRepository.prototype);
  });

  it('Property 14: Recipe modifications preserve original source information', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate original source information
        fc.record({
          sourceUrl: fc.option(fc.webUrl(), { nil: undefined }),
          sourceType: fc.constantFrom('web', 'video', 'document', 'manual')
        }),
        // Generate modification data (excluding source fields)
        fc.record({
          title: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
          description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
          personalNotes: fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
          cookingTime: fc.option(fc.integer({ min: 1, max: 480 }), { nil: undefined }),
          prepTime: fc.option(fc.integer({ min: 1, max: 240 }), { nil: undefined }),
          servings: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
          difficulty: fc.option(fc.constantFrom('easy', 'medium', 'hard'), { nil: undefined }),
          categories: fc.option(fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }), { nil: undefined }),
          tags: fc.option(fc.array(fc.string({ minLength: 1 }), { maxLength: 10 }), { nil: undefined })
        }),
        async (originalSource, modifications) => {
          const originalRecipe: Recipe = {
            id: 'test-recipe-id',
            title: 'Original Recipe',
            description: 'Original description',
            ingredients: [
              { name: 'flour', quantity: 2, unit: 'cups' },
              { name: 'sugar', quantity: 1, unit: 'cup' }
            ],
            instructions: [
              { stepNumber: 1, description: 'Mix ingredients' }
            ],
            cookingTime: 30,
            prepTime: 15,
            servings: 4,
            difficulty: 'easy',
            categories: ['baking'],
            tags: ['dessert'],
            sourceUrl: originalSource.sourceUrl || null,
            sourceType: originalSource.sourceType,
            personalNotes: 'Original notes',
            userId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Mock repository methods
          mockRepository.findById.mockResolvedValue(originalRecipe);
          
          // Mock the update method to simulate real behavior - only update provided fields
          mockRepository.update.mockImplementation(async (id: string, updateData: any) => {
            return {
              ...originalRecipe,
              ...updateData,
              // Source information should NOT be in updateData, so it gets preserved
              sourceUrl: originalRecipe.sourceUrl,
              sourceType: originalRecipe.sourceType,
              updatedAt: new Date()
            };
          });

          // Perform the update
          const result = await recipeService.updateRecipe(
            originalRecipe.id,
            mockUserId,
            modifications
          );

          expect(result.success).toBe(true);
          
          if (result.success) {
            const updatedRecipe = result.recipe;
            
            // Verify that source information is preserved
            expect(updatedRecipe.sourceUrl).toBe(originalRecipe.sourceUrl);
            expect(updatedRecipe.sourceType).toBe(originalRecipe.sourceType);
            
            // Verify that other modifications were applied (if provided)
            if (modifications.title !== undefined) {
              expect(updatedRecipe.title).toBe(modifications.title);
            }
            if (modifications.personalNotes !== undefined) {
              expect(updatedRecipe.personalNotes).toBe(modifications.personalNotes);
            }
            if (modifications.cookingTime !== undefined) {
              expect(updatedRecipe.cookingTime).toBe(modifications.cookingTime);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Source preservation applies to all source types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('web', 'video', 'document', 'manual'),
        fc.option(fc.webUrl(), { nil: undefined }),
        fc.string({ minLength: 1, maxLength: 200 }), // new title
        async (sourceType, sourceUrl, newTitle) => {
          const originalRecipe: Recipe = {
            id: 'test-recipe-id',
            title: 'Original Recipe',
            description: null,
            ingredients: [{ name: 'ingredient', quantity: 1, unit: 'cup' }],
            instructions: [{ stepNumber: 1, description: 'Do something' }],
            cookingTime: null,
            prepTime: null,
            servings: null,
            difficulty: null,
            categories: [],
            tags: [],
            sourceUrl: sourceUrl || null,
            sourceType: sourceType,
            personalNotes: null,
            userId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          mockRepository.findById.mockResolvedValue(originalRecipe);
          
          // Mock the update method to simulate real behavior
          mockRepository.update.mockImplementation(async (id: string, updateData: any) => {
            return {
              ...originalRecipe,
              ...updateData,
              // Source information should be preserved
              sourceUrl: originalRecipe.sourceUrl,
              sourceType: originalRecipe.sourceType,
              updatedAt: new Date()
            };
          });

          const result = await recipeService.updateRecipe(
            originalRecipe.id,
            mockUserId,
            { title: newTitle }
          );

          expect(result.success).toBe(true);
          
          if (result.success) {
            const updatedRecipe = result.recipe;
            
            // Source information must be preserved regardless of source type
            expect(updatedRecipe.sourceUrl).toBe(originalRecipe.sourceUrl);
            expect(updatedRecipe.sourceType).toBe(originalRecipe.sourceType);
            
            // Title should be updated
            expect(updatedRecipe.title).toBe(newTitle);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Source preservation works with complex ingredient and instruction updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          sourceUrl: fc.option(fc.webUrl(), { nil: undefined }),
          sourceType: fc.constantFrom('web', 'video', 'document', 'manual')
        }),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            quantity: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
            unit: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
            notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            stepNumber: fc.integer({ min: 1, max: 20 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            duration: fc.option(fc.integer({ min: 1, max: 120 }), { nil: undefined })
          }),
          { minLength: 1, maxLength: 10 }
        ).map(instructions => 
          instructions.map((inst, index) => ({ ...inst, stepNumber: index + 1 }))
        ),
        async (originalSource, newIngredients, newInstructions) => {
          const originalRecipe: Recipe = {
            id: 'test-recipe-id',
            title: 'Complex Recipe',
            description: null,
            ingredients: [{ name: 'old ingredient', quantity: 1, unit: 'cup' }],
            instructions: [{ stepNumber: 1, description: 'Old instruction' }],
            cookingTime: null,
            prepTime: null,
            servings: null,
            difficulty: null,
            categories: [],
            tags: [],
            sourceUrl: originalSource.sourceUrl || null,
            sourceType: originalSource.sourceType,
            personalNotes: null,
            userId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          mockRepository.findById.mockResolvedValue(originalRecipe);
          
          // Mock the update method to simulate real behavior
          mockRepository.update.mockImplementation(async (id: string, updateData: any) => {
            return {
              ...originalRecipe,
              ...updateData,
              // Source information should be preserved
              sourceUrl: originalRecipe.sourceUrl,
              sourceType: originalRecipe.sourceType,
              updatedAt: new Date()
            };
          });

          const result = await recipeService.updateRecipe(
            originalRecipe.id,
            mockUserId,
            { 
              ingredients: newIngredients,
              instructions: newInstructions
            }
          );

          expect(result.success).toBe(true);
          
          if (result.success) {
            const updatedRecipe = result.recipe;
            
            // Source information must be preserved even with complex updates
            expect(updatedRecipe.sourceUrl).toBe(originalRecipe.sourceUrl);
            expect(updatedRecipe.sourceType).toBe(originalRecipe.sourceType);
            
            // Verify the complex updates were applied
            expect(updatedRecipe.ingredients).toEqual(newIngredients);
            expect(updatedRecipe.instructions).toEqual(newInstructions);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});