import { BaseSourceAdapter } from './base-adapter';
import type { NormalizedContent, IngestionResult } from '../types';
import { VideoTranscriptionService, type VideoMetadata } from '../video-transcription-service';

export class TikTokAdapter extends BaseSourceAdapter {
  canHandle(url: string): boolean {
    const tiktokRegex = /^https?:\/\/(?:www\.)?(tiktok\.com\/@[\w.-]+\/video\/\d+|vm\.tiktok\.com\/[\w]+)/i;
    return tiktokRegex.test(url);
  }

  getSupportedDomains(): string[] {
    return ['tiktok.com', 'vm.tiktok.com', 'www.tiktok.com'];
  }

  protected async extractContent(html: string, url: string): Promise<NormalizedContent> {
    // Parse the HTML to extract video metadata
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const metadata = this.extractVideoMetadata(doc, url);
    
    // Try to extract recipe from metadata
    const recipeFromMetadata = VideoTranscriptionService.extractRecipeFromMetadata(metadata, url);
    
    if (recipeFromMetadata) {
      return recipeFromMetadata;
    }
    
    // If no recipe found in metadata, create a basic structure
    return {
      title: metadata.title || 'TikTok Recipe Video',
      description: metadata.description || 'Recipe video from TikTok',
      ingredients: ['See video caption or watch video for ingredients'],
      instructions: ['Follow along with the video for cooking instructions'],
      metadata: {
        author: metadata.author,
        publishedDate: metadata.publishedDate,
        categories: ['video-recipe'],
        tags: ['tiktok', 'video', 'short-form'],
      },
    };
  }

  private extractVideoMetadata(doc: Document, url: string): VideoMetadata {
    // Extract title from various possible locations
    let title = '';
    
    // Try meta property first
    const titleMeta = doc.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    if (titleMeta) {
      title = titleMeta.content;
    } else {
      // Try Twitter card title
      const twitterTitleMeta = doc.querySelector('meta[name="twitter:title"]') as HTMLMetaElement;
      if (twitterTitleMeta) {
        title = twitterTitleMeta.content;
      } else {
        // Fallback to page title
        const titleElement = doc.querySelector('title');
        if (titleElement) {
          title = titleElement.textContent || '';
        }
      }
    }
    
    // Extract description/caption
    let description = '';
    const descriptionMeta = doc.querySelector('meta[property="og:description"]') as HTMLMetaElement;
    if (descriptionMeta) {
      description = descriptionMeta.content;
    } else {
      const twitterDescMeta = doc.querySelector('meta[name="twitter:description"]') as HTMLMetaElement;
      if (twitterDescMeta) {
        description = twitterDescMeta.content;
      }
    }
    
    // Extract author/creator name
    let author = '';
    
    // Try to extract from URL pattern
    const urlMatch = url.match(/tiktok\.com\/@([\w.-]+)\//);
    if (urlMatch) {
      author = urlMatch[1];
    } else {
      // Try meta tags
      const authorMeta = doc.querySelector('meta[name="author"]') as HTMLMetaElement;
      if (authorMeta) {
        author = authorMeta.content;
      }
    }
    
    // Extract published date (TikTok doesn't always provide this in meta)
    let publishedDate: Date | undefined;
    const dateMeta = doc.querySelector('meta[property="article:published_time"]') as HTMLMetaElement;
    if (dateMeta) {
      publishedDate = new Date(dateMeta.content);
    }
    
    // Extract thumbnail
    let thumbnailUrl = '';
    const thumbnailMeta = doc.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    if (thumbnailMeta) {
      thumbnailUrl = thumbnailMeta.content;
    }
    
    return {
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      publishedDate,
      thumbnailUrl,
    };
  }

  async extract(url: string): Promise<IngestionResult> {
    try {
      if (!this.canHandle(url)) {
        return {
          success: false,
          error: {
            type: 'unsupported',
            message: 'URL is not a valid TikTok URL',
          },
        };
      }

      // Handle short URLs by following redirects
      const resolvedUrl = await this.resolveShortUrl(url);
      
      const html = await this.fetchHtml(resolvedUrl);
      const normalizedContent = await this.extractContent(html, resolvedUrl);
      
      // Convert to recipe format
      const recipe = {
        title: normalizedContent.title,
        description: normalizedContent.description,
        ingredients: normalizedContent.ingredients.map((ingredient, index) => ({
          name: ingredient,
          quantity: undefined,
          unit: undefined,
          notes: undefined,
        })),
        instructions: normalizedContent.instructions.map((instruction, index) => ({
          stepNumber: index + 1,
          description: instruction,
          duration: undefined,
        })),
        cookingTime: normalizedContent.metadata.cookingTime,
        prepTime: normalizedContent.metadata.prepTime,
        servings: normalizedContent.metadata.servings,
        difficulty: normalizedContent.metadata.difficulty as 'easy' | 'medium' | 'hard' | undefined,
        categories: normalizedContent.metadata.categories || [],
        tags: normalizedContent.metadata.tags || [],
        sourceUrl: resolvedUrl,
        sourceType: 'video' as const,
        author: normalizedContent.metadata.author,
        publishedDate: normalizedContent.metadata.publishedDate,
      };

      // Basic validation
      if (!recipe.title) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Could not extract video title or caption',
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
          type: error instanceof Error && error.name === 'NetworkError' ? 'network' : 'parsing',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
      };
    }
  }
  
  private async resolveShortUrl(url: string): Promise<string> {
    // If it's already a full URL, return as is
    if (url.includes('tiktok.com/@')) {
      return url;
    }
    
    // For vm.tiktok.com URLs, we need to follow the redirect
    if (url.includes('vm.tiktok.com')) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual',
        });
        
        const location = response.headers.get('location');
        if (location) {
          return location;
        }
      } catch (error) {
        // If redirect resolution fails, continue with original URL
        console.warn('Failed to resolve TikTok short URL:', error);
      }
    }
    
    return url;
  }
}