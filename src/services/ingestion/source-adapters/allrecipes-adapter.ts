import { BaseSourceAdapter } from './base-adapter';
import type { NormalizedContent } from '../types';

/**
 * Specialized adapter for AllRecipes.com
 * Handles the specific HTML structure and patterns used by AllRecipes
 */
export class AllRecipesAdapter extends BaseSourceAdapter {
  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('allrecipes.com');
    } catch {
      return false;
    }
  }

  getSupportedDomains(): string[] {
    return ['allrecipes.com', 'www.allrecipes.com'];
  }

  protected async extractContent(html: string, url: string): Promise<NormalizedContent> {
    // First try JSON-LD extraction (AllRecipes uses structured data)
    const jsonLdData = this.extractJsonLd(html);
    if (jsonLdData) {
      return this.parseJsonLdRecipe(jsonLdData);
    }

    // Fallback to HTML parsing with AllRecipes-specific selectors
    return this.parseAllRecipesHtml(html);
  }

  private extractJsonLd(html: string): any {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gi;
    let match;
    
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonData = JSON.parse(match[1]);
        const recipes = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const item of recipes) {
          if (item['@type'] === 'Recipe') {
            return item;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  private parseJsonLdRecipe(data: any): NormalizedContent {
    return {
      title: data.name || 'Untitled Recipe',
      description: data.description,
      ingredients: (data.recipeIngredient || []).filter((ing: string) => ing.trim().length > 0),
      instructions: (data.recipeInstructions || []).map((inst: any) => {
        if (typeof inst === 'string') return inst;
        return inst.text || inst.name || '';
      }).filter((inst: string) => inst.trim().length > 0),
      metadata: {
        cookingTime: this.parseDuration(data.cookTime),
        prepTime: this.parseDuration(data.prepTime),
        servings: this.parseYield(data.recipeYield),
        categories: Array.isArray(data.recipeCategory) ? data.recipeCategory : 
                   data.recipeCategory ? [data.recipeCategory] : [],
        tags: this.extractKeywords(data.keywords),
        author: this.extractAuthor(data.author),
        publishedDate: data.datePublished ? new Date(data.datePublished) : undefined,
      },
    };
  }

  private parseAllRecipesHtml(html: string): NormalizedContent {
    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                      html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(' | Allrecipes', '') : 'Untitled Recipe';

    // Extract ingredients using AllRecipes-specific patterns
    const ingredients = this.extractAllRecipesIngredients(html);
    
    // Extract instructions
    const instructions = this.extractAllRecipesInstructions(html);

    // Extract metadata
    const servings = this.extractAllRecipesServings(html);
    const prepTime = this.extractAllRecipesPrepTime(html);
    const cookTime = this.extractAllRecipesCookTime(html);

    return {
      title,
      description: undefined,
      ingredients,
      instructions,
      metadata: {
        servings,
        prepTime,
        cookingTime: cookTime,
        categories: ['main-course'], // Default category
        tags: [],
      },
    };
  }

  private extractAllRecipesIngredients(html: string): string[] {
    const ingredients: string[] = [];
    
    // Look for ingredient list patterns
    const ingredientPatterns = [
      /<span[^>]*class="[^"]*ingredients-item-name[^"]*"[^>]*>([^<]+)<\/span>/gi,
      /<li[^>]*class="[^"]*mntl-structured-ingredients[^"]*"[^>]*>.*?<span[^>]*>([^<]+)<\/span>/gi,
      /<div[^>]*class="[^"]*recipe-ingredient[^"]*"[^>]*>([^<]+)<\/div>/gi,
    ];

    for (const pattern of ingredientPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const ingredient = match[1].trim();
        if (ingredient.length > 0 && !ingredients.includes(ingredient)) {
          ingredients.push(ingredient);
        }
      }
      
      if (ingredients.length > 0) {
        break; // Found ingredients, no need to try other patterns
      }
    }

    return ingredients;
  }

  private extractAllRecipesInstructions(html: string): string[] {
    const instructions: string[] = [];
    
    // Look for instruction patterns
    const instructionPatterns = [
      /<div[^>]*class="[^"]*instructions-section-item[^"]*"[^>]*>.*?<p[^>]*>([^<]+)<\/p>/gi,
      /<li[^>]*class="[^"]*mntl-sc-block-group--LI[^"]*"[^>]*>.*?<p[^>]*>([^<]+)<\/p>/gi,
      /<div[^>]*class="[^"]*recipe-instruction[^"]*"[^>]*>([^<]+)<\/div>/gi,
    ];

    for (const pattern of instructionPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const instruction = match[1].trim();
        if (instruction.length > 0) {
          instructions.push(instruction);
        }
      }
      
      if (instructions.length > 0) {
        break; // Found instructions, no need to try other patterns
      }
    }

    return instructions;
  }

  private extractAllRecipesServings(html: string): number | undefined {
    const servingsPatterns = [
      /<div[^>]*class="[^"]*recipe-adjust-servings[^"]*"[^>]*>.*?(\d+).*?<\/div>/i,
      /<span[^>]*class="[^"]*servings[^"]*"[^>]*>(\d+)<\/span>/i,
    ];

    for (const pattern of servingsPatterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractAllRecipesPrepTime(html: string): number | undefined {
    const prepTimePatterns = [
      /<div[^>]*class="[^"]*recipe-prep-time[^"]*"[^>]*>.*?(\d+).*?(?:minutes?|mins?|hours?|hrs?)/i,
      /<span[^>]*class="[^"]*prep-time[^"]*"[^>]*>.*?(\d+).*?(?:minutes?|mins?|hours?|hrs?)/i,
    ];

    for (const pattern of prepTimePatterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private extractAllRecipesCookTime(html: string): number | undefined {
    const cookTimePatterns = [
      /<div[^>]*class="[^"]*recipe-cook-time[^"]*"[^>]*>.*?(\d+).*?(?:minutes?|mins?|hours?|hrs?)/i,
      /<span[^>]*class="[^"]*cook-time[^"]*"[^>]*>.*?(\d+).*?(?:minutes?|mins?|hours?|hrs?)/i,
    ];

    for (const pattern of cookTimePatterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  private parseDuration(duration: string | undefined): number | undefined {
    if (!duration) return undefined;
    
    // Parse ISO 8601 duration format
    const iso8601Regex = /PT(?:(\d+)H)?(?:(\d+)M)?/;
    const match = duration.match(iso8601Regex);
    
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      return hours * 60 + minutes;
    }
    
    return this.parseTime(duration);
  }

  private parseYield(yield_: any): number | undefined {
    if (typeof yield_ === 'number') return yield_;
    if (typeof yield_ === 'string') {
      const match = yield_.match(/(\d+)/);
      return match ? parseInt(match[1]) : undefined;
    }
    if (Array.isArray(yield_) && yield_.length > 0) {
      return this.parseYield(yield_[0]);
    }
    return undefined;
  }

  private extractKeywords(keywords: any): string[] {
    if (!keywords) return [];
    if (typeof keywords === 'string') {
      return keywords.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    if (Array.isArray(keywords)) {
      return keywords.filter(keyword => typeof keyword === 'string');
    }
    return [];
  }

  private extractAuthor(author: any): string | undefined {
    if (!author) return undefined;
    if (typeof author === 'string') return author;
    if (author.name) return author.name;
    if (Array.isArray(author) && author.length > 0) {
      return this.extractAuthor(author[0]);
    }
    return undefined;
  }
}