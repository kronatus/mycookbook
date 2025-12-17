import { BaseSourceAdapter } from './base-adapter';
import type { NormalizedContent, IngestionResult } from '../types';
import { VideoTranscriptionService, type VideoMetadata } from '../video-transcription-service';

export class YouTubeAdapter extends BaseSourceAdapter {
  canHandle(url: string): boolean {
    const youtubeRegex = /^https?:\/\/(?:www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/i;
    return youtubeRegex.test(url);
  }

  getSupportedDomains(): string[] {
    return ['youtube.com', 'youtu.be', 'm.youtube.com'];
  }

  protected async extractContent(html: string, url: string): Promise<NormalizedContent> {
    // Parse the HTML to extract video metadata
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const metadata = this.extractVideoMetadata(doc, url);
    
    // Try to extract recipe from metadata first
    const recipeFromMetadata = VideoTranscriptionService.extractRecipeFromMetadata(metadata, url);
    
    if (recipeFromMetadata) {
      return recipeFromMetadata;
    }
    
    // If no recipe found in metadata, create a basic structure
    return {
      title: metadata.title || 'YouTube Recipe Video',
      description: metadata.description || 'Recipe video from YouTube',
      ingredients: ['See video description or watch video for ingredients'],
      instructions: ['Follow along with the video for cooking instructions'],
      metadata: {
        author: metadata.author,
        publishedDate: metadata.publishedDate,
        categories: ['video-recipe'],
        tags: ['youtube', 'video'],
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
      // Fallback to page title
      const titleElement = doc.querySelector('title');
      if (titleElement) {
        title = titleElement.textContent?.replace(' - YouTube', '') || '';
      }
    }
    
    // Extract description
    let description = '';
    const descriptionMeta = doc.querySelector('meta[property="og:description"]') as HTMLMetaElement;
    if (descriptionMeta) {
      description = descriptionMeta.content;
    } else {
      const descriptionElement = doc.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (descriptionElement) {
        description = descriptionElement.content;
      }
    }
    
    // Extract author/channel name
    let author = '';
    const authorMeta = doc.querySelector('meta[name="author"]') as HTMLMetaElement;
    if (authorMeta) {
      author = authorMeta.content;
    } else {
      // Try to find channel name in the page
      const channelLink = doc.querySelector('link[itemprop="name"]') as HTMLLinkElement;
      if (channelLink) {
        author = channelLink.getAttribute('content') || '';
      }
    }
    
    // Extract published date
    let publishedDate: Date | undefined;
    const dateMeta = doc.querySelector('meta[itemprop="datePublished"]') as HTMLMetaElement;
    if (dateMeta) {
      publishedDate = new Date(dateMeta.content);
    }
    
    // Extract duration
    let duration: number | undefined;
    const durationMeta = doc.querySelector('meta[itemprop="duration"]') as HTMLMetaElement;
    if (durationMeta) {
      duration = this.parseDuration(durationMeta.content);
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
      duration,
      thumbnailUrl,
    };
  }
  
  private parseDuration(durationString: string): number | undefined {
    // Parse ISO 8601 duration format (PT1M30S = 1 minute 30 seconds)
    const match = durationString.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      return hours * 3600 + minutes * 60 + seconds;
    }
    return undefined;
  }

  async extract(url: string): Promise<IngestionResult> {
    try {
      if (!this.canHandle(url)) {
        return {
          success: false,
          error: {
            type: 'unsupported',
            message: 'URL is not a valid YouTube URL',
          },
        };
      }

      // Normalize YouTube URL to standard format
      const normalizedUrl = this.normalizeYouTubeUrl(url);
      
      const html = await this.fetchHtml(normalizedUrl);
      const normalizedContent = await this.extractContent(html, normalizedUrl);
      
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
        sourceUrl: normalizedUrl,
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
            message: 'Could not extract video title',
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
  
  private normalizeYouTubeUrl(url: string): string {
    // Convert various YouTube URL formats to standard watch URL
    const videoIdRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/;
    const match = url.match(videoIdRegex);
    
    if (match) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
    
    return url;
  }
}