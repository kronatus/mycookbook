const pdfParse = require('pdf-parse');
import { ContentParser } from './content-parser';
import { ContentNormalizer } from './content-normalizer';
import { RecipeIngestionValidator } from './recipe-ingestion-validator';
import type {
  DocumentIngestionOptions,
  DocumentIngestionResult,
  ParsedDocument,
  ExtractedRecipe,
} from './types';

export class DocumentIngestionService {
  private contentParser: ContentParser;
  private contentNormalizer: ContentNormalizer;
  private validator: RecipeIngestionValidator;

  constructor() {
    this.contentParser = new ContentParser();
    this.contentNormalizer = new ContentNormalizer();
    this.validator = new RecipeIngestionValidator();
  }

  /**
   * Process a document file and extract recipes
   */
  async processDocument(
    fileBuffer: Buffer,
    fileName: string,
    options: DocumentIngestionOptions = {}
  ): Promise<DocumentIngestionResult> {
    try {
      // Validate file size
      const maxSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
      if (fileBuffer.length > maxSize) {
        return {
          success: false,
          error: {
            type: 'file_size',
            message: `File size exceeds maximum allowed size of ${maxSize} bytes`,
            details: { actualSize: fileBuffer.length, maxSize }
          }
        };
      }

      // Determine file type and validate
      const fileType = this.getFileType(fileName);
      const allowedTypes = options.allowedTypes || ['pdf', 'docx', 'doc'];
      
      if (!allowedTypes.includes(fileType)) {
        return {
          success: false,
          error: {
            type: 'file_type',
            message: `Unsupported file type: ${fileType}`,
            details: { supportedTypes: allowedTypes }
          }
        };
      }

      // Parse document based on type
      const parsedDocument = await this.parseDocument(fileBuffer, fileName, fileType);
      
      if (!parsedDocument.text.trim()) {
        return {
          success: false,
          error: {
            type: 'parsing',
            message: 'No text content could be extracted from the document'
          }
        };
      }

      // Extract recipe sections from the text
      const recipeSections = this.contentParser.identifyRecipeSections(parsedDocument.text);
      
      if (recipeSections.length === 0) {
        return {
          success: false,
          error: {
            type: 'parsing',
            message: 'No recipe content could be identified in the document'
          }
        };
      }

      // Convert sections to recipes
      const recipes: ExtractedRecipe[] = [];
      for (const section of recipeSections) {
        try {
          const recipe = this.convertToRecipe(section.content, fileName, section.title);
          
          // Validate the recipe
          const validationResult = RecipeIngestionValidator.validate(recipe);
          if (validationResult.isValid) {
            recipes.push(recipe);
          }
        } catch (error) {
          // Continue processing other sections if one fails
          console.warn(`Failed to process recipe section "${section.title}":`, error);
        }
      }

      if (recipes.length === 0) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'No valid recipes could be extracted from the document'
          }
        };
      }

      return {
        success: true,
        recipes,
        metadata: {
          fileName,
          fileSize: fileBuffer.length,
          fileType,
          pageCount: parsedDocument.metadata.pageCount,
          extractedText: parsedDocument.text
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'processing',
          message: 'An error occurred while processing the document',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Parse document based on file type
   */
  private async parseDocument(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string
  ): Promise<ParsedDocument> {
    switch (fileType) {
      case 'pdf':
        return this.parsePDF(fileBuffer, fileName);
      case 'docx':
      case 'doc':
        return this.parseWord(fileBuffer, fileName);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Parse PDF document
   */
  private async parsePDF(fileBuffer: Buffer, fileName: string): Promise<ParsedDocument> {
    try {
      const data = await pdfParse(fileBuffer);
      
      return {
        text: data.text,
        metadata: {
          fileName,
          fileSize: fileBuffer.length,
          fileType: 'pdf',
          pageCount: data.numpages
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse Word document
   * Note: Word document parsing is currently disabled due to server environment compatibility issues
   * with the mammoth library. This will be implemented in a future update.
   */
  private async parseWord(fileBuffer: Buffer, fileName: string): Promise<ParsedDocument> {
    console.log('Word document parsing requested:', fileName);
    console.log('Note: Automatic Word document parsing is currently unavailable');
    
    // For now, return a placeholder that indicates manual entry is needed
    return {
      text: `Document: ${fileName}\n\nAutomatic text extraction from Word documents is currently unavailable due to server compatibility issues.\n\nPlease manually enter your recipe content, or try converting your document to PDF format.`,
      metadata: {
        fileName,
        fileSize: fileBuffer.length,
        fileType: this.getFileType(fileName)
      }
    };
  }

  /**
   * Get file type from filename
   */
  private getFileType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    return extension || '';
  }

  /**
   * Convert normalized content to recipe format
   */
  private convertToRecipe(
    normalizedContent: any,
    fileName: string,
    sectionTitle: string
  ): ExtractedRecipe {
    return {
      title: normalizedContent.title || sectionTitle || 'Untitled Recipe',
      description: normalizedContent.description,
      ingredients: normalizedContent.ingredients.map((ingredient: string, index: number) => ({
        name: ingredient,
        quantity: undefined,
        unit: undefined,
        notes: undefined
      })),
      instructions: normalizedContent.instructions.map((instruction: string, index: number) => ({
        stepNumber: index + 1,
        description: instruction,
        duration: undefined
      })),
      cookingTime: normalizedContent.metadata.cookingTime,
      prepTime: normalizedContent.metadata.prepTime,
      servings: normalizedContent.metadata.servings,
      difficulty: normalizedContent.metadata.difficulty as 'easy' | 'medium' | 'hard' | undefined,
      categories: normalizedContent.metadata.categories || [],
      tags: normalizedContent.metadata.tags || [],
      sourceUrl: `file://${fileName}`,
      sourceType: 'document',
      author: normalizedContent.metadata.author,
      publishedDate: normalizedContent.metadata.publishedDate
    };
  }

  /**
   * Get supported file types
   */
  getSupportedFileTypes(): string[] {
    return ['pdf', 'docx', 'doc'];
  }

  /**
   * Get maximum file size
   */
  getMaxFileSize(): number {
    return 10 * 1024 * 1024; // 10MB
  }
}