import { BaseSourceAdapter } from './base-adapter';
import type { NormalizedContent } from '../types';

/**
 * Adapter for websites that use JSON-LD structured data with Recipe schema
 * This covers many recipe websites that follow schema.org standards
 */
export class JsonLdAdapter extends BaseSourceAdapter {
  canHandle(url: string): boolean {
    // This adapter can potentially handle any URL, but we'll check for JSON-LD in the content
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getSupportedDomains(): string[] {
    return ['*']; // Universal adapter that tries to find JSON-LD structured data
  }

  protected async extractContent(html: string, url: string): Promise<NormalizedContent> {
    // Parse HTML to find JSON-LD structured data
    const jsonLdData = this.extractJsonLd(html);
    
    if (jsonLdData) {
      return this.parseJsonLdRecipe(jsonLdData);
    }
    
    // Fallback to basic HTML parsing if no JSON-LD found
    return this.parseHtmlFallback(html);
  }

  private extractJsonLd(html: string): any {
    // Look for JSON-LD script tags - use a more robust approach
    const scriptMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi);
    
    if (!scriptMatches) {
      return null;
    }
    
    for (const scriptMatch of scriptMatches) {
      try {
        // Extract content between script tags
        const contentMatch = scriptMatch.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (!contentMatch) continue;
        
        const jsonContent = contentMatch[1].trim();
        const jsonData = JSON.parse(jsonContent);
        
        // Handle both single objects and arrays
        const recipes = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const item of recipes) {
          if (this.isRecipeSchema(item)) {
            return item;
          }
          
          // Check for nested recipe in @graph
          if (item['@graph']) {
            for (const graphItem of item['@graph']) {
              if (this.isRecipeSchema(graphItem)) {
                return graphItem;
              }
            }
          }
        }
      } catch (error) {
        // Continue to next script tag if JSON parsing fails
        continue;
      }
    }
    
    return null;
  }

  private isRecipeSchema(data: any): boolean {
    const type = data['@type'];
    return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
  }

  private parseJsonLdRecipe(data: any): NormalizedContent {
    const ingredients = this.extractIngredients(data.recipeIngredient || []);
    const instructions = this.extractInstructions(data.recipeInstructions || []);
    
    return {
      title: data.name || 'Untitled Recipe',
      description: data.description,
      ingredients,
      instructions,
      metadata: {
        cookingTime: this.parseDuration(data.cookTime),
        prepTime: this.parseDuration(data.prepTime),
        servings: this.parseYield(data.recipeYield),
        categories: this.extractCategories(data.recipeCategory),
        tags: this.extractTags(data.keywords),
        author: this.extractAuthor(data.author),
        publishedDate: data.datePublished ? new Date(data.datePublished) : undefined,
      },
    };
  }

  private extractIngredients(ingredients: any[]): string[] {
    return ingredients
      .map(ingredient => {
        if (typeof ingredient === 'string') {
          return ingredient;
        }
        if (ingredient.text) {
          return ingredient.text;
        }
        if (ingredient.name) {
          return ingredient.name;
        }
        return '';
      })
      .filter(ingredient => ingredient.trim().length > 0);
  }

  private extractInstructions(instructions: any[]): string[] {
    return instructions
      .map(instruction => {
        if (typeof instruction === 'string') {
          return instruction;
        }
        if (instruction.text) {
          return instruction.text;
        }
        if (instruction.name) {
          return instruction.name;
        }
        return '';
      })
      .filter(instruction => instruction.trim().length > 0);
  }

  private parseDuration(duration: string | undefined): number | undefined {
    if (!duration) return undefined;
    
    // Parse ISO 8601 duration format (PT15M, PT1H30M, etc.)
    const iso8601Regex = /PT(?:(\d+)H)?(?:(\d+)M)?/;
    const match = duration.match(iso8601Regex);
    
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      return hours * 60 + minutes;
    }
    
    // Fallback to basic time parsing
    return this.parseTime(duration);
  }

  private parseYield(yield_: any): number | undefined {
    if (typeof yield_ === 'number') {
      return yield_;
    }
    
    if (typeof yield_ === 'string') {
      const match = yield_.match(/(\d+)/);
      return match ? parseInt(match[1]) : undefined;
    }
    
    if (Array.isArray(yield_) && yield_.length > 0) {
      return this.parseYield(yield_[0]);
    }
    
    return undefined;
  }

  private extractCategories(categories: any): string[] {
    if (!categories) return [];
    
    if (typeof categories === 'string') {
      return [categories];
    }
    
    if (Array.isArray(categories)) {
      return categories.filter(cat => typeof cat === 'string');
    }
    
    return [];
  }

  private extractTags(keywords: any): string[] {
    if (!keywords) return [];
    
    if (typeof keywords === 'string') {
      // Split by common delimiters
      return keywords.split(/[,;]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    
    if (Array.isArray(keywords)) {
      return keywords.filter(keyword => typeof keyword === 'string');
    }
    
    return [];
  }

  private extractAuthor(author: any): string | undefined {
    if (!author) return undefined;
    
    if (typeof author === 'string') {
      return author;
    }
    
    if (author.name) {
      return author.name;
    }
    
    if (Array.isArray(author) && author.length > 0) {
      return this.extractAuthor(author[0]);
    }
    
    return undefined;
  }

  private parseHtmlFallback(html: string): NormalizedContent {
    // Basic HTML parsing as fallback when no JSON-LD is found
    // This is a simplified implementation - could be enhanced with more sophisticated parsing
    
    // Create a simple DOM parser (in a real implementation, you'd use a proper HTML parser)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Recipe';
    
    // Look for common recipe patterns in HTML
    const ingredients = this.extractHtmlList(html, ['ingredient', 'recipe-ingredient']);
    const instructions = this.extractHtmlList(html, ['instruction', 'recipe-instruction', 'method', 'direction']);
    
    return {
      title,
      description: undefined,
      ingredients,
      instructions,
      metadata: {},
    };
  }

  private extractHtmlList(html: string, classNames: string[]): string[] {
    const items: string[] = [];
    
    for (const className of classNames) {
      // Look for lists with these class names
      const listRegex = new RegExp(`<(?:ul|ol)[^>]*class="[^"]*${className}[^"]*"[^>]*>(.*?)</(?:ul|ol)>`, 'gis');
      const listMatch = html.match(listRegex);
      
      if (listMatch) {
        const listContent = listMatch[1];
        const itemRegex = /<li[^>]*>(.*?)<\/li>/gi;
        let itemMatch;
        
        while ((itemMatch = itemRegex.exec(listContent)) !== null) {
          const text = itemMatch[1].replace(/<[^>]*>/g, '').trim();
          if (text.length > 0) {
            items.push(text);
          }
        }
        
        if (items.length > 0) {
          break; // Found items, no need to check other class names
        }
      }
    }
    
    return items;
  }
}