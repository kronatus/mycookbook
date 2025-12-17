import type { SourceAdapter, IngestionResult, NormalizedContent, WebScrapingOptions } from '../types';
import { ContentNormalizer } from '../content-normalizer';

export abstract class BaseSourceAdapter implements SourceAdapter {
  protected defaultOptions: WebScrapingOptions = {
    timeout: 10000,
    userAgent: 'Mozilla/5.0 (compatible; PersonalCookbook/1.0)',
    followRedirects: true,
    maxRedirects: 5,
  };

  abstract canHandle(url: string): boolean;
  abstract getSupportedDomains(): string[];
  protected abstract extractContent(html: string, url: string): Promise<NormalizedContent>;

  async extract(url: string): Promise<IngestionResult> {
    try {
      if (!this.canHandle(url)) {
        return {
          success: false,
          error: {
            type: 'unsupported',
            message: `URL not supported by ${this.constructor.name}`,
          },
        };
      }

      const html = await this.fetchHtml(url);
      const normalizedContent = await this.extractContent(html, url);
      const recipe = ContentNormalizer.normalize(normalizedContent, url);

      // Basic validation
      if (!recipe.title || recipe.ingredients.length === 0 || recipe.instructions.length === 0) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Extracted recipe is missing required fields (title, ingredients, or instructions)',
          },
        };
      }

      return {
        success: true,
        recipe,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: error instanceof NetworkError ? 'network' : 'parsing',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
      };
    }
  }

  protected async fetchHtml(url: string, options?: WebScrapingOptions): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': opts.userAgent!,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        redirect: opts.followRedirects ? 'follow' : 'manual',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/html')) {
        throw new NetworkError('Response is not HTML content');
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${opts.timeout}ms`);
      }
      
      if (error instanceof NetworkError) {
        throw error;
      }
      
      throw new NetworkError(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected extractTextContent(element: Element | null): string {
    if (!element) return '';
    return element.textContent?.trim() || '';
  }

  protected extractAllTextContent(elements: NodeListOf<Element> | Element[]): string[] {
    const elementsArray = Array.from(elements);
    return elementsArray
      .map(el => this.extractTextContent(el))
      .filter(text => text.length > 0);
  }

  protected parseServings(text: string): number | undefined {
    const servingsRegex = /(\d+)\s*(?:servings?|portions?|people|serves)/i;
    const match = text.match(servingsRegex);
    return match ? parseInt(match[1]) : undefined;
  }

  protected parseTime(text: string): number | undefined {
    // Parse time in various formats
    const timeRegex = /(\d+)\s*(minutes?|mins?|hours?|hrs?)/i;
    const match = text.match(timeRegex);
    
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.startsWith('hour') || unit.startsWith('hr')) {
        return amount * 60;
      }
      
      return amount;
    }
    
    return undefined;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}