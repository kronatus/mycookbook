import type { SourceAdapter, IngestionResult, WebScrapingOptions } from './types';
import { AllRecipesAdapter } from './source-adapters/allrecipes-adapter';
import { JsonLdAdapter } from './source-adapters/json-ld-adapter';
import { YouTubeAdapter } from './source-adapters/youtube-adapter';
import { TikTokAdapter } from './source-adapters/tiktok-adapter';
import { InstagramAdapter } from './source-adapters/instagram-adapter';

export interface WebScrapingServiceOptions {
  timeout?: number;
  userAgent?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export class WebScrapingService {
  private adapters: SourceAdapter[] = [];
  private options: Required<WebScrapingServiceOptions>;

  constructor(options: WebScrapingServiceOptions = {}) {
    this.options = {
      timeout: options.timeout || 10000,
      userAgent: options.userAgent || 'Mozilla/5.0 (compatible; PersonalCookbook/1.0)',
      maxRetries: options.maxRetries || 2,
      retryDelay: options.retryDelay || 1000,
    };

    // Register default adapters
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    // Register adapters in order of preference
    // More specific adapters should come first
    this.adapters = [
      new YouTubeAdapter(),
      new TikTokAdapter(),
      new InstagramAdapter(),
      new AllRecipesAdapter(),
      new JsonLdAdapter(), // Universal fallback adapter
    ];
  }

  /**
   * Register a custom source adapter
   */
  registerAdapter(adapter: SourceAdapter): void {
    // Insert before the universal JsonLdAdapter (keep it as fallback)
    const jsonLdIndex = this.adapters.findIndex(a => a instanceof JsonLdAdapter);
    if (jsonLdIndex !== -1) {
      this.adapters.splice(jsonLdIndex, 0, adapter);
    } else {
      this.adapters.push(adapter);
    }
  }

  /**
   * Extract recipe from a URL
   */
  async extractRecipe(url: string): Promise<IngestionResult> {
    // Validate URL
    if (!this.isValidUrl(url)) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: 'Invalid URL provided',
        },
      };
    }

    // Find appropriate adapter
    const adapter = this.findAdapter(url);
    if (!adapter) {
      return {
        success: false,
        error: {
          type: 'unsupported',
          message: 'No adapter found for this URL',
          details: { url, supportedDomains: this.getSupportedDomains() },
        },
      };
    }

    // Extract with retries
    return this.extractWithRetries(adapter, url);
  }

  /**
   * Check if a URL is supported by any registered adapter
   */
  canHandle(url: string): boolean {
    if (!this.isValidUrl(url)) {
      return false;
    }

    return this.adapters.some(adapter => adapter.canHandle(url));
  }

  /**
   * Get all supported domains from registered adapters
   */
  getSupportedDomains(): string[] {
    const domains = new Set<string>();
    
    for (const adapter of this.adapters) {
      const adapterDomains = adapter.getSupportedDomains();
      adapterDomains.forEach(domain => domains.add(domain));
    }
    
    return Array.from(domains);
  }

  /**
   * Get information about registered adapters
   */
  getAdapterInfo(): Array<{ name: string; domains: string[] }> {
    return this.adapters.map(adapter => ({
      name: adapter.constructor.name,
      domains: adapter.getSupportedDomains(),
    }));
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private findAdapter(url: string): SourceAdapter | null {
    return this.adapters.find(adapter => adapter.canHandle(url)) || null;
  }

  private async extractWithRetries(adapter: SourceAdapter, url: string): Promise<IngestionResult> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = await adapter.extract(url);
        
        // If successful or it's a validation/parsing error (not worth retrying), return immediately
        if (result.success || 
            (result.error?.type === 'validation' || result.error?.type === 'parsing' || result.error?.type === 'unsupported')) {
          return result;
        }

        lastError = result.error;
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < this.options.maxRetries) {
          await this.delay(this.options.retryDelay * attempt); // Exponential backoff
        }
      } catch (error) {
        lastError = error;
        
        // If this isn't the last attempt, wait before retrying
        if (attempt < this.options.maxRetries) {
          await this.delay(this.options.retryDelay * attempt);
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: {
        type: 'network',
        message: `Failed to extract recipe after ${this.options.maxRetries} attempts`,
        details: lastError,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}