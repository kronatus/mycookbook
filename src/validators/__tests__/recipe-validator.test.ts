import { describe, it, expect } from 'vitest';
import { RecipeValidator } from '../recipe-validator';
import type { NewRecipe } from '../../db/schema';

describe('RecipeValidator', () => {
  const validRecipeData: NewRecipe = {
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
    difficulty: 'easy',
    categories: ['dessert'],
    tags: ['sweet'],
    sourceType: 'manual',
    sourceUrl: 'https://example.com',
    personalNotes: 'My favorite recipe',
    userId: 'user-123'
  };

  describe('validate', () => {
    it('should validate a complete valid recipe', () => {
      const result = RecipeValidator.validate(validRecipeData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require title', () => {
      const invalidData = { ...validRecipeData, title: '' };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Recipe title is required and cannot be empty'
      });
    });

    it('should limit title length', () => {
      const longTitle = 'a'.repeat(201);
      const invalidData = { ...validRecipeData, title: longTitle };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Recipe title cannot exceed 200 characters'
      });
    });

    it('should require userId', () => {
      const invalidData = { ...validRecipeData, userId: undefined as any };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'userId',
        message: 'User ID is required'
      });
    });

    it('should require ingredients array', () => {
      const invalidData = { ...validRecipeData, ingredients: undefined as any };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'ingredients',
        message: 'Ingredients must be provided as an array'
      });
    });

    it('should require at least one ingredient', () => {
      const invalidData = { ...validRecipeData, ingredients: [] };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'ingredients',
        message: 'At least one ingredient is required'
      });
    });

    it('should validate ingredient names', () => {
      const invalidData = {
        ...validRecipeData,
        ingredients: [{ name: '', quantity: 1, unit: 'cup' }]
      };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'ingredients[0].name',
        message: 'Ingredient 1 name is required'
      });
    });

    it('should validate ingredient quantities are not negative', () => {
      const invalidData = {
        ...validRecipeData,
        ingredients: [{ name: 'Flour', quantity: -1, unit: 'cup' }]
      };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'ingredients[0].quantity',
        message: 'Ingredient 1 quantity cannot be negative'
      });
    });

    it('should require instructions array', () => {
      const invalidData = { ...validRecipeData, instructions: undefined as any };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'instructions',
        message: 'Instructions must be provided as an array'
      });
    });

    it('should require at least one instruction', () => {
      const invalidData = { ...validRecipeData, instructions: [] };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'instructions',
        message: 'At least one instruction is required'
      });
    });

    it('should validate instruction descriptions', () => {
      const invalidData = {
        ...validRecipeData,
        instructions: [{ stepNumber: 1, description: '' }]
      };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'instructions[0].description',
        message: 'Instruction 1 description is required'
      });
    });

    it('should validate instruction step numbers', () => {
      const invalidData = {
        ...validRecipeData,
        instructions: [
          { stepNumber: 1, description: 'First step' },
          { stepNumber: 3, description: 'Should be step 2' }
        ]
      };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'instructions[1].stepNumber',
        message: 'Instruction 2 step number should be 2'
      });
    });

    it('should validate cooking time is not negative', () => {
      const invalidData = { ...validRecipeData, cookingTime: -10 };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'cookingTime',
        message: 'Cooking time cannot be negative'
      });
    });

    it('should validate prep time is not negative', () => {
      const invalidData = { ...validRecipeData, prepTime: -5 };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'prepTime',
        message: 'Preparation time cannot be negative'
      });
    });

    it('should validate servings is positive', () => {
      const invalidData = { ...validRecipeData, servings: 0 };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'servings',
        message: 'Servings must be a positive number'
      });
    });

    it('should validate difficulty values', () => {
      const invalidData = { ...validRecipeData, difficulty: 'impossible' as any };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'difficulty',
        message: 'Difficulty must be one of: easy, medium, hard'
      });
    });

    it('should validate source type values', () => {
      const invalidData = { ...validRecipeData, sourceType: 'unknown' as any };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'sourceType',
        message: 'Source type must be one of: web, video, document, manual'
      });
    });

    it('should validate URL format', () => {
      const invalidData = { ...validRecipeData, sourceUrl: 'not-a-url' };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'sourceUrl',
        message: 'Source URL must be a valid URL'
      });
    });

    it('should validate categories is array', () => {
      const invalidData = { ...validRecipeData, categories: 'not-array' as any };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'categories',
        message: 'Categories must be an array'
      });
    });

    it('should validate tags is array', () => {
      const invalidData = { ...validRecipeData, tags: 'not-array' as any };
      const result = RecipeValidator.validate(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'tags',
        message: 'Tags must be an array'
      });
    });
  });

  describe('validateForUpdate', () => {
    it('should validate partial update data', () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };
      const result = RecipeValidator.validateForUpdate(updateData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty title in update', () => {
      const updateData = { title: '' };
      const result = RecipeValidator.validateForUpdate(updateData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Recipe title cannot be empty'
      });
    });

    it('should validate ingredients if provided in update', () => {
      const updateData = {
        ingredients: [{ name: '', quantity: 1, unit: 'cup' }]
      };
      const result = RecipeValidator.validateForUpdate(updateData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'ingredients[0].name',
        message: 'Ingredient 1 name is required'
      });
    });
  });

  describe('sanitizeRecipeData', () => {
    it('should trim string fields', () => {
      const dirtyData = {
        title: '  Test Recipe  ',
        description: '  A test recipe  ',
        personalNotes: '  My notes  ',
        sourceUrl: '  https://example.com  '
      };
      
      const sanitized = RecipeValidator.sanitizeRecipeData(dirtyData);
      
      expect(sanitized.title).toBe('Test Recipe');
      expect(sanitized.description).toBe('A test recipe');
      expect(sanitized.personalNotes).toBe('My notes');
      expect(sanitized.sourceUrl).toBe('https://example.com');
    });

    it('should sanitize ingredient names', () => {
      const dirtyData = {
        ingredients: [
          { name: '  Flour  ', quantity: 2, unit: 'cups', notes: '  sifted  ' }
        ]
      };
      
      const sanitized = RecipeValidator.sanitizeRecipeData(dirtyData);
      
      expect(sanitized.ingredients![0].name).toBe('Flour');
      expect(sanitized.ingredients![0].notes).toBe('sifted');
    });

    it('should sanitize instruction descriptions', () => {
      const dirtyData = {
        instructions: [
          { stepNumber: 1, description: '  Mix ingredients  ' }
        ]
      };
      
      const sanitized = RecipeValidator.sanitizeRecipeData(dirtyData);
      
      expect(sanitized.instructions![0].description).toBe('Mix ingredients');
    });

    it('should initialize empty arrays for categories and tags', () => {
      const data = { title: 'Test' };
      
      const sanitized = RecipeValidator.sanitizeRecipeData(data);
      
      expect(sanitized.categories).toEqual([]);
      expect(sanitized.tags).toEqual([]);
    });
  });
});