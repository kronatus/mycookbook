import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportService } from '../export-service';
import { RecipeRepository } from '../../repositories/recipe-repository';
import type { Recipe } from '../../db/schema';

// Mock the RecipeRepository
vi.mock('../../repositories/recipe-repository');

describe('ExportService', () => {
  let exportService: ExportService;
  let mockRepository: vi.Mocked<RecipeRepository>;

  const mockRecipe: Recipe = {
    id: 'test-id',
    title: 'Test Recipe',
    description: 'A test recipe',
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
    sourceUrl: 'https://example.com/recipe',
    sourceType: 'web',
    personalNotes: 'My favorite recipe',
    searchVector: null,
    userId: 'user-123',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  };

  beforeEach(() => {
    exportService = new ExportService();
    mockRepository = vi.mocked(new RecipeRepository());
    (exportService as any).repository = mockRepository;
  });

  describe('exportRecipes', () => {
    it('should export recipes in JSON format', async () => {
      mockRepository.findByUserId.mockResolvedValue([mockRecipe]);

      const result = await exportService.exportRecipes('user-123', {
        format: 'json',
        includePersonalNotes: true,
        includeMetadata: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filename).toMatch(/recipes-export-\d{4}-\d{2}-\d{2}\.json/);
      expect(result.mimeType).toBe('application/json');

      // Parse the JSON to verify structure
      const parsedData = JSON.parse(result.data as string);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].title).toBe('Test Recipe');
    });

    it('should exclude personal notes when option is false', async () => {
      mockRepository.findByUserId.mockResolvedValue([mockRecipe]);

      const result = await exportService.exportRecipes('user-123', {
        format: 'json',
        includePersonalNotes: false,
        includeMetadata: true
      });

      expect(result.success).toBe(true);
      const parsedData = JSON.parse(result.data as string);
      expect(parsedData[0].personalNotes).toBeNull();
    });

    it('should exclude metadata when option is false', async () => {
      mockRepository.findByUserId.mockResolvedValue([mockRecipe]);

      const result = await exportService.exportRecipes('user-123', {
        format: 'json',
        includePersonalNotes: true,
        includeMetadata: false
      });

      expect(result.success).toBe(true);
      const parsedData = JSON.parse(result.data as string);
      expect(parsedData[0].createdAt).toBeUndefined();
      expect(parsedData[0].updatedAt).toBeUndefined();
    });

    it('should return error when no recipes found', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await exportService.exportRecipes('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No recipes found to export');
    });
  });

  describe('exportSingleRecipe', () => {
    it('should export a single recipe', async () => {
      mockRepository.findById.mockResolvedValue(mockRecipe);

      const result = await exportService.exportSingleRecipe('test-id', 'user-123', {
        format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filename).toMatch(/recipe-test-recipe-\d{4}-\d{2}-\d{2}\.json/);

      // Parse the JSON to verify it's a single recipe object
      const parsedData = JSON.parse(result.data as string);
      expect(parsedData.title).toBe('Test Recipe');
      expect(Array.isArray(parsedData)).toBe(false);
    });

    it('should return error for non-existent recipe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await exportService.exportSingleRecipe('non-existent', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recipe not found');
    });

    it('should return error for unauthorized access', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockRecipe, userId: 'other-user' });

      const result = await exportService.exportSingleRecipe('test-id', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized access to recipe');
    });
  });

  describe('createBackup', () => {
    it('should create a complete backup', async () => {
      mockRepository.findByUserId.mockResolvedValue([mockRecipe]);

      const result = await exportService.createBackup('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filename).toMatch(/cookbook-backup-\d{4}-\d{2}-\d{2}\.json/);
      expect(result.mimeType).toBe('application/json');

      // Parse the backup to verify structure
      const backupData = JSON.parse(result.data as string);
      expect(backupData.version).toBe('1.0.0');
      expect(backupData.recipeCount).toBe(1);
      expect(backupData.recipes).toHaveLength(1);
      expect(backupData.exportDate).toBeDefined();
    });
  });

  describe('importFromJSON', () => {
    it('should import recipes from JSON', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(mockRecipe);

      const jsonData = JSON.stringify([{
        title: 'Imported Recipe',
        ingredients: [{ name: 'test ingredient' }],
        instructions: [{ stepNumber: 1, description: 'test instruction' }]
      }]);

      const result = await exportService.importFromJSON('user-123', jsonData);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should skip duplicates when option is enabled', async () => {
      mockRepository.findByUserId.mockResolvedValue([mockRecipe]);

      const jsonData = JSON.stringify([{
        title: 'Test Recipe', // Same title as existing recipe
        ingredients: [{ name: 'test ingredient' }],
        instructions: [{ stepNumber: 1, description: 'test instruction' }]
      }]);

      const result = await exportService.importFromJSON('user-123', jsonData, {
        skipDuplicates: true
      });

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(0);
      expect(result.skippedCount).toBe(1);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const result = await exportService.importFromJSON('user-123', 'invalid json');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Unexpected token');
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore recipes from backup', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.create.mockResolvedValue(mockRecipe);

      const backupData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        recipeCount: 1,
        recipes: [mockRecipe]
      };

      const result = await exportService.restoreFromBackup('user-123', JSON.stringify(backupData));

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.skippedCount).toBe(0);
    });

    it('should reject incompatible backup versions', async () => {
      const backupData = {
        version: '2.0.0', // Incompatible version
        exportDate: new Date().toISOString(),
        recipeCount: 1,
        recipes: [mockRecipe]
      };

      const result = await exportService.restoreFromBackup('user-123', JSON.stringify(backupData));

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Incompatible backup version');
    });

    it('should reject invalid backup format', async () => {
      const result = await exportService.restoreFromBackup('user-123', '{"invalid": "format"}');

      expect(result.success).toBe(false);
      expect(result.errors![0]).toBe('Invalid backup format');
    });
  });
});