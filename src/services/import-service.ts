import { RecipeRepository } from '../repositories/recipe-repository';
import { RecipeValidator } from '../validators/recipe-validator';
import type { Recipe, NewRecipe } from '../db/schema';

export interface ImportOptions {
  skipDuplicates?: boolean;
  overwriteExisting?: boolean;
  validateStrict?: boolean;
  batchSize?: number;
  progressCallback?: (progress: ImportProgress) => void;
}

export interface ImportProgress {
  totalItems: number;
  processedItems: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  currentItem?: string;
  errors: ImportError[];
}

export interface ImportError {
  index: number;
  item?: string;
  error: string;
  severity: 'warning' | 'error';
}

export interface ImportResult {
  success: boolean;
  progress: ImportProgress;
  duplicateConflicts?: ConflictResolution[];
}

export interface ConflictResolution {
  existingRecipe: Recipe;
  importedRecipe: any;
  conflictType: 'title_match' | 'url_match' | 'content_similarity';
  similarity?: number;
  resolution: 'skip' | 'overwrite' | 'create_new' | 'merge';
}

export interface ExternalRecipeFormat {
  // Common fields across formats
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  
  // Ingredients - various formats
  ingredients?: any[];
  recipeIngredient?: string[];
  ingredient_list?: string[];
  
  // Instructions - various formats
  instructions?: any[];
  recipeInstructions?: any[];
  directions?: any[];
  method?: any[];
  steps?: any[];
  
  // Timing
  cookTime?: string | number;
  cookingTime?: string | number;
  cooking_time?: string | number;
  prepTime?: string | number;
  prep_time?: string | number;
  preparationTime?: string | number;
  totalTime?: string | number;
  
  // Servings
  servings?: number | string;
  yield?: number | string;
  recipeYield?: number | string;
  serves?: number | string;
  
  // Metadata
  difficulty?: string;
  category?: string | string[];
  categories?: string[];
  cuisine?: string | string[];
  tags?: string[];
  keywords?: string | string[];
  
  // Source information
  url?: string;
  source?: string;
  author?: string;
  
  // Additional fields
  notes?: string;
  nutrition?: any;
  image?: string;
  images?: string[];
}

export class ImportService {
  private repository: RecipeRepository;
  private readonly BATCH_SIZE = 10;
  private readonly SIMILARITY_THRESHOLD = 0.8;

  constructor() {
    this.repository = new RecipeRepository();
  }

  /**
   * Import recipes from JSON data with comprehensive format support
   */
  async importFromJSON(
    userId: string,
    jsonData: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const progress: ImportProgress = {
      totalItems: 0,
      processedItems: 0,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: []
    };

    try {
      const parsed = JSON.parse(jsonData);
      const recipesToImport = this.extractRecipesFromData(parsed);
      
      progress.totalItems = recipesToImport.length;
      
      if (recipesToImport.length === 0) {
        return {
          success: false,
          progress: {
            ...progress,
            errors: [{ index: 0, error: 'No valid recipes found in the provided data', severity: 'error' }]
          }
        };
      }

      // Get existing recipes for conflict detection
      const existingRecipes = await this.repository.findByUserId(userId);
      const conflicts: ConflictResolution[] = [];

      // Process recipes in batches
      const batchSize = options.batchSize || this.BATCH_SIZE;
      
      for (let i = 0; i < recipesToImport.length; i += batchSize) {
        const batch = recipesToImport.slice(i, i + batchSize);
        
        for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
          const rawRecipe = batch[batchIndex];
          const globalIndex = i + batchIndex;
          progress.currentItem = this.getRecipeTitle(rawRecipe);
          
          try {
            // Normalize the recipe format
            const normalizedRecipe = this.normalizeExternalRecipe(rawRecipe, userId);
            
            // Validate the normalized recipe
            if (options.validateStrict) {
              const validation = RecipeValidator.validate(normalizedRecipe);
              if (!validation.isValid) {
                progress.errors.push({
                  index: globalIndex,
                  item: progress.currentItem,
                  error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
                  severity: 'error'
                });
                progress.errorCount++;
                progress.processedItems++;
                continue;
              }
            }

            // Check for conflicts
            const conflict = this.detectConflicts(normalizedRecipe, existingRecipes);
            
            if (conflict) {
              conflicts.push(conflict);
              
              if (options.skipDuplicates && !options.overwriteExisting) {
                progress.skippedCount++;
                progress.processedItems++;
                continue;
              }
              
              if (options.overwriteExisting && conflict.existingRecipe) {
                // Update existing recipe
                await this.repository.update(conflict.existingRecipe.id, normalizedRecipe);
                progress.importedCount++;
              } else {
                // Create new recipe with modified title
                normalizedRecipe.title = `${normalizedRecipe.title} (Imported)`;
                await this.repository.create(normalizedRecipe);
                progress.importedCount++;
              }
            } else {
              // No conflict, create new recipe
              await this.repository.create(normalizedRecipe);
              progress.importedCount++;
            }

          } catch (error) {
            progress.errors.push({
              index: globalIndex,
              item: progress.currentItem,
              error: error instanceof Error ? error.message : 'Unknown error',
              severity: 'error'
            });
            progress.errorCount++;
          }
          
          progress.processedItems++;
          
          // Call progress callback if provided
          if (options.progressCallback) {
            options.progressCallback({ ...progress });
          }
        }
      }

      return {
        success: progress.errorCount < progress.totalItems,
        progress,
        duplicateConflicts: conflicts.length > 0 ? conflicts : undefined
      };

    } catch (error) {
      progress.errors.push({
        index: 0,
        error: error instanceof Error ? error.message : 'Failed to parse JSON data',
        severity: 'error'
      });
      
      return {
        success: false,
        progress
      };
    }
  }

  /**
   * Import recipes from various external formats (Recipe Keeper, Paprika, etc.)
   */
  async importFromExternalFormat(
    userId: string,
    data: string,
    format: 'recipe-keeper' | 'paprika' | 'yummly' | 'allrecipes' | 'generic-json',
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      let normalizedData: any;

      switch (format) {
        case 'recipe-keeper':
          normalizedData = this.parseRecipeKeeperFormat(data);
          break;
        case 'paprika':
          normalizedData = this.parsePaprikaFormat(data);
          break;
        case 'yummly':
          normalizedData = this.parseYummlyFormat(data);
          break;
        case 'allrecipes':
          normalizedData = this.parseAllRecipesFormat(data);
          break;
        case 'generic-json':
        default:
          normalizedData = JSON.parse(data);
          break;
      }

      return await this.importFromJSON(userId, JSON.stringify(normalizedData), options);
    } catch (error) {
      return {
        success: false,
        progress: {
          totalItems: 0,
          processedItems: 0,
          importedCount: 0,
          skippedCount: 0,
          errorCount: 1,
          errors: [{
            index: 0,
            error: `Failed to parse ${format} format: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error'
          }]
        }
      };
    }
  }

  /**
   * Import recipes from CSV format
   */
  async importFromCSV(
    userId: string,
    csvData: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const progress: ImportProgress = {
      totalItems: 0,
      processedItems: 0,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: []
    };

    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return {
          success: false,
          progress: {
            ...progress,
            errors: [{ index: 0, error: 'CSV must contain at least a header and one data row', severity: 'error' }]
          }
        };
      }

      const headers = this.parseCSVLine(lines[0]);
      const dataLines = lines.slice(1);
      progress.totalItems = dataLines.length;

      const existingRecipes = await this.repository.findByUserId(userId);
      const conflicts: ConflictResolution[] = [];

      for (let index = 0; index < dataLines.length; index++) {
        const line = dataLines[index];
        progress.currentItem = `Row ${index + 2}`;
        
        try {
          const values = this.parseCSVLine(line);
          const recipeData = this.csvRowToRecipe(headers, values);
          
          if (!recipeData.title) {
            progress.errors.push({
              index,
              item: progress.currentItem,
              error: 'Missing required title field',
              severity: 'error'
            });
            progress.errorCount++;
            progress.processedItems++;
            continue;
          }

          const normalizedRecipe = this.normalizeExternalRecipe(recipeData, userId);
          
          // Check for conflicts
          const conflict = this.detectConflicts(normalizedRecipe, existingRecipes);
          
          if (conflict && options.skipDuplicates) {
            conflicts.push(conflict);
            progress.skippedCount++;
          } else {
            if (conflict && options.overwriteExisting && conflict.existingRecipe) {
              await this.repository.update(conflict.existingRecipe.id, normalizedRecipe);
            } else {
              if (conflict) {
                normalizedRecipe.title = `${normalizedRecipe.title} (Imported)`;
              }
              await this.repository.create(normalizedRecipe);
            }
            progress.importedCount++;
          }

        } catch (error) {
          progress.errors.push({
            index,
            item: progress.currentItem,
            error: error instanceof Error ? error.message : 'Unknown error',
            severity: 'error'
          });
          progress.errorCount++;
        }
        
        progress.processedItems++;
        
        if (options.progressCallback) {
          options.progressCallback({ ...progress });
        }
      }

      return {
        success: progress.errorCount < progress.totalItems,
        progress,
        duplicateConflicts: conflicts.length > 0 ? conflicts : undefined
      };

    } catch (error) {
      return {
        success: false,
        progress: {
          ...progress,
          errors: [{ index: 0, error: error instanceof Error ? error.message : 'CSV parsing failed', severity: 'error' }]
        }
      };
    }
  }

  /**
   * Extract recipes from various data structures
   */
  private extractRecipesFromData(data: any): ExternalRecipeFormat[] {
    if (Array.isArray(data)) {
      return data;
    }
    
    // Handle backup format
    if (data.recipes && Array.isArray(data.recipes)) {
      return data.recipes;
    }
    
    // Handle single recipe
    if (data.title || data.name) {
      return [data];
    }
    
    // Handle nested structures
    const recipes: ExternalRecipeFormat[] = [];
    
    // Look for common recipe collection keys
    const recipeKeys = ['recipes', 'data', 'items', 'results'];
    for (const key of recipeKeys) {
      if (data[key] && Array.isArray(data[key])) {
        recipes.push(...data[key]);
      }
    }
    
    return recipes;
  }

  /**
   * Normalize external recipe format to internal format
   */
  private normalizeExternalRecipe(recipe: ExternalRecipeFormat, userId: string): NewRecipe {
    return {
      title: this.getRecipeTitle(recipe),
      description: recipe.description || recipe.summary || null,
      ingredients: this.normalizeIngredients(recipe),
      instructions: this.normalizeInstructions(recipe),
      cookingTime: this.parseTimeValue(recipe.cookTime || recipe.cookingTime || recipe.cooking_time),
      prepTime: this.parseTimeValue(recipe.prepTime || recipe.prep_time || recipe.preparationTime),
      servings: this.parseServings(recipe.servings || recipe.yield || recipe.recipeYield || recipe.serves),
      difficulty: this.normalizeDifficulty(recipe.difficulty),
      categories: this.normalizeCategories(recipe.category || recipe.categories || recipe.cuisine),
      tags: this.normalizeTags(recipe.tags || recipe.keywords),
      sourceUrl: recipe.url || recipe.source || null,
      sourceType: 'manual' as const,
      personalNotes: recipe.notes || null,
      userId
    };
  }

  /**
   * Get recipe title from various possible fields
   */
  private getRecipeTitle(recipe: ExternalRecipeFormat): string {
    const title = recipe.title || recipe.name || '';
    return title.trim() || 'Untitled Recipe';
  }

  /**
   * Normalize ingredients from various formats
   */
  private normalizeIngredients(recipe: ExternalRecipeFormat): Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }> {
    const ingredients = recipe.ingredients || recipe.recipeIngredient || recipe.ingredient_list || [];
    
    return ingredients.map((ingredient, index) => {
      if (typeof ingredient === 'string') {
        return this.parseIngredientString(ingredient);
      }
      
      if (typeof ingredient === 'object' && ingredient !== null) {
        return {
          name: ingredient.name || ingredient.ingredient || `Ingredient ${index + 1}`,
          quantity: ingredient.quantity || ingredient.amount || undefined,
          unit: ingredient.unit || ingredient.measurement || undefined,
          notes: ingredient.notes || ingredient.note || undefined
        };
      }
      
      return { name: `Ingredient ${index + 1}` };
    });
  }

  /**
   * Parse ingredient string to extract quantity, unit, and name
   */
  private parseIngredientString(ingredientStr: string): {
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  } {
    // Enhanced regex to handle mixed numbers like "1 1/2 cups flour"
    const match = ingredientStr.match(/^(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
    
    if (match) {
      const [, quantityStr, unit, name] = match;
      const quantity = this.parseQuantity(quantityStr);
      
      return {
        name: name.trim(),
        quantity,
        unit: unit || undefined
      };
    }
    
    return { name: ingredientStr.trim() };
  }

  /**
   * Parse quantity string (handles fractions)
   */
  private parseQuantity(quantityStr: string): number | undefined {
    if (!quantityStr) return undefined;
    
    // Handle fractions like "1/2" or "1 1/2"
    if (quantityStr.includes('/')) {
      const parts = quantityStr.trim().split(/\s+/); // Split by whitespace
      let total = 0;
      
      for (const part of parts) {
        if (part.includes('/')) {
          const [num, den] = part.split('/').map(Number);
          if (!isNaN(num) && !isNaN(den) && den !== 0) {
            total += num / den;
          }
        } else {
          const num = Number(part);
          if (!isNaN(num)) {
            total += num;
          }
        }
      }
      
      return total > 0 ? total : undefined;
    }
    
    const num = Number(quantityStr);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Normalize instructions from various formats
   */
  private normalizeInstructions(recipe: ExternalRecipeFormat): Array<{
    stepNumber: number;
    description: string;
    duration?: number;
  }> {
    const instructions = recipe.instructions || recipe.recipeInstructions || recipe.directions || recipe.method || recipe.steps || [];
    
    return instructions.map((instruction, index) => {
      if (typeof instruction === 'string') {
        return {
          stepNumber: index + 1,
          description: instruction.trim()
        };
      }
      
      if (typeof instruction === 'object' && instruction !== null) {
        return {
          stepNumber: instruction.stepNumber || instruction.step || index + 1,
          description: instruction.description || instruction.text || instruction.instruction || `Step ${index + 1}`,
          duration: instruction.duration || instruction.time || undefined
        };
      }
      
      return {
        stepNumber: index + 1,
        description: `Step ${index + 1}`
      };
    });
  }

  /**
   * Parse time values (handles various formats)
   */
  private parseTimeValue(timeValue: any): number | null {
    if (!timeValue) return null;
    
    if (typeof timeValue === 'number') {
      return timeValue;
    }
    
    if (typeof timeValue === 'string') {
      // Handle ISO 8601 duration format (PT30M)
      const isoMatch = timeValue.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (isoMatch) {
        const hours = parseInt(isoMatch[1] || '0');
        const minutes = parseInt(isoMatch[2] || '0');
        return hours * 60 + minutes;
      }
      
      // Handle "30 minutes", "1 hour", etc.
      const timeMatch = timeValue.match(/(\d+)\s*(hour|hr|minute|min)/i);
      if (timeMatch) {
        const value = parseInt(timeMatch[1]);
        const unit = timeMatch[2].toLowerCase();
        return unit.startsWith('hour') || unit === 'hr' ? value * 60 : value;
      }
      
      // Handle plain numbers
      const num = parseInt(timeValue);
      return isNaN(num) ? null : num;
    }
    
    return null;
  }

  /**
   * Parse servings from various formats
   */
  private parseServings(servings: any): number | null {
    if (!servings) return null;
    
    if (typeof servings === 'number') {
      return servings;
    }
    
    if (typeof servings === 'string') {
      const num = parseInt(servings);
      return isNaN(num) ? null : num;
    }
    
    return null;
  }

  /**
   * Normalize difficulty levels
   */
  private normalizeDifficulty(difficulty: any): 'easy' | 'medium' | 'hard' | null {
    if (!difficulty) return null;
    
    const diffStr = difficulty.toString().toLowerCase();
    
    if (diffStr.includes('easy') || diffStr.includes('beginner') || diffStr === '1') {
      return 'easy';
    }
    
    if (diffStr.includes('hard') || diffStr.includes('difficult') || diffStr.includes('advanced') || diffStr === '3') {
      return 'hard';
    }
    
    if (diffStr.includes('medium') || diffStr.includes('intermediate') || diffStr === '2') {
      return 'medium';
    }
    
    return null;
  }

  /**
   * Normalize categories
   */
  private normalizeCategories(categories: any): string[] {
    if (!categories) return [];
    
    if (Array.isArray(categories)) {
      return categories.map(cat => cat.toString().trim()).filter(Boolean);
    }
    
    if (typeof categories === 'string') {
      return categories.split(',').map(cat => cat.trim()).filter(Boolean);
    }
    
    return [];
  }

  /**
   * Normalize tags
   */
  private normalizeTags(tags: any): string[] {
    if (!tags) return [];
    
    if (Array.isArray(tags)) {
      return tags.map(tag => tag.toString().trim()).filter(Boolean);
    }
    
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    
    return [];
  }

  /**
   * Detect conflicts with existing recipes
   */
  private detectConflicts(newRecipe: NewRecipe, existingRecipes: Recipe[]): ConflictResolution | null {
    for (const existing of existingRecipes) {
      // Check for exact title match
      if (existing.title.toLowerCase() === newRecipe.title.toLowerCase()) {
        return {
          existingRecipe: existing,
          importedRecipe: newRecipe,
          conflictType: 'title_match',
          resolution: 'skip'
        };
      }
      
      // Check for URL match
      if (newRecipe.sourceUrl && existing.sourceUrl === newRecipe.sourceUrl) {
        return {
          existingRecipe: existing,
          importedRecipe: newRecipe,
          conflictType: 'url_match',
          resolution: 'skip'
        };
      }
      
      // Check for content similarity (simplified)
      const similarity = this.calculateSimilarity(existing, newRecipe);
      if (similarity > this.SIMILARITY_THRESHOLD) {
        return {
          existingRecipe: existing,
          importedRecipe: newRecipe,
          conflictType: 'content_similarity',
          similarity,
          resolution: 'skip'
        };
      }
    }
    
    return null;
  }

  /**
   * Calculate similarity between recipes (simplified implementation)
   */
  private calculateSimilarity(recipe1: Recipe, recipe2: NewRecipe): number {
    let score = 0;
    let factors = 0;
    
    // Title similarity
    if (recipe1.title && recipe2.title) {
      const titleSimilarity = this.stringSimilarity(recipe1.title, recipe2.title);
      score += titleSimilarity * 0.4;
      factors += 0.4;
    }
    
    // Ingredient similarity
    if (recipe1.ingredients && recipe1.ingredients.length > 0 && recipe2.ingredients && recipe2.ingredients.length > 0) {
      const ingredientSimilarity = this.arrayStringSimilarity(
        recipe1.ingredients.map(i => i.name),
        recipe2.ingredients.map(i => i.name)
      );
      score += ingredientSimilarity * 0.6;
      factors += 0.6;
    }
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity between arrays of strings
   */
  private arrayStringSimilarity(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;
    
    let matches = 0;
    const used = new Set<number>();
    
    for (const item1 of arr1) {
      let bestMatch = -1;
      let bestScore = 0;
      
      for (let i = 0; i < arr2.length; i++) {
        if (used.has(i)) continue;
        
        const similarity = this.stringSimilarity(item1.toLowerCase(), arr2[i].toLowerCase());
        if (similarity > bestScore && similarity > 0.7) {
          bestScore = similarity;
          bestMatch = i;
        }
      }
      
      if (bestMatch >= 0) {
        matches++;
        used.add(bestMatch);
      }
    }
    
    return matches / Math.max(arr1.length, arr2.length);
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Convert CSV row to recipe object
   */
  private csvRowToRecipe(headers: string[], values: string[]): ExternalRecipeFormat {
    const recipe: ExternalRecipeFormat = {};
    
    for (let i = 0; i < headers.length && i < values.length; i++) {
      const header = headers[i].toLowerCase().trim();
      const value = values[i].trim();
      
      if (!value) continue;
      
      // Map common CSV headers to recipe fields
      switch (header) {
        case 'title':
        case 'name':
        case 'recipe name':
          recipe.title = value;
          break;
        case 'description':
        case 'summary':
          recipe.description = value;
          break;
        case 'ingredients':
          recipe.ingredients = value.split('\n').map(ing => ing.trim()).filter(Boolean);
          break;
        case 'instructions':
        case 'directions':
        case 'method':
          recipe.instructions = value.split('\n').map(inst => inst.trim()).filter(Boolean);
          break;
        case 'cook time':
        case 'cooking time':
          recipe.cookingTime = value;
          break;
        case 'prep time':
        case 'preparation time':
          recipe.prepTime = value;
          break;
        case 'servings':
        case 'yield':
          recipe.servings = value;
          break;
        case 'difficulty':
          recipe.difficulty = value;
          break;
        case 'category':
        case 'categories':
          recipe.categories = value.split(',').map(cat => cat.trim());
          break;
        case 'tags':
        case 'keywords':
          recipe.tags = value.split(',').map(tag => tag.trim());
          break;
        case 'url':
        case 'source':
          recipe.url = value;
          break;
        case 'notes':
          recipe.notes = value;
          break;
      }
    }
    
    return recipe;
  }

  /**
   * Parse Recipe Keeper format
   */
  private parseRecipeKeeperFormat(data: string): any {
    // Recipe Keeper typically exports as JSON with specific structure
    const parsed = JSON.parse(data);
    
    if (parsed.recipes) {
      return parsed.recipes.map((recipe: any) => ({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients?.map((ing: any) => ({
          name: ing.ingredient,
          quantity: ing.quantity,
          unit: ing.unit
        })),
        instructions: recipe.directions?.map((dir: any, index: number) => ({
          stepNumber: index + 1,
          description: dir
        })),
        cookingTime: recipe.cookTime,
        prepTime: recipe.prepTime,
        servings: recipe.yield,
        categories: recipe.categories,
        tags: recipe.tags,
        url: recipe.source
      }));
    }
    
    return parsed;
  }

  /**
   * Parse Paprika format
   */
  private parsePaprikaFormat(data: string): any {
    // Paprika exports as JSON with specific field names
    const parsed = JSON.parse(data);
    
    return Array.isArray(parsed) ? parsed.map(recipe => ({
      title: recipe.name,
      description: recipe.description,
      ingredients: recipe.ingredients?.split('\n').filter(Boolean),
      instructions: recipe.directions?.split('\n').filter(Boolean),
      cookingTime: recipe.cook_time,
      prepTime: recipe.prep_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      categories: recipe.categories?.split(','),
      tags: recipe.tags?.split(','),
      url: recipe.source_url,
      notes: recipe.notes
    })) : [parsed];
  }

  /**
   * Parse Yummly format
   */
  private parseYummlyFormat(data: string): any {
    // Yummly API format
    const parsed = JSON.parse(data);
    
    const recipes = parsed.matches || parsed.recipes || [parsed];
    
    return recipes.map((recipe: any) => ({
      title: recipe.recipeName || recipe.name,
      description: recipe.description,
      ingredients: recipe.ingredientLines,
      cookingTime: recipe.totalTimeInSeconds ? recipe.totalTimeInSeconds / 60 : undefined,
      servings: recipe.numberOfServings,
      categories: recipe.course,
      tags: recipe.flavors?.map((f: any) => f.displayName),
      url: recipe.attribution?.url,
      image: recipe.images?.[0]?.hostedLargeUrl
    }));
  }

  /**
   * Parse AllRecipes format
   */
  private parseAllRecipesFormat(data: string): any {
    // AllRecipes JSON-LD format
    const parsed = JSON.parse(data);
    
    const recipes = Array.isArray(parsed) ? parsed : [parsed];
    
    return recipes.map((recipe: any) => ({
      title: recipe.name,
      description: recipe.description,
      ingredients: recipe.recipeIngredient,
      instructions: recipe.recipeInstructions?.map((inst: any) => inst.text || inst),
      cookingTime: recipe.cookTime,
      prepTime: recipe.prepTime,
      servings: recipe.recipeYield,
      categories: recipe.recipeCategory,
      tags: recipe.keywords?.split(','),
      url: recipe.url,
      author: recipe.author?.name
    }));
  }
}