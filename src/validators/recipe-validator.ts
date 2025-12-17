import type { NewRecipe } from '../db/schema';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface Ingredient {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
}

export interface Instruction {
  stepNumber: number;
  description: string;
  duration?: number;
}

export class RecipeValidator {
  static validate(recipeData: Partial<NewRecipe>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!recipeData.title || recipeData.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Recipe title is required and cannot be empty'
      });
    }

    if (recipeData.title && recipeData.title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Recipe title cannot exceed 200 characters'
      });
    }

    if (!recipeData.userId) {
      errors.push({
        field: 'userId',
        message: 'User ID is required'
      });
    }

    // Validate ingredients
    if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients)) {
      errors.push({
        field: 'ingredients',
        message: 'Ingredients must be provided as an array'
      });
    } else if (recipeData.ingredients.length === 0) {
      errors.push({
        field: 'ingredients',
        message: 'At least one ingredient is required'
      });
    } else {
      // Validate each ingredient
      recipeData.ingredients.forEach((ingredient, index) => {
        if (!ingredient.name || ingredient.name.trim().length === 0) {
          errors.push({
            field: `ingredients[${index}].name`,
            message: `Ingredient ${index + 1} name is required`
          });
        }

        if (ingredient.quantity !== undefined && ingredient.quantity < 0) {
          errors.push({
            field: `ingredients[${index}].quantity`,
            message: `Ingredient ${index + 1} quantity cannot be negative`
          });
        }
      });
    }

    // Validate instructions
    if (!recipeData.instructions || !Array.isArray(recipeData.instructions)) {
      errors.push({
        field: 'instructions',
        message: 'Instructions must be provided as an array'
      });
    } else if (recipeData.instructions.length === 0) {
      errors.push({
        field: 'instructions',
        message: 'At least one instruction is required'
      });
    } else {
      // Validate each instruction
      recipeData.instructions.forEach((instruction, index) => {
        if (!instruction.description || instruction.description.trim().length === 0) {
          errors.push({
            field: `instructions[${index}].description`,
            message: `Instruction ${index + 1} description is required`
          });
        }

        if (instruction.stepNumber !== index + 1) {
          errors.push({
            field: `instructions[${index}].stepNumber`,
            message: `Instruction ${index + 1} step number should be ${index + 1}`
          });
        }

        if (instruction.duration !== undefined && instruction.duration < 0) {
          errors.push({
            field: `instructions[${index}].duration`,
            message: `Instruction ${index + 1} duration cannot be negative`
          });
        }
      });
    }

    // Validate optional numeric fields
    if (recipeData.cookingTime !== undefined && recipeData.cookingTime !== null && recipeData.cookingTime < 0) {
      errors.push({
        field: 'cookingTime',
        message: 'Cooking time cannot be negative'
      });
    }

    if (recipeData.prepTime !== undefined && recipeData.prepTime !== null && recipeData.prepTime < 0) {
      errors.push({
        field: 'prepTime',
        message: 'Preparation time cannot be negative'
      });
    }

    if (recipeData.servings !== undefined && recipeData.servings !== null && recipeData.servings <= 0) {
      errors.push({
        field: 'servings',
        message: 'Servings must be a positive number'
      });
    }

    // Validate difficulty
    if (recipeData.difficulty && !['easy', 'medium', 'hard'].includes(recipeData.difficulty)) {
      errors.push({
        field: 'difficulty',
        message: 'Difficulty must be one of: easy, medium, hard'
      });
    }

    // Validate source type
    if (recipeData.sourceType && !['web', 'video', 'document', 'manual'].includes(recipeData.sourceType)) {
      errors.push({
        field: 'sourceType',
        message: 'Source type must be one of: web, video, document, manual'
      });
    }

    // Validate arrays
    if (recipeData.categories && !Array.isArray(recipeData.categories)) {
      errors.push({
        field: 'categories',
        message: 'Categories must be an array'
      });
    }

    if (recipeData.tags && !Array.isArray(recipeData.tags)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be an array'
      });
    }

    // Validate URL format if provided
    if (recipeData.sourceUrl && recipeData.sourceUrl.trim().length > 0) {
      try {
        new URL(recipeData.sourceUrl);
      } catch {
        errors.push({
          field: 'sourceUrl',
          message: 'Source URL must be a valid URL'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateForUpdate(recipeData: Partial<NewRecipe>): ValidationResult {
    const errors: ValidationError[] = [];

    // For updates, we don't require all fields, but validate what's provided
    if (recipeData.title !== undefined) {
      if (recipeData.title.trim().length === 0) {
        errors.push({
          field: 'title',
          message: 'Recipe title cannot be empty'
        });
      }
      if (recipeData.title.length > 200) {
        errors.push({
          field: 'title',
          message: 'Recipe title cannot exceed 200 characters'
        });
      }
    }

    // Validate ingredients if provided
    if (recipeData.ingredients !== undefined) {
      if (!Array.isArray(recipeData.ingredients)) {
        errors.push({
          field: 'ingredients',
          message: 'Ingredients must be an array'
        });
      } else if (recipeData.ingredients.length === 0) {
        errors.push({
          field: 'ingredients',
          message: 'At least one ingredient is required'
        });
      } else {
        recipeData.ingredients.forEach((ingredient, index) => {
          if (!ingredient.name || ingredient.name.trim().length === 0) {
            errors.push({
              field: `ingredients[${index}].name`,
              message: `Ingredient ${index + 1} name is required`
            });
          }
          if (ingredient.quantity !== undefined && ingredient.quantity < 0) {
            errors.push({
              field: `ingredients[${index}].quantity`,
              message: `Ingredient ${index + 1} quantity cannot be negative`
            });
          }
        });
      }
    }

    // Validate instructions if provided
    if (recipeData.instructions !== undefined) {
      if (!Array.isArray(recipeData.instructions)) {
        errors.push({
          field: 'instructions',
          message: 'Instructions must be an array'
        });
      } else if (recipeData.instructions.length === 0) {
        errors.push({
          field: 'instructions',
          message: 'At least one instruction is required'
        });
      } else {
        recipeData.instructions.forEach((instruction, index) => {
          if (!instruction.description || instruction.description.trim().length === 0) {
            errors.push({
              field: `instructions[${index}].description`,
              message: `Instruction ${index + 1} description is required`
            });
          }
          if (instruction.stepNumber !== index + 1) {
            errors.push({
              field: `instructions[${index}].stepNumber`,
              message: `Instruction ${index + 1} step number should be ${index + 1}`
            });
          }
          if (instruction.duration !== undefined && instruction.duration < 0) {
            errors.push({
              field: `instructions[${index}].duration`,
              message: `Instruction ${index + 1} duration cannot be negative`
            });
          }
        });
      }
    }

    // Validate optional fields if provided
    if (recipeData.cookingTime !== undefined && recipeData.cookingTime !== null && recipeData.cookingTime < 0) {
      errors.push({
        field: 'cookingTime',
        message: 'Cooking time cannot be negative'
      });
    }

    if (recipeData.prepTime !== undefined && recipeData.prepTime !== null && recipeData.prepTime < 0) {
      errors.push({
        field: 'prepTime',
        message: 'Preparation time cannot be negative'
      });
    }

    if (recipeData.servings !== undefined && recipeData.servings !== null && recipeData.servings <= 0) {
      errors.push({
        field: 'servings',
        message: 'Servings must be a positive number'
      });
    }

    if (recipeData.difficulty !== undefined && recipeData.difficulty !== null && !['easy', 'medium', 'hard'].includes(recipeData.difficulty)) {
      errors.push({
        field: 'difficulty',
        message: 'Difficulty must be one of: easy, medium, hard'
      });
    }

    if (recipeData.sourceType !== undefined && !['web', 'video', 'document', 'manual'].includes(recipeData.sourceType)) {
      errors.push({
        field: 'sourceType',
        message: 'Source type must be one of: web, video, document, manual'
      });
    }

    if (recipeData.categories !== undefined && !Array.isArray(recipeData.categories)) {
      errors.push({
        field: 'categories',
        message: 'Categories must be an array'
      });
    }

    if (recipeData.tags !== undefined && !Array.isArray(recipeData.tags)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be an array'
      });
    }

    if (recipeData.sourceUrl !== undefined && recipeData.sourceUrl !== null && recipeData.sourceUrl.trim().length > 0) {
      try {
        new URL(recipeData.sourceUrl);
      } catch {
        errors.push({
          field: 'sourceUrl',
          message: 'Source URL must be a valid URL'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeRecipeData(recipeData: Partial<NewRecipe>): Partial<NewRecipe> {
    const sanitized: Partial<NewRecipe> = { ...recipeData };

    // Trim string fields
    if (sanitized.title) {
      sanitized.title = sanitized.title.trim();
    }
    if (sanitized.description) {
      sanitized.description = sanitized.description.trim();
    }
    if (sanitized.personalNotes) {
      sanitized.personalNotes = sanitized.personalNotes.trim();
    }
    if (sanitized.sourceUrl) {
      sanitized.sourceUrl = sanitized.sourceUrl.trim();
    }

    // Sanitize ingredients
    if (sanitized.ingredients) {
      sanitized.ingredients = sanitized.ingredients.map(ingredient => ({
        ...ingredient,
        name: ingredient.name.trim(),
        notes: ingredient.notes?.trim(),
      }));
    }

    // Sanitize instructions
    if (sanitized.instructions) {
      sanitized.instructions = sanitized.instructions.map(instruction => ({
        ...instruction,
        description: instruction.description.trim(),
      }));
    }

    // Ensure arrays are properly initialized
    if (!sanitized.categories) {
      sanitized.categories = [];
    }
    if (!sanitized.tags) {
      sanitized.tags = [];
    }

    return sanitized;
  }
}