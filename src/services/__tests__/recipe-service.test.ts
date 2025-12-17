import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecipeService } from '../recipe-service';
import { RecipeRepository } from '../../repositories/recipe-repository';
import type { Recipe, NewRecipe } from '../../db/schema';

// Mock the repository
vi.mock('../../repositories/recipe-repository');

describe('RecipeService', () => {
  let recipeService: RecipeService;
  let mockRepository: any;

  const mockUserId = 'user-123';
  const mockRecipeId = 'recipe-123';

  const validRecipeData = {
    title: 'Test Recipe',
    description: 'A test recipe',
    ingredients: [
      { name: 'Flour', quantity: 2, unit: 'cups' },
      { name: 'Sugar', quantity: 1, unit: 'cup' }
    ],
    instructions: [
      { stepNumber: 1, description: 'Mix ingredients' },
      { stepNumber: 2, description: 'Bake for 30 minutes' }
    ],
    cookingTime: 30,
    prepTime: 15,
    servings: 4,
    difficulty: 'easy' as const,
    categories: ['dessert'],
    tags: ['sweet'],
    sourceType: 'manual' as const,
    userId: mockUserId
  };

  const mockRecipe: Recipe = {
    id: mockRecipeId,
    ...validRecipeData,
    personalNotes: null,
    sourceUrl: null,
    searchVector: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    recipeService = new RecipeService();
    mockRepository = vi.mocked(RecipeRepository.prototype);
  });

  describe('createRecipe', () => {
    it('should create a recipe successfully with valid data', async () => {
      mockRepository.create.mockResolvedValue(mockRecipe);

      const result = await recipeService.createRecipe(validRecipeData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.recipe).toEqual(mockRecipe);
      }
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Recipe',
          ingredients: validRecipeData.ingredients,
          instructions: validRecipeData.instructions
        })
      );
    });

    it('should fail validation with missing title', async () => {
      const invalidData = { ...validRecipeData, title: '' };

      const result = await recipeService.createRecipe(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('validation');
        expect(result.error.details).toContainEqual(
          expect.objectContaining({
            field: 'title',
            message: expect.stringContaining('required')
          })
        );
      }
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should fail validation with empty ingredients', async () => {
      const invalidData = { ...validRecipeData, ingredients: [] };

      const result = await recipeService.createRecipe(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('validation');
        expect(result.error.details).toContainEqual(
          expect.objectContaining({
            field: 'ingredients',
            message: expect.stringContaining('At least one ingredient is required')
          })
        );
      }
    });

    it('should fail validation with empty instructions', async () => {
      const invalidData = { ...validRecipeData, instructions: [] };

      const result = await recipeService.createRecipe(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('validation');
        expect(result.error.details).toContainEqual(
          expect.objectContaining({
            field: 'instructions',
            message: expect.stringContaining('At least one instruction is required')
          })
        );
      }
    });

    it('should handle database errors', async () => {
      mockRepository.create.mockRejectedValue(new Error('Database error'));

      const result = await recipeService.createRecipe(validRecipeData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('database');
        expect(result.error.message).toBe('Failed to create recipe');
      }
    });
  });

  describe('getRecipeById', () => {
    it('should return recipe when found and user owns it', async () => {
      mockRepository.findById.mockResolvedValue(mockRecipe);

      const result = await recipeService.getRecipeById(mockRecipeId, mockUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.recipe).toEqual(mockRecipe);
      }
    });

    it('should return not found when recipe does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await recipeService.getRecipeById(mockRecipeId, mockUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('not_found');
      }
    });

    it('should return unauthorized when user does not own recipe', async () => {
      const otherUserRecipe = { ...mockRecipe, userId: 'other-user' };
      mockRepository.findById.mockResolvedValue(otherUserRecipe);

      const result = await recipeService.getRecipeById(mockRecipeId, mockUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('unauthorized');
      }
    });
  });

  describe('updateRecipe', () => {
    const updateData = {
      title: 'Updated Recipe',
      description: 'Updated description'
    };

    it('should update recipe successfully', async () => {
      const updatedRecipe = { ...mockRecipe, ...updateData };
      mockRepository.findById.mockResolvedValue(mockRecipe);
      mockRepository.update.mockResolvedValue(updatedRecipe);

      const result = await recipeService.updateRecipe(mockRecipeId, mockUserId, updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.recipe.title).toBe('Updated Recipe');
      }
    });

    it('should fail when recipe not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await recipeService.updateRecipe(mockRecipeId, mockUserId, updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('not_found');
      }
    });

    it('should fail when user does not own recipe', async () => {
      const otherUserRecipe = { ...mockRecipe, userId: 'other-user' };
      mockRepository.findById.mockResolvedValue(otherUserRecipe);

      const result = await recipeService.updateRecipe(mockRecipeId, mockUserId, updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('unauthorized');
      }
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockRecipe);
      mockRepository.delete.mockResolvedValue(true);

      const result = await recipeService.deleteRecipe(mockRecipeId, mockUserId);

      expect(result.success).toBe(true);
    });

    it('should fail when recipe not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await recipeService.deleteRecipe(mockRecipeId, mockUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('not_found');
      }
    });

    it('should fail when user does not own recipe', async () => {
      const otherUserRecipe = { ...mockRecipe, userId: 'other-user' };
      mockRepository.findById.mockResolvedValue(otherUserRecipe);

      const result = await recipeService.deleteRecipe(mockRecipeId, mockUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('unauthorized');
      }
    });
  });

  describe('scaleRecipe', () => {
    it('should scale recipe ingredients correctly', async () => {
      mockRepository.findById.mockResolvedValue(mockRecipe);

      const result = await recipeService.scaleRecipe({
        recipeId: mockRecipeId,
        newServings: 8,
        userId: mockUserId
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.recipe.servings).toBe(8);
        expect(result.recipe.ingredients[0].quantity).toBe(4); // 2 * 2 (scaling factor)
        expect(result.recipe.ingredients[1].quantity).toBe(2); // 1 * 2 (scaling factor)
      }
    });

    it('should fail with invalid servings', async () => {
      const result = await recipeService.scaleRecipe({
        recipeId: mockRecipeId,
        newServings: 0,
        userId: mockUserId
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('validation');
      }
    });
  });

  describe('searchRecipes', () => {
    it('should return search results', async () => {
      // Mock the SearchService instead of repository directly
      const mockSearchService = {
        searchRecipes: vi.fn().mockResolvedValue([{
          recipe: mockRecipe,
          rank: 0.5,
          highlights: {}
        }])
      };
      
      // Replace the search service in the recipe service
      (recipeService as any).searchService = mockSearchService;

      const result = await recipeService.searchRecipes(mockUserId, 'test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.results).toHaveLength(1);
        expect(result.results[0].recipe).toEqual(mockRecipe);
      }
    });

    it('should return empty array for empty search term', async () => {
      const result = await recipeService.searchRecipes(mockUserId, '');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.results).toHaveLength(0);
      }
    });
  });
});