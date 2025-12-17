import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportService } from '../import-service';
import { RecipeRepository } from '../../repositories/recipe-repository';
import type { Recipe } from '../../db/schema';

// Mock the repository
vi.mock('../../repositories/recipe-repository');

describe('ImportService', () => {
  let importService: ImportService;
  let mockRepository: any;

  beforeEach(() => {
    importService = new ImportService();
    mockRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    };
    (importService as any).repository = mockRepository;
  });

  describe('importFromJSON', () => {
    it('should import a single recipe from JSON', async () => {
      const userId = 'user-123';
      const recipeData = {
        title: 'Test Recipe',
        ingredients: [
          { name: 'Flour', quantity: 2, unit: 'cups' }
        ],
        instructions: [
          { stepNumber: 1, description: 'Mix ingredients' }
        ]
      };

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', ...recipeData, userId });

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(recipeData),
        { skipDuplicates: false }
      );

      expect(result.success).toBe(true);
      expect(result.progress.importedCount).toBe(1);
      expect(result.progress.errorCount).toBe(0);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should import multiple recipes from JSON array', async () => {
      const userId = 'user-123';
      const recipes = [
        {
          title: 'Recipe 1',
          ingredients: [{ name: 'Ingredient 1' }],
          instructions: [{ stepNumber: 1, description: 'Step 1' }]
        },
        {
          title: 'Recipe 2',
          ingredients: [{ name: 'Ingredient 2' }],
          instructions: [{ stepNumber: 1, description: 'Step 1' }]
        }
      ];

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(recipes),
        {}
      );

      expect(result.success).toBe(true);
      expect(result.progress.importedCount).toBe(2);
      expect(mockRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should skip duplicate recipes when skipDuplicates is true', async () => {
      const userId = 'user-123';
      const existingRecipe: Partial<Recipe> = {
        id: 'existing-1',
        title: 'Existing Recipe',
        userId,
        ingredients: [],
        instructions: [],
        categories: [],
        tags: []
      };

      const newRecipe = {
        title: 'Existing Recipe', // Same title
        ingredients: [{ name: 'Flour' }],
        instructions: [{ stepNumber: 1, description: 'Mix' }]
      };

      mockRepository.findByUserId.mockResolvedValue([existingRecipe]);

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(newRecipe),
        { skipDuplicates: true }
      );

      expect(result.success).toBe(true);
      expect(result.progress.skippedCount).toBe(1);
      expect(result.progress.importedCount).toBe(0);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON gracefully', async () => {
      const userId = 'user-123';
      const invalidJSON = '{ invalid json }';

      const result = await importService.importFromJSON(userId, invalidJSON, {});

      expect(result.success).toBe(false);
      expect(result.progress.errors.length).toBeGreaterThan(0);
    });

    it('should normalize various recipe formats', async () => {
      const userId = 'user-123';
      const externalRecipe = {
        name: 'Recipe Name', // Using 'name' instead of 'title'
        recipeIngredient: ['2 cups flour', '1 tsp salt'], // String array format
        recipeInstructions: ['Mix ingredients', 'Bake'], // String array format
        cookTime: 'PT30M', // ISO 8601 duration
        prepTime: '15 minutes', // Text format
        recipeYield: '4 servings' // Text format
      };

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(externalRecipe),
        {}
      );

      expect(result.success).toBe(true);
      expect(result.progress.importedCount).toBe(1);
      
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.title).toBe('Recipe Name');
      expect(createCall.cookingTime).toBe(30); // Converted from PT30M
      expect(createCall.prepTime).toBe(15); // Converted from "15 minutes"
      expect(createCall.servings).toBe(4); // Converted from "4 servings"
    });

    it('should track progress with callback', async () => {
      const userId = 'user-123';
      const recipes = [
        { title: 'Recipe 1', ingredients: [], instructions: [] },
        { title: 'Recipe 2', ingredients: [], instructions: [] },
        { title: 'Recipe 3', ingredients: [], instructions: [] }
      ];

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const progressUpdates: any[] = [];
      const progressCallback = (progress: any) => {
        progressUpdates.push({ ...progress });
      };

      await importService.importFromJSON(
        userId,
        JSON.stringify(recipes),
        { progressCallback }
      );

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].processedItems).toBe(3);
    });
  });

  describe('importFromCSV', () => {
    it('should import recipes from CSV format', async () => {
      const userId = 'user-123';
      const csvData = `title,ingredients,instructions,servings
"Pasta Recipe","Pasta, Tomato Sauce","Boil pasta, Add sauce",4
"Salad Recipe","Lettuce, Tomato","Chop vegetables, Mix",2`;

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromCSV(userId, csvData, {});

      expect(result.success).toBe(true);
      expect(result.progress.importedCount).toBe(2);
    });

    it('should handle CSV with missing required fields', async () => {
      const userId = 'user-123';
      const csvData = `title,ingredients,instructions
"Recipe 1","Ingredient 1","Step 1"
,"Ingredient 2","Step 2"`;

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromCSV(userId, csvData, {});

      expect(result.progress.importedCount).toBe(1);
      expect(result.progress.errorCount).toBe(1);
    });
  });

  describe('importFromExternalFormat', () => {
    it('should import from Recipe Keeper format', async () => {
      const userId = 'user-123';
      const recipeKeeperData = {
        recipes: [
          {
            title: 'Test Recipe',
            ingredients: [
              { ingredient: 'Flour', quantity: 2, unit: 'cups' }
            ],
            directions: ['Mix ingredients', 'Bake'],
            cookTime: 30,
            prepTime: 15,
            yield: 4
          }
        ]
      };

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromExternalFormat(
        userId,
        JSON.stringify(recipeKeeperData),
        'recipe-keeper',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.progress.importedCount).toBe(1);
    });

    it('should import from Paprika format', async () => {
      const userId = 'user-123';
      const paprikaData = [
        {
          name: 'Test Recipe',
          ingredients: 'Flour\nSugar\nEggs',
          directions: 'Mix\nBake',
          cook_time: '30 minutes',
          prep_time: '15 minutes',
          servings: '4'
        }
      ];

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromExternalFormat(
        userId,
        JSON.stringify(paprikaData),
        'paprika',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.progress.importedCount).toBe(1);
    });
  });

  describe('conflict detection', () => {
    it('should detect title conflicts', async () => {
      const userId = 'user-123';
      const existingRecipe: Partial<Recipe> = {
        id: 'existing-1',
        title: 'Chocolate Cake',
        userId,
        ingredients: [],
        instructions: [],
        categories: [],
        tags: []
      };

      const newRecipe = {
        title: 'Chocolate Cake',
        ingredients: [{ name: 'Chocolate' }],
        instructions: [{ stepNumber: 1, description: 'Melt chocolate' }]
      };

      mockRepository.findByUserId.mockResolvedValue([existingRecipe]);

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(newRecipe),
        { skipDuplicates: true }
      );

      expect(result.duplicateConflicts).toBeDefined();
      expect(result.duplicateConflicts?.length).toBeGreaterThan(0);
      expect(result.duplicateConflicts?.[0].conflictType).toBe('title_match');
    });

    it('should detect URL conflicts', async () => {
      const userId = 'user-123';
      const existingRecipe: Partial<Recipe> = {
        id: 'existing-1',
        title: 'Recipe 1',
        sourceUrl: 'https://example.com/recipe',
        userId,
        ingredients: [],
        instructions: [],
        categories: [],
        tags: []
      };

      const newRecipe = {
        title: 'Different Title',
        url: 'https://example.com/recipe', // Same URL
        ingredients: [{ name: 'Ingredient' }],
        instructions: [{ stepNumber: 1, description: 'Step' }]
      };

      mockRepository.findByUserId.mockResolvedValue([existingRecipe]);

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(newRecipe),
        { skipDuplicates: true }
      );

      expect(result.duplicateConflicts).toBeDefined();
      expect(result.duplicateConflicts?.[0].conflictType).toBe('url_match');
    });
  });

  describe('batch processing', () => {
    it('should process recipes in batches', async () => {
      const userId = 'user-123';
      const recipes = Array.from({ length: 25 }, (_, i) => ({
        title: `Recipe ${i + 1}`,
        ingredients: [{ name: 'Ingredient' }],
        instructions: [{ stepNumber: 1, description: 'Step' }]
      }));

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(recipes),
        { batchSize: 5 }
      );

      expect(result.success).toBe(true);
      expect(result.progress.importedCount).toBe(25);
      expect(mockRepository.create).toHaveBeenCalledTimes(25);
    });
  });

  describe('validation', () => {
    it('should validate recipes when validateStrict is true', async () => {
      const userId = 'user-123';
      const invalidRecipe = {
        title: 'Valid Title',
        ingredients: [], // Empty ingredients should fail validation
        instructions: [] // Empty instructions should fail validation
      };

      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(invalidRecipe),
        { validateStrict: true }
      );

      expect(result.progress.errorCount).toBeGreaterThan(0);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('ingredient parsing', () => {
    it('should parse ingredient strings with quantities', async () => {
      const userId = 'user-123';
      const recipe = {
        title: 'Test Recipe',
        ingredients: [
          '2 cups flour',
          '1/2 tsp salt',
          '1 1/2 cups sugar'
        ],
        instructions: [{ stepNumber: 1, description: 'Mix' }]
      };

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(recipe),
        {}
      );

      expect(result.success).toBe(true);
      
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.ingredients[0].quantity).toBe(2);
      expect(createCall.ingredients[0].unit).toBe('cups');
      expect(createCall.ingredients[0].name).toBe('flour');
      
      expect(createCall.ingredients[1].quantity).toBe(0.5);
      expect(createCall.ingredients[2].quantity).toBe(1.5);
    });
  });

  describe('time parsing', () => {
    it('should parse ISO 8601 duration format', async () => {
      const userId = 'user-123';
      const recipe = {
        title: 'Test Recipe',
        cookTime: 'PT1H30M', // 1 hour 30 minutes
        prepTime: 'PT15M', // 15 minutes
        ingredients: [],
        instructions: []
      };

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(recipe),
        {}
      );

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.cookingTime).toBe(90); // 1.5 hours = 90 minutes
      expect(createCall.prepTime).toBe(15);
    });

    it('should parse text time formats', async () => {
      const userId = 'user-123';
      const recipe = {
        title: 'Test Recipe',
        cookingTime: '45 minutes',
        prep_time: '2 hours',
        ingredients: [],
        instructions: []
      };

      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue({ id: 'recipe-1', userId });

      const result = await importService.importFromJSON(
        userId,
        JSON.stringify(recipe),
        {}
      );

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.cookingTime).toBe(45);
      expect(createCall.prepTime).toBe(120); // 2 hours = 120 minutes
    });
  });
});
