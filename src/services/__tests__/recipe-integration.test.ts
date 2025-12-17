import { describe, it, expect } from 'vitest';
import { RecipeService } from '../recipe-service';
import { RecipeValidator } from '../../validators/recipe-validator';

describe('Recipe CRUD Integration', () => {
  const recipeService = new RecipeService();
  const mockUserId = 'test-user-123';

  const sampleRecipe = {
    title: 'Chocolate Chip Cookies',
    description: 'Classic homemade chocolate chip cookies',
    ingredients: [
      { name: 'All-purpose flour', quantity: 2.25, unit: 'cups' },
      { name: 'Baking soda', quantity: 1, unit: 'teaspoon' },
      { name: 'Salt', quantity: 1, unit: 'teaspoon' },
      { name: 'Butter', quantity: 1, unit: 'cup', notes: 'softened' },
      { name: 'Granulated sugar', quantity: 0.75, unit: 'cup' },
      { name: 'Brown sugar', quantity: 0.75, unit: 'cup', notes: 'packed' },
      { name: 'Vanilla extract', quantity: 2, unit: 'teaspoons' },
      { name: 'Large eggs', quantity: 2, unit: 'pieces' },
      { name: 'Chocolate chips', quantity: 2, unit: 'cups' }
    ],
    instructions: [
      { stepNumber: 1, description: 'Preheat oven to 375°F (190°C)' },
      { stepNumber: 2, description: 'In a medium bowl, whisk together flour, baking soda, and salt' },
      { stepNumber: 3, description: 'In a large bowl, cream together butter and both sugars until light and fluffy', duration: 3 },
      { stepNumber: 4, description: 'Beat in eggs one at a time, then vanilla extract' },
      { stepNumber: 5, description: 'Gradually mix in the flour mixture until just combined' },
      { stepNumber: 6, description: 'Stir in chocolate chips' },
      { stepNumber: 7, description: 'Drop rounded tablespoons of dough onto ungreased baking sheets' },
      { stepNumber: 8, description: 'Bake for 9-11 minutes or until golden brown', duration: 10 },
      { stepNumber: 9, description: 'Cool on baking sheet for 2 minutes, then transfer to wire rack', duration: 2 }
    ],
    cookingTime: 10,
    prepTime: 15,
    servings: 48,
    difficulty: 'easy' as const,
    categories: ['dessert', 'cookies'],
    tags: ['chocolate', 'sweet', 'baking'],
    sourceType: 'manual' as const,
    personalNotes: 'Family favorite recipe - always a hit!',
    userId: mockUserId
  };

  it('should demonstrate complete recipe lifecycle', async () => {
    // Test data validation
    const validation = RecipeValidator.validate(sampleRecipe);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Test data sanitization
    const dirtyData = {
      ...sampleRecipe,
      title: '  Chocolate Chip Cookies  ',
      description: '  Classic homemade chocolate chip cookies  '
    };
    const sanitized = RecipeValidator.sanitizeRecipeData(dirtyData);
    expect(sanitized.title).toBe('Chocolate Chip Cookies');
    expect(sanitized.description).toBe('Classic homemade chocolate chip cookies');

    // Test recipe scaling
    const mockRecipe = {
      id: 'recipe-123',
      ...sampleRecipe,
      description: sampleRecipe.description || null,
      sourceUrl: null,
      personalNotes: sampleRecipe.personalNotes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock the repository for scaling test
    const originalFindById = recipeService['repository'].findById;
    recipeService['repository'].findById = async () => mockRecipe;

    const scaleResult = await recipeService.scaleRecipe({
      recipeId: 'recipe-123',
      newServings: 24, // Half the original
      userId: mockUserId
    });

    expect(scaleResult.success).toBe(true);
    if (scaleResult.success) {
      expect(scaleResult.recipe.servings).toBe(24);
      // Check that flour quantity was halved (2.25 -> 1.125)
      expect(scaleResult.recipe.ingredients[0].quantity).toBe(1.125);
      // Check that chocolate chips quantity was halved (2 -> 1)
      expect(scaleResult.recipe.ingredients[8].quantity).toBe(1);
    }

    // Restore original method
    recipeService['repository'].findById = originalFindById;
  });

  it('should validate complex recipe requirements', () => {
    // Test validation of complex recipe with all fields
    const complexRecipe = {
      ...sampleRecipe,
      sourceUrl: 'https://example.com/recipe',
      sourceType: 'web' as const
    };

    const validation = RecipeValidator.validate(complexRecipe);
    expect(validation.isValid).toBe(true);

    // Test validation failure scenarios
    const invalidRecipe = {
      ...sampleRecipe,
      title: '', // Invalid: empty title
      ingredients: [], // Invalid: no ingredients
      instructions: [], // Invalid: no instructions
      servings: -1, // Invalid: negative servings
      difficulty: 'impossible' as any, // Invalid: wrong difficulty
      sourceUrl: 'not-a-url' // Invalid: malformed URL
    };

    const invalidValidation = RecipeValidator.validate(invalidRecipe);
    expect(invalidValidation.isValid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);

    // Check specific error types
    const errorFields = invalidValidation.errors.map(e => e.field);
    expect(errorFields).toContain('title');
    expect(errorFields).toContain('ingredients');
    expect(errorFields).toContain('instructions');
    expect(errorFields).toContain('servings');
    expect(errorFields).toContain('difficulty');
    expect(errorFields).toContain('sourceUrl');
  });

  it('should handle ingredient and instruction validation edge cases', () => {
    // Test ingredient validation
    const recipeWithBadIngredients = {
      ...sampleRecipe,
      ingredients: [
        { name: '', quantity: 1, unit: 'cup' }, // Invalid: empty name
        { name: 'Sugar', quantity: -1, unit: 'cup' }, // Invalid: negative quantity
        { name: 'Flour', quantity: 2, unit: 'cups' } // Valid
      ]
    };

    const validation1 = RecipeValidator.validate(recipeWithBadIngredients);
    expect(validation1.isValid).toBe(false);
    expect(validation1.errors).toContainEqual({
      field: 'ingredients[0].name',
      message: 'Ingredient 1 name is required'
    });
    expect(validation1.errors).toContainEqual({
      field: 'ingredients[1].quantity',
      message: 'Ingredient 2 quantity cannot be negative'
    });

    // Test instruction validation
    const recipeWithBadInstructions = {
      ...sampleRecipe,
      instructions: [
        { stepNumber: 1, description: '' }, // Invalid: empty description
        { stepNumber: 3, description: 'Should be step 2' }, // Invalid: wrong step number
        { stepNumber: 3, description: 'Valid step', duration: -5 } // Invalid: negative duration
      ]
    };

    const validation2 = RecipeValidator.validate(recipeWithBadInstructions);
    expect(validation2.isValid).toBe(false);
    expect(validation2.errors).toContainEqual({
      field: 'instructions[0].description',
      message: 'Instruction 1 description is required'
    });
    expect(validation2.errors).toContainEqual({
      field: 'instructions[1].stepNumber',
      message: 'Instruction 2 step number should be 2'
    });
    expect(validation2.errors).toContainEqual({
      field: 'instructions[2].duration',
      message: 'Instruction 3 duration cannot be negative'
    });
  });
});