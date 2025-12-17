import type { NormalizedContent, ExtractedRecipe } from './types';

export class ContentNormalizer {
  /**
   * Normalizes raw extracted content into a standardized recipe format
   */
  static normalize(content: NormalizedContent, sourceUrl: string): ExtractedRecipe {
    return {
      title: this.normalizeTitle(content.title),
      description: content.description?.trim() || undefined,
      ingredients: this.normalizeIngredients(content.ingredients),
      instructions: this.normalizeInstructions(content.instructions),
      cookingTime: this.normalizeTime(content.metadata.cookingTime),
      prepTime: this.normalizeTime(content.metadata.prepTime),
      servings: this.normalizeServings(content.metadata.servings),
      difficulty: this.normalizeDifficulty(content.metadata.difficulty),
      categories: this.normalizeCategories(content.metadata.categories),
      tags: this.normalizeTags(content.metadata.tags),
      sourceUrl,
      sourceType: 'web',
      author: content.metadata.author?.trim() || undefined,
      publishedDate: content.metadata.publishedDate || undefined,
    };
  }

  private static normalizeTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ');
  }

  private static normalizeIngredients(ingredients: string[]): Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }> {
    return ingredients
      .filter(ingredient => ingredient.trim().length > 0)
      .map((ingredient, index) => {
        const parsed = this.parseIngredient(ingredient.trim());
        return {
          name: parsed.name,
          quantity: parsed.quantity,
          unit: parsed.unit,
          notes: parsed.notes,
        };
      });
  }

  private static parseIngredient(ingredient: string): {
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  } {
    // Basic ingredient parsing - can be enhanced later
    const fractionRegex = /^(\d+(?:\/\d+)?|\d*\.\d+)\s*([a-zA-Z]+)?\s+(.+)$/;
    const numberRegex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/;
    
    let match = ingredient.match(fractionRegex) || ingredient.match(numberRegex);
    
    if (match) {
      const [, quantityStr, unit, name] = match;
      let quantity: number | undefined;
      
      // Handle fractions
      if (quantityStr.includes('/')) {
        const [numerator, denominator] = quantityStr.split('/').map(Number);
        quantity = numerator / denominator;
      } else {
        quantity = parseFloat(quantityStr);
      }
      
      return {
        name: name.trim(),
        quantity: isNaN(quantity) ? undefined : quantity,
        unit: unit?.toLowerCase() || undefined,
      };
    }
    
    // If no quantity/unit pattern found, treat entire string as ingredient name
    return {
      name: ingredient,
    };
  }

  private static normalizeInstructions(instructions: string[]): Array<{
    stepNumber: number;
    description: string;
    duration?: number;
  }> {
    return instructions
      .filter(instruction => instruction.trim().length > 0)
      .map((instruction, index) => ({
        stepNumber: index + 1,
        description: instruction.trim(),
        duration: this.extractDurationFromText(instruction),
      }));
  }

  private static extractDurationFromText(text: string): number | undefined {
    // Look for time patterns like "10 minutes", "1 hour", "30 mins", etc.
    const timeRegex = /(\d+)\s*(minutes?|mins?|hours?|hrs?)/i;
    const match = text.match(timeRegex);
    
    if (match) {
      const [, amount, unit] = match;
      const minutes = parseInt(amount);
      
      if (unit.toLowerCase().startsWith('hour') || unit.toLowerCase().startsWith('hr')) {
        return minutes * 60;
      }
      
      return minutes;
    }
    
    return undefined;
  }

  private static normalizeTime(time?: number): number | undefined {
    if (typeof time !== 'number' || time <= 0) {
      return undefined;
    }
    return Math.round(time);
  }

  private static normalizeServings(servings?: number): number | undefined {
    if (typeof servings !== 'number' || servings <= 0) {
      return undefined;
    }
    return Math.round(servings);
  }

  private static normalizeDifficulty(difficulty?: string): 'easy' | 'medium' | 'hard' | undefined {
    if (!difficulty) return undefined;
    
    const normalized = difficulty.toLowerCase().trim();
    
    if (normalized.includes('easy') || normalized.includes('simple') || normalized.includes('beginner')) {
      return 'easy';
    }
    
    if (normalized.includes('hard') || normalized.includes('difficult') || normalized.includes('advanced') || normalized.includes('expert')) {
      return 'hard';
    }
    
    if (normalized.includes('medium') || normalized.includes('intermediate') || normalized.includes('moderate')) {
      return 'medium';
    }
    
    return undefined;
  }

  private static normalizeCategories(categories?: string[]): string[] {
    if (!categories) return [];
    
    return categories
      .map(category => category.trim().toLowerCase())
      .filter(category => category.length > 0)
      .map(category => this.standardizeCategory(category));
  }

  private static standardizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'main dish': 'main-course',
      'main course': 'main-course',
      'entree': 'main-course',
      'appetizer': 'appetizers',
      'starter': 'appetizers',
      'dessert': 'desserts',
      'sweet': 'desserts',
      'side dish': 'sides',
      'side': 'sides',
      'soup': 'soups',
      'salad': 'salads',
      'breakfast': 'breakfast',
      'lunch': 'lunch',
      'dinner': 'dinner',
      'snack': 'snacks',
      'beverage': 'beverages',
      'drink': 'beverages',
    };
    
    return categoryMap[category] || category;
  }

  private static normalizeTags(tags?: string[]): string[] {
    if (!tags) return [];
    
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
  }
}