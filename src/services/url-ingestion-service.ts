import { WebScrapingService } from './ingestion/web-scraping-service';
import { RecipeIngestionValidator } from './ingestion/recipe-ingestion-validator';
import { RecipeService, type CreateRecipeRequest } from './recipe-service';
import type { ExtractedRecipe, IngestionResult } from './ingestion/types';
import type { Recipe } from '../db/schema';

export interface UrlIngestionRequest {
  url: string;
  userId: string;
  options?: {
    timeout?: number;
    maxRetries?: number;
    skipValidation?: boolean;
  };
}

export interface UrlIngestionResponse {
  success: boolean;
  recipe?: Recipe;
  extractedData?: ExtractedRecipe;
  validationResult?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  error?: {
    type: 'network' | 'parsing' | 'validation' | 'unsupported' | 'database' | 'not_found' | 'unauthorized';
    message: string;
    details?: any;
  };
}

export class UrlIngestionService {
  private webScrapingService: WebScrapingService;
  private recipeService: RecipeService;

  constructor() {
    this.webScrapingService = new WebScrapingService();
    this.recipeService = new RecipeService();
  }

  /**
   * Extract recipe from URL and save it to the database
   */
  async ingestFromUrl(request: UrlIngestionRequest): Promise<UrlIngestionResponse> {
    try {
      // Configure web scraping service with options
      if (request.options?.timeout) {
        this.webScrapingService = new WebScrapingService({
          timeout: request.options.timeout,
          maxRetries: request.options?.maxRetries || 2,
        });
      }

      // Extract recipe from URL
      const extractionResult = await this.webScrapingService.extractRecipe(request.url);
      
      if (!extractionResult.success) {
        return {
          success: false,
          error: extractionResult.error,
        };
      }

      const extractedRecipe = extractionResult.recipe!;

      // Sanitize the extracted data
      const sanitizedRecipe = RecipeIngestionValidator.sanitize(extractedRecipe);

      // Validate the extracted recipe unless validation is skipped
      let validationResult;
      if (!request.options?.skipValidation) {
        validationResult = RecipeIngestionValidator.validate(sanitizedRecipe);
        
        if (!validationResult.isValid) {
          return {
            success: false,
            extractedData: sanitizedRecipe,
            validationResult,
            error: {
              type: 'validation',
              message: 'Extracted recipe failed validation',
              details: validationResult.errors,
            },
          };
        }
      }

      // Convert extracted recipe to create request format
      const createRequest = this.convertToCreateRequest(sanitizedRecipe, request.userId);

      // Save recipe to database
      const saveResult = await this.recipeService.createRecipe(createRequest);
      
      if (!saveResult.success) {
        return {
          success: false,
          extractedData: sanitizedRecipe,
          validationResult,
          error: {
            type: saveResult.error.type as any,
            message: saveResult.error.message,
            details: saveResult.error.details,
          },
        };
      }

      return {
        success: true,
        recipe: saveResult.recipe,
        extractedData: sanitizedRecipe,
        validationResult,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'parsing',
          message: 'Unexpected error during URL ingestion',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Preview recipe extraction without saving to database
   */
  async previewFromUrl(url: string): Promise<UrlIngestionResponse> {
    try {
      const extractionResult = await this.webScrapingService.extractRecipe(url);
      
      if (!extractionResult.success) {
        return {
          success: false,
          error: extractionResult.error,
        };
      }

      const extractedRecipe = extractionResult.recipe!;
      const sanitizedRecipe = RecipeIngestionValidator.sanitize(extractedRecipe);
      const validationResult = RecipeIngestionValidator.validate(sanitizedRecipe);

      return {
        success: true,
        extractedData: sanitizedRecipe,
        validationResult,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'parsing',
          message: 'Unexpected error during URL preview',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Check if a URL can be handled by the ingestion service
   */
  canHandleUrl(url: string): boolean {
    return this.webScrapingService.canHandle(url);
  }

  /**
   * Get supported domains
   */
  getSupportedDomains(): string[] {
    return this.webScrapingService.getSupportedDomains();
  }

  /**
   * Get information about available adapters
   */
  getAdapterInfo(): Array<{ name: string; domains: string[] }> {
    return this.webScrapingService.getAdapterInfo();
  }

  private convertToCreateRequest(extractedRecipe: ExtractedRecipe, userId: string): CreateRecipeRequest {
    return {
      title: extractedRecipe.title,
      description: extractedRecipe.description,
      ingredients: extractedRecipe.ingredients,
      instructions: extractedRecipe.instructions,
      cookingTime: extractedRecipe.cookingTime,
      prepTime: extractedRecipe.prepTime,
      servings: extractedRecipe.servings,
      difficulty: extractedRecipe.difficulty,
      categories: extractedRecipe.categories || [],
      tags: extractedRecipe.tags || [],
      sourceUrl: extractedRecipe.sourceUrl,
      sourceType: extractedRecipe.sourceType,
      personalNotes: extractedRecipe.author ? `Original author: ${extractedRecipe.author}` : undefined,
      userId,
    };
  }
}