import { RecipeRepository, type RecipeFilters } from '../repositories/recipe-repository';
import { RecipeValidator, type ValidationResult } from '../validators/recipe-validator';
import { SearchService, type SearchResult, type SearchSuggestion } from './search-service';
import { getCacheService, createFilterHash } from './cache-service';
import type { Recipe, NewRecipe } from '../db/schema';

export interface CreateRecipeRequest {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  instructions: Array<{
    stepNumber: number;
    description: string;
    duration?: number;
  }>;
  cookingTime?: number;
  prepTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  categories?: string[];
  tags?: string[];
  sourceUrl?: string;
  sourceType?: 'web' | 'video' | 'document' | 'manual';
  personalNotes?: string;
  userId: string;
}

export interface UpdateRecipeRequest {
  title?: string;
  description?: string;
  ingredients?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  instructions?: Array<{
    stepNumber: number;
    description: string;
    duration?: number;
  }>;
  cookingTime?: number;
  prepTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  categories?: string[];
  tags?: string[];
  sourceUrl?: string;
  sourceType?: 'web' | 'video' | 'document' | 'manual';
  personalNotes?: string;
}

export interface ScaleRecipeRequest {
  recipeId: string;
  newServings: number;
  userId: string;
}

export interface RecipeServiceError {
  type: 'validation' | 'not_found' | 'unauthorized' | 'database';
  message: string;
  details?: any;
}

export class RecipeService {
  private repository: RecipeRepository;
  private searchService: SearchService;
  private cacheService = getCacheService();

  constructor() {
    this.repository = new RecipeRepository();
    this.searchService = new SearchService();
  }

  async createRecipe(request: CreateRecipeRequest): Promise<{ success: true; recipe: Recipe } | { success: false; error: RecipeServiceError }> {
    try {
      // Sanitize input data
      const sanitizedData = RecipeValidator.sanitizeRecipeData(request);
      
      // Validate the recipe data
      const validation = RecipeValidator.validate(sanitizedData as NewRecipe);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Recipe validation failed',
            details: validation.errors
          }
        };
      }

      // Create the recipe
      const recipe = await this.repository.create(sanitizedData as NewRecipe);
      
      // Cache the new recipe
      await this.cacheService.setRecipe(recipe);
      
      // Invalidate user's recipe cache since they have a new recipe
      await this.cacheService.invalidateUserRecipes(recipe.userId);
      
      return {
        success: true,
        recipe
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to create recipe',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getRecipeById(id: string, userId: string): Promise<{ success: true; recipe: Recipe } | { success: false; error: RecipeServiceError }> {
    try {
      // Try to get from cache first
      let recipe = await this.cacheService.getRecipe(id);
      
      if (!recipe) {
        // Cache miss, get from database
        recipe = await this.repository.findById(id);
        
        if (recipe) {
          // Cache the recipe for future requests
          await this.cacheService.setRecipe(recipe);
        }
      }
      
      if (!recipe) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'Recipe not found'
          }
        };
      }

      // Check if user owns this recipe
      if (recipe.userId !== userId) {
        return {
          success: false,
          error: {
            type: 'unauthorized',
            message: 'You do not have permission to access this recipe'
          }
        };
      }

      return {
        success: true,
        recipe
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to retrieve recipe',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getUserRecipes(userId: string, filters?: RecipeFilters): Promise<{ success: true; recipes: Recipe[] } | { success: false; error: RecipeServiceError }> {
    try {
      let recipes: Recipe[];
      
      // Create cache key based on filters
      const filterHash = filters && Object.keys(filters).length > 0 ? createFilterHash(filters) : undefined;
      
      // Try to get from cache first
      const cachedRecipes = await this.cacheService.getUserRecipes(userId, filterHash);
      
      if (cachedRecipes) {
        return {
          success: true,
          recipes: cachedRecipes
        };
      }
      
      // Cache miss, get from database
      if (filters && Object.keys(filters).length > 0) {
        recipes = await this.repository.findByUserIdWithFilters(userId, filters);
      } else {
        recipes = await this.repository.findByUserId(userId);
      }

      // Cache the results
      await this.cacheService.setUserRecipes(userId, recipes, filterHash);

      return {
        success: true,
        recipes
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to retrieve recipes',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async updateRecipe(id: string, userId: string, request: UpdateRecipeRequest): Promise<{ success: true; recipe: Recipe } | { success: false; error: RecipeServiceError }> {
    try {
      // First check if recipe exists and user owns it
      const existingRecipe = await this.repository.findById(id);
      if (!existingRecipe) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'Recipe not found'
          }
        };
      }

      if (existingRecipe.userId !== userId) {
        return {
          success: false,
          error: {
            type: 'unauthorized',
            message: 'You do not have permission to update this recipe'
          }
        };
      }

      // Sanitize input data
      const sanitizedData = RecipeValidator.sanitizeRecipeData(request);
      
      // Validate the update data
      const validation = RecipeValidator.validateForUpdate(sanitizedData as Partial<NewRecipe>);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Recipe validation failed',
            details: validation.errors
          }
        };
      }

      // Update the recipe
      const updatedRecipe = await this.repository.update(id, sanitizedData as Partial<NewRecipe>);
      
      if (!updatedRecipe) {
        return {
          success: false,
          error: {
            type: 'database',
            message: 'Failed to update recipe'
          }
        };
      }

      // Update cache with new recipe data
      await this.cacheService.setRecipe(updatedRecipe);
      
      // Invalidate user's recipe cache since recipe was updated
      await this.cacheService.invalidateUserRecipes(userId);

      return {
        success: true,
        recipe: updatedRecipe
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to update recipe',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async deleteRecipe(id: string, userId: string): Promise<{ success: true } | { success: false; error: RecipeServiceError }> {
    try {
      // First check if recipe exists and user owns it
      const existingRecipe = await this.repository.findById(id);
      if (!existingRecipe) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'Recipe not found'
          }
        };
      }

      if (existingRecipe.userId !== userId) {
        return {
          success: false,
          error: {
            type: 'unauthorized',
            message: 'You do not have permission to delete this recipe'
          }
        };
      }

      // Delete the recipe
      const deleted = await this.repository.delete(id);
      
      if (!deleted) {
        return {
          success: false,
          error: {
            type: 'database',
            message: 'Failed to delete recipe'
          }
        };
      }

      // Remove from cache
      await this.cacheService.deleteRecipe(id);
      
      // Invalidate user's recipe cache since recipe was deleted
      await this.cacheService.invalidateUserRecipes(userId);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to delete recipe',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async searchRecipes(userId: string, searchTerm: string, includeHighlights: boolean = false): Promise<{ success: true; results: SearchResult[] } | { success: false; error: RecipeServiceError }> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return {
          success: true,
          results: []
        };
      }

      const trimmedTerm = searchTerm.trim();
      
      // For simple searches without highlights, try cache first
      if (!includeHighlights) {
        const cachedResults = await this.cacheService.getSearchResults(userId, trimmedTerm);
        if (cachedResults) {
          return {
            success: true,
            results: cachedResults.map(recipe => ({ recipe, highlights: {}, rank: 0 }))
          };
        }
      }

      const results = await this.searchService.searchRecipes(userId, trimmedTerm, {
        includeHighlights,
        limit: 50
      });
      
      // Cache search results (only for simple searches without highlights)
      if (!includeHighlights && results.length > 0) {
        const recipes = results.map(result => result.recipe);
        await this.cacheService.setSearchResults(userId, trimmedTerm, recipes);
      }
      
      return {
        success: true,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to search recipes',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getSearchSuggestions(userId: string, partialTerm: string): Promise<{ success: true; suggestions: SearchSuggestion[] } | { success: false; error: RecipeServiceError }> {
    try {
      const suggestions = await this.searchService.getSearchSuggestions(userId, partialTerm);
      
      return {
        success: true,
        suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to get search suggestions',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async clearSearchHistory(userId: string): Promise<{ success: true } | { success: false; error: RecipeServiceError }> {
    try {
      await this.searchService.clearSearchHistory(userId);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to clear search history',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async scaleRecipe(request: ScaleRecipeRequest): Promise<{ success: true; recipe: Recipe } | { success: false; error: RecipeServiceError }> {
    try {
      // Get the original recipe
      const originalRecipe = await this.repository.findById(request.recipeId);
      if (!originalRecipe) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'Recipe not found'
          }
        };
      }

      if (originalRecipe.userId !== request.userId) {
        return {
          success: false,
          error: {
            type: 'unauthorized',
            message: 'You do not have permission to access this recipe'
          }
        };
      }

      if (request.newServings <= 0) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'New servings must be a positive number'
          }
        };
      }

      // Calculate scaling factor
      const originalServings = originalRecipe.servings || 1;
      const scalingFactor = request.newServings / originalServings;

      // Scale ingredients
      const scaledIngredients = originalRecipe.ingredients.map(ingredient => ({
        ...ingredient,
        quantity: ingredient.quantity ? ingredient.quantity * scalingFactor : ingredient.quantity
      }));

      // Create a scaled copy (not saving to database, just returning the scaled version)
      const scaledRecipe: Recipe = {
        ...originalRecipe,
        servings: request.newServings,
        ingredients: scaledIngredients,
        // Add a note that this is a scaled version
        personalNotes: originalRecipe.personalNotes 
          ? `${originalRecipe.personalNotes}\n\nScaled from ${originalServings} to ${request.newServings} servings.`
          : `Scaled from ${originalServings} to ${request.newServings} servings.`
      };

      return {
        success: true,
        recipe: scaledRecipe
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to scale recipe',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getRecipesByCategory(userId: string, category: string): Promise<{ success: true; recipes: Recipe[] } | { success: false; error: RecipeServiceError }> {
    try {
      const recipes = await this.repository.findByCategory(userId, category);
      
      return {
        success: true,
        recipes
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to retrieve recipes by category',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getRecipesByTag(userId: string, tag: string): Promise<{ success: true; recipes: Recipe[] } | { success: false; error: RecipeServiceError }> {
    try {
      const recipes = await this.repository.findByTag(userId, tag);
      
      return {
        success: true,
        recipes
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to retrieve recipes by tag',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getRecipeCount(userId: string): Promise<{ success: true; count: number } | { success: false; error: RecipeServiceError }> {
    try {
      const count = await this.repository.countByUserId(userId);
      
      return {
        success: true,
        count
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'database',
          message: 'Failed to get recipe count',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}