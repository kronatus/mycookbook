import { RecipeRepository } from '../repositories/recipe-repository';
import type { Recipe } from '../db/schema';

export interface ExportOptions {
  format: 'json' | 'pdf';
  includePersonalNotes?: boolean;
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string | Buffer;
  filename?: string;
  mimeType?: string;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  importedCount?: number;
  skippedCount?: number;
  errors?: string[];
}

export interface BackupData {
  version: string;
  exportDate: string;
  recipeCount: number;
  recipes: Recipe[];
}

export class ExportService {
  private repository: RecipeRepository;
  private readonly CURRENT_VERSION = '1.0.0';

  constructor() {
    this.repository = new RecipeRepository();
  }

  /**
   * Export all recipes for a user in the specified format
   */
  async exportRecipes(
    userId: string,
    options: ExportOptions = { format: 'json', includePersonalNotes: true, includeMetadata: true }
  ): Promise<ExportResult> {
    try {
      const recipes = await this.repository.findByUserId(userId);

      if (recipes.length === 0) {
        return {
          success: false,
          error: 'No recipes found to export'
        };
      }

      // Process recipes based on options
      const processedRecipes = this.processRecipesForExport(recipes, options);

      if (options.format === 'json') {
        return this.exportToJSON(processedRecipes);
      } else if (options.format === 'pdf') {
        return this.exportToPDF(processedRecipes);
      }

      return {
        success: false,
        error: 'Unsupported export format'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export a single recipe
   */
  async exportSingleRecipe(
    recipeId: string,
    userId: string,
    options: ExportOptions = { format: 'json', includePersonalNotes: true, includeMetadata: true }
  ): Promise<ExportResult> {
    try {
      const recipe = await this.repository.findById(recipeId);

      if (!recipe) {
        return {
          success: false,
          error: 'Recipe not found'
        };
      }

      if (recipe.userId !== userId) {
        return {
          success: false,
          error: 'Unauthorized access to recipe'
        };
      }

      const processedRecipes = this.processRecipesForExport([recipe], options);

      if (options.format === 'json') {
        return this.exportToJSON(processedRecipes, true);
      } else if (options.format === 'pdf') {
        return this.exportToPDF(processedRecipes);
      }

      return {
        success: false,
        error: 'Unsupported export format'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Create a complete backup of user's recipes
   */
  async createBackup(userId: string): Promise<ExportResult> {
    try {
      const recipes = await this.repository.findByUserId(userId);

      const backupData: BackupData = {
        version: this.CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        recipeCount: recipes.length,
        recipes: recipes
      };

      const jsonData = JSON.stringify(backupData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `cookbook-backup-${timestamp}.json`;

      return {
        success: true,
        data: jsonData,
        filename,
        mimeType: 'application/json'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown backup error'
      };
    }
  }

  /**
   * Restore recipes from a backup
   */
  async restoreFromBackup(
    userId: string,
    backupData: string,
    options: { overwrite?: boolean; skipDuplicates?: boolean } = {}
  ): Promise<ImportResult> {
    try {
      const parsed = JSON.parse(backupData) as BackupData;

      // Validate backup format
      if (!parsed.version || !parsed.recipes || !Array.isArray(parsed.recipes)) {
        return {
          success: false,
          errors: ['Invalid backup format']
        };
      }

      // Check version compatibility
      if (!this.isVersionCompatible(parsed.version)) {
        return {
          success: false,
          errors: [`Incompatible backup version: ${parsed.version}. Current version: ${this.CURRENT_VERSION}`]
        };
      }

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Get existing recipes to check for duplicates
      const existingRecipes = await this.repository.findByUserId(userId);
      const existingTitles = new Set(existingRecipes.map(r => r.title.toLowerCase()));

      for (const recipe of parsed.recipes) {
        try {
          // Check for duplicates
          if (existingTitles.has(recipe.title.toLowerCase())) {
            if (options.skipDuplicates) {
              skippedCount++;
              continue;
            }
            // If overwrite is enabled, we would update existing recipe
            // For now, we'll skip duplicates by default
            skippedCount++;
            continue;
          }

          // Create new recipe with user's ID
          const { id, createdAt, updatedAt, searchVector, ...recipeData } = recipe;
          await this.repository.create({
            ...recipeData,
            userId
          });

          importedCount++;
        } catch (error) {
          errors.push(`Failed to import recipe "${recipe.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        importedCount,
        skippedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown restore error']
      };
    }
  }

  /**
   * Import recipes from external JSON format
   */
  async importFromJSON(
    userId: string,
    jsonData: string,
    options: { skipDuplicates?: boolean } = {}
  ): Promise<ImportResult> {
    try {
      const parsed = JSON.parse(jsonData);

      // Handle both single recipe and array of recipes
      const recipesToImport = Array.isArray(parsed) ? parsed : [parsed];

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Get existing recipes to check for duplicates
      const existingRecipes = await this.repository.findByUserId(userId);
      const existingTitles = new Set(existingRecipes.map(r => r.title.toLowerCase()));

      for (const recipe of recipesToImport) {
        try {
          // Validate required fields
          if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
            errors.push(`Skipping recipe: Missing required fields (title, ingredients, or instructions)`);
            skippedCount++;
            continue;
          }

          // Check for duplicates
          if (existingTitles.has(recipe.title.toLowerCase())) {
            if (options.skipDuplicates) {
              skippedCount++;
              continue;
            }
          }

          // Normalize and create recipe
          const normalizedRecipe = this.normalizeImportedRecipe(recipe, userId);
          await this.repository.create(normalizedRecipe);

          importedCount++;
        } catch (error) {
          errors.push(`Failed to import recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        importedCount,
        skippedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown import error']
      };
    }
  }

  /**
   * Process recipes for export based on options
   */
  private processRecipesForExport(recipes: Recipe[], options: ExportOptions): Recipe[] {
    return recipes.map(recipe => {
      const processed = { ...recipe };

      // Remove personal notes if not included
      if (!options.includePersonalNotes) {
        processed.personalNotes = null;
      }

      // Remove metadata if not included
      if (!options.includeMetadata) {
        processed.createdAt = undefined as any;
        processed.updatedAt = undefined as any;
        processed.searchVector = null;
      }

      return processed;
    });
  }

  /**
   * Export recipes to JSON format
   */
  private exportToJSON(recipes: Recipe[], singleRecipe: boolean = false): ExportResult {
    try {
      const data = singleRecipe ? recipes[0] : recipes;
      const jsonData = JSON.stringify(data, null, 2);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = singleRecipe 
        ? `recipe-${recipes[0].title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.json`
        : `recipes-export-${timestamp}.json`;

      return {
        success: true,
        data: jsonData,
        filename,
        mimeType: 'application/json'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON export failed'
      };
    }
  }

  /**
   * Export recipes to PDF format
   * Note: This is a placeholder implementation. In production, you would use a library like pdfkit or puppeteer
   */
  private exportToPDF(recipes: Recipe[]): ExportResult {
    try {
      // For now, we'll create a simple text-based PDF representation
      // In production, you would use a proper PDF library
      const pdfContent = this.generatePDFContent(recipes);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `recipes-export-${timestamp}.pdf`;

      return {
        success: true,
        data: pdfContent,
        filename,
        mimeType: 'application/pdf'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF export failed'
      };
    }
  }

  /**
   * Generate PDF content (placeholder implementation)
   */
  private generatePDFContent(recipes: Recipe[]): string {
    // This is a simplified text representation
    // In production, use a proper PDF library like pdfkit
    let content = 'RECIPE COLLECTION\n\n';
    content += `Exported: ${new Date().toLocaleDateString()}\n`;
    content += `Total Recipes: ${recipes.length}\n\n`;
    content += '='.repeat(80) + '\n\n';

    for (const recipe of recipes) {
      content += `${recipe.title.toUpperCase()}\n`;
      content += '-'.repeat(recipe.title.length) + '\n\n';

      if (recipe.description) {
        content += `${recipe.description}\n\n`;
      }

      if (recipe.servings) {
        content += `Servings: ${recipe.servings}\n`;
      }
      if (recipe.prepTime) {
        content += `Prep Time: ${recipe.prepTime} minutes\n`;
      }
      if (recipe.cookingTime) {
        content += `Cooking Time: ${recipe.cookingTime} minutes\n`;
      }
      if (recipe.difficulty) {
        content += `Difficulty: ${recipe.difficulty}\n`;
      }
      content += '\n';

      content += 'INGREDIENTS:\n';
      for (const ingredient of recipe.ingredients) {
        const quantity = ingredient.quantity ? `${ingredient.quantity} ` : '';
        const unit = ingredient.unit ? `${ingredient.unit} ` : '';
        const notes = ingredient.notes ? ` (${ingredient.notes})` : '';
        content += `  • ${quantity}${unit}${ingredient.name}${notes}\n`;
      }
      content += '\n';

      content += 'INSTRUCTIONS:\n';
      for (const instruction of recipe.instructions) {
        content += `  ${instruction.stepNumber}. ${instruction.description}\n`;
        if (instruction.duration) {
          content += `     (${instruction.duration} minutes)\n`;
        }
      }
      content += '\n';

      if (recipe.personalNotes) {
        content += `NOTES:\n${recipe.personalNotes}\n\n`;
      }

      if (recipe.sourceUrl) {
        content += `Source: ${recipe.sourceUrl}\n\n`;
      }

      content += '='.repeat(80) + '\n\n';
    }

    return content;
  }

  /**
   * Normalize imported recipe data to match internal format
   */
  private normalizeImportedRecipe(recipe: any, userId: string): any {
    return {
      title: recipe.title,
      description: recipe.description || null,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
      cookingTime: recipe.cookingTime || recipe.cooking_time || null,
      prepTime: recipe.prepTime || recipe.prep_time || null,
      servings: recipe.servings || null,
      difficulty: recipe.difficulty || null,
      categories: Array.isArray(recipe.categories) ? recipe.categories : [],
      tags: Array.isArray(recipe.tags) ? recipe.tags : [],
      sourceUrl: recipe.sourceUrl || recipe.source_url || recipe.url || null,
      sourceType: recipe.sourceType || recipe.source_type || 'manual',
      personalNotes: recipe.personalNotes || recipe.personal_notes || recipe.notes || null,
      userId
    };
  }

  /**
   * Check if backup version is compatible with current version
   */
  private isVersionCompatible(backupVersion: string): boolean {
    // For now, we only support version 1.x.x
    const [major] = backupVersion.split('.');
    const [currentMajor] = this.CURRENT_VERSION.split('.');
    return major === currentMajor;
  }

  /**
   * Migrate data from old format to new format
   * This is a placeholder for future format changes
   */
  async migrateData(oldData: any, fromVersion: string, toVersion: string): Promise<any> {
    // Placeholder for data migration logic
    // This would be implemented when format changes occur
    if (fromVersion === toVersion) {
      return oldData;
    }

    // Add migration logic here as needed
    // For example: if (fromVersion === '1.0.0' && toVersion === '2.0.0') { ... }

    return oldData;
  }
}
