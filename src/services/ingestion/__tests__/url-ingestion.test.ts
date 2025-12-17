import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebScrapingService } from '../web-scraping-service';
import { UrlIngestionService } from '../../url-ingestion-service';

// Mock fetch globally
global.fetch = vi.fn();

describe('URL Ingestion Service', () => {
  let urlIngestionService: UrlIngestionService;
  let mockFetch: any;

  beforeEach(() => {
    urlIngestionService = new UrlIngestionService();
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
  });

  describe('WebScrapingService', () => {
    let webScrapingService: WebScrapingService;

    beforeEach(() => {
      webScrapingService = new WebScrapingService();
    });

    it('should identify supported domains', () => {
      const domains = webScrapingService.getSupportedDomains();
      expect(domains).toContain('allrecipes.com');
      expect(domains).toContain('*'); // Universal JSON-LD adapter
    });

    it('should handle valid URLs', () => {
      expect(webScrapingService.canHandle('https://www.allrecipes.com/recipe/123/test')).toBe(true);
      expect(webScrapingService.canHandle('https://example.com/recipe')).toBe(true);
      expect(webScrapingService.canHandle('invalid-url')).toBe(false);
    });

    it('should extract recipe from JSON-LD structured data', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test Recipe</title>
            <script type="application/ld+json">
            {
              "@type": "Recipe",
              "name": "Chocolate Chip Cookies",
              "description": "Delicious homemade cookies",
              "recipeIngredient": [
                "2 cups flour",
                "1 cup sugar",
                "1/2 cup butter"
              ],
              "recipeInstructions": [
                "Mix ingredients",
                "Bake for 10 minutes"
              ],
              "cookTime": "PT10M",
              "prepTime": "PT15M",
              "recipeYield": "24"
            }
            </script>
          </head>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(mockHtml),
      });

      const result = await webScrapingService.extractRecipe('https://example.com/recipe');



      expect(result.success).toBe(true);
      expect(result.recipe).toBeDefined();
      expect(result.recipe!.title).toBe('Chocolate Chip Cookies');
      expect(result.recipe!.ingredients).toHaveLength(3);
      expect(result.recipe!.instructions).toHaveLength(2);
      expect(result.recipe!.cookingTime).toBe(10);
      expect(result.recipe!.prepTime).toBe(15);
      expect(result.recipe!.servings).toBe(24);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await webScrapingService.extractRecipe('https://example.com/recipe');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('network');
    });

    it('should handle invalid HTML responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve('<html><title>No Recipe</title></html>'),
      });

      const result = await webScrapingService.extractRecipe('https://example.com/recipe');

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
    });
  });

  describe('UrlIngestionService', () => {
    it('should check URL support', () => {
      expect(urlIngestionService.canHandleUrl('https://www.allrecipes.com/recipe/123/test')).toBe(true);
      expect(urlIngestionService.canHandleUrl('invalid-url')).toBe(false);
    });

    it('should get supported domains', () => {
      const domains = urlIngestionService.getSupportedDomains();
      expect(domains).toContain('allrecipes.com');
    });

    it('should get adapter information', () => {
      const adapters = urlIngestionService.getAdapterInfo();
      expect(adapters).toHaveLength(5); // YouTube, TikTok, Instagram, AllRecipes + JsonLD adapters
      expect(adapters.some(a => a.name === 'YouTubeAdapter')).toBe(true);
      expect(adapters.some(a => a.name === 'TikTokAdapter')).toBe(true);
      expect(adapters.some(a => a.name === 'InstagramAdapter')).toBe(true);
      expect(adapters.some(a => a.name === 'AllRecipesAdapter')).toBe(true);
      expect(adapters.some(a => a.name === 'JsonLdAdapter')).toBe(true);
    });

    it('should preview recipe extraction', async () => {
      const mockHtml = `
        <html>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test Recipe",
            "recipeIngredient": ["1 cup flour"],
            "recipeInstructions": ["Mix well"]
          }
          </script>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(mockHtml),
      });

      const result = await urlIngestionService.previewFromUrl('https://example.com/recipe');

      expect(result.success).toBe(true);
      expect(result.extractedData).toBeDefined();
      expect(result.extractedData!.title).toBe('Test Recipe');
      expect(result.validationResult).toBeDefined();
    });
  });
});