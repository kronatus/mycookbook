import type { ExtractedRecipe } from './types';

export interface IngestionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class RecipeIngestionValidator {
  /**
   * Validates an extracted recipe to ensure it meets minimum requirements
   */
  static validate(recipe: ExtractedRecipe): IngestionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!recipe.title || recipe.title.trim().length === 0) {
      errors.push('Recipe title is required');
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      errors.push('Recipe must have at least one ingredient');
    }

    if (!recipe.instructions || recipe.instructions.length === 0) {
      errors.push('Recipe must have at least one instruction');
    }

    if (!recipe.sourceUrl || !this.isValidUrl(recipe.sourceUrl)) {
      errors.push('Valid source URL is required');
    }

    // Validate ingredients structure
    if (recipe.ingredients) {
      recipe.ingredients.forEach((ingredient, index) => {
        if (!ingredient.name || ingredient.name.trim().length === 0) {
          errors.push(`Ingredient ${index + 1} must have a name`);
        }
        
        if (ingredient.quantity !== undefined && (ingredient.quantity < 0 || !isFinite(ingredient.quantity))) {
          errors.push(`Ingredient ${index + 1} has invalid quantity`);
        }
      });
    }

    // Validate instructions structure
    if (recipe.instructions) {
      recipe.instructions.forEach((instruction, index) => {
        if (!instruction.description || instruction.description.trim().length === 0) {
          errors.push(`Instruction ${index + 1} must have a description`);
        }
        
        if (instruction.stepNumber !== index + 1) {
          warnings.push(`Instruction ${index + 1} has incorrect step number`);
        }
        
        if (instruction.duration !== undefined && (instruction.duration < 0 || !isFinite(instruction.duration))) {
          warnings.push(`Instruction ${index + 1} has invalid duration`);
        }
      });
    }

    // Validate optional numeric fields
    if (recipe.cookingTime !== undefined && (recipe.cookingTime < 0 || !isFinite(recipe.cookingTime))) {
      warnings.push('Cooking time must be a positive number');
    }

    if (recipe.prepTime !== undefined && (recipe.prepTime < 0 || !isFinite(recipe.prepTime))) {
      warnings.push('Prep time must be a positive number');
    }

    if (recipe.servings !== undefined && (recipe.servings <= 0 || !isFinite(recipe.servings))) {
      warnings.push('Servings must be a positive number');
    }

    // Validate difficulty level
    if (recipe.difficulty && !['easy', 'medium', 'hard'].includes(recipe.difficulty)) {
      warnings.push('Difficulty must be easy, medium, or hard');
    }

    // Validate source type
    if (!['web', 'video', 'document', 'manual'].includes(recipe.sourceType)) {
      errors.push('Source type must be web, video, document, or manual');
    }

    // Content quality warnings
    if (recipe.title && recipe.title.length > 200) {
      warnings.push('Recipe title is very long (over 200 characters)');
    }

    if (recipe.description && recipe.description.length > 1000) {
      warnings.push('Recipe description is very long (over 1000 characters)');
    }

    if (recipe.ingredients && recipe.ingredients.length > 50) {
      warnings.push('Recipe has many ingredients (over 50)');
    }

    if (recipe.instructions && recipe.instructions.length > 30) {
      warnings.push('Recipe has many instructions (over 30 steps)');
    }

    // Check for suspicious content
    if (recipe.title && this.containsSuspiciousContent(recipe.title)) {
      warnings.push('Recipe title contains potentially suspicious content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitizes an extracted recipe by cleaning up common issues
   */
  static sanitize(recipe: ExtractedRecipe): ExtractedRecipe {
    return {
      ...recipe,
      title: this.sanitizeText(recipe.title),
      description: recipe.description ? this.sanitizeText(recipe.description) : undefined,
      ingredients: recipe.ingredients.map(ingredient => ({
        ...ingredient,
        name: this.sanitizeText(ingredient.name),
        unit: ingredient.unit ? this.sanitizeText(ingredient.unit) : undefined,
        notes: ingredient.notes ? this.sanitizeText(ingredient.notes) : undefined,
      })),
      instructions: recipe.instructions.map((instruction, index) => ({
        ...instruction,
        stepNumber: index + 1, // Ensure correct step numbering
        description: this.sanitizeText(instruction.description),
      })),
      categories: recipe.categories?.map(cat => this.sanitizeText(cat).toLowerCase()) || [],
      tags: recipe.tags?.map(tag => this.sanitizeText(tag).toLowerCase()) || [],
      author: recipe.author ? this.sanitizeText(recipe.author) : undefined,
    };
  }

  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private static sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-.,!?()[\]{}:;'"\/\\]/g, '') // Remove suspicious characters
      .substring(0, 1000); // Limit length
  }

  private static containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /<script/i,
      /onclick=/i,
      /onerror=/i,
      /onload=/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  }
}