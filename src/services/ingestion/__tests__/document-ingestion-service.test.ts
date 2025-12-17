import { describe, it, expect } from 'vitest';
import { DocumentIngestionService } from '../document-ingestion-service';
import { ContentParser } from '../content-parser';

describe('DocumentIngestionService', () => {
  const service = new DocumentIngestionService();

  describe('Basic functionality', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(DocumentIngestionService);
    });

    it('should return supported file types', () => {
      const supportedTypes = service.getSupportedFileTypes();
      expect(supportedTypes).toContain('pdf');
      expect(supportedTypes).toContain('docx');
      expect(supportedTypes).toContain('doc');
    });

    it('should return maximum file size', () => {
      const maxSize = service.getMaxFileSize();
      expect(maxSize).toBe(10 * 1024 * 1024); // 10MB
    });
  });

  describe('File validation', () => {
    it('should reject files that are too large', async () => {
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB
      const result = await service.processDocument(largeBuffer, 'test.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('file_size');
    });

    it('should reject unsupported file types', async () => {
      const buffer = Buffer.from('test content');
      const result = await service.processDocument(buffer, 'test.txt');
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('file_type');
    });
  });

  describe('Document processing', () => {
    it('should handle empty documents', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = await service.processDocument(emptyBuffer, 'test.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('processing');
    });
  });
});

describe('ContentParser', () => {
  const parser = new ContentParser();

  describe('Recipe section identification', () => {
    it('should identify recipe sections in text', () => {
      const text = `
        Chocolate Chip Cookies Recipe
        
        Ingredients:
        - 2 cups flour
        - 1 cup sugar
        - 1/2 cup butter
        
        Instructions:
        1. Mix dry ingredients
        2. Add butter and mix
        3. Bake at 350°F for 12 minutes
      `;
      
      const sections = parser.identifyRecipeSections(text);
      expect(sections.length).toBeGreaterThan(0);
      expect(sections[0].title).toContain('Chocolate Chip Cookies');
    });

    it('should separate multiple recipes', () => {
      const text = `
        Recipe 1: Cookies
        Ingredients: flour, sugar
        Instructions: mix and bake
        
        Recipe 2: Cake
        Ingredients: flour, eggs
        Instructions: mix and bake
      `;
      
      const recipes = parser.separateMultipleRecipes(text);
      expect(recipes.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate confidence scores', () => {
      const recipeText = `
        Ingredients:
        - flour
        - sugar
        
        Instructions:
        1. Mix ingredients
        2. Bake
      `;
      
      const score = parser.getConfidenceScore(recipeText);
      expect(score).toBeGreaterThan(0.5);
    });
  });
});