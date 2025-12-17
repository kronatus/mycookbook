import { BaseSourceAdapter } from './base-adapter';
import type { NormalizedContent, IngestionResult } from '../types';
import { VideoTranscriptionService, type VideoMetadata } from '../video-transcription-service';

export class InstagramAdapter extends BaseSourceAdapter {
  canHandle(url: string): boolean {
    const instagramRegex = /^https?:\/\/(?:www\.)?(instagram\.com\/(?:p|reel|tv)\/[\w-]+)/i;
    return instagramRegex.test(url);
  }

  getSupportedDomains(): string[] {
    return ['instagram.com', 'www.instagram.com'];
  }

  protected async extractContent(html: string, url: string): Promise<NormalizedContent> {
    // Parse the HTML to extract post metadata
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const metadata = this.extractPostMetadata(doc, url);
    
    // Try to extract recipe from metadata
    const recipeFromMetadata = VideoTranscriptionService.extractRecipeFromMetadata(metadata, url);
    
    if (recipeFromMetadata) {
      return recipeFromMetadata;
    }
    
    // If no recipe found in metadata, create a basic structure
    return {
      title: metadata.title || 'Instagram Recipe Post',
      description: metadata.description || 'Recipe post from Instagram',
      ingredients: ['See post caption or images for ingredients'],
      instructions: ['Follow the post content for cooking instructions'],
      metadata: {
        author: metadata.author,
        publishedDate: metadata.publishedDate,
        categories: ['social-media-recipe'],
        tags: ['instagram', 'social-media'],
      },
    };
  }

  private extractPostMetadata(doc: Document, url: string): VideoMetadata {
    // Extract title/caption from various possible locations
    let title = '';
    let description = '';
    
    // Try meta property first
    const titleMeta = doc.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    if (titleMeta) {
      title = titleMeta.content;
    }
    
    // Extract description/caption
    const descriptionMeta = doc.querySelector('meta[property="og:description"]') as HTMLMetaElement;
    if (descriptionMeta) {
      description = descriptionMeta.content;
    } else {
      const twitterDescMeta = doc.querySelector('meta[name="twitter:description"]') as HTMLMetaElement;
      if (twitterDescMeta) {
        description = twitterDescMeta.content;
      }
    }
    
    // If title is empty but description exists, use first part of description as title
    if (!title && description) {
      const firstSentence = description.split('.')[0];
      if (firstSentence.length < 100) {
        title = firstSentence;
      } else {
        title = description.substring(0, 50) + '...';
      }
    }
    
    // Extract author/username
    let author = '';
    
    // Try to extract from URL pattern
    const urlMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/);
    if (urlMatch) {
      // For Instagram, we can't easily get username from post URL
      // Try to find it in meta tags or page content
      const authorMeta = doc.querySelector('meta[name="author"]') as HTMLMetaElement;
      if (authorMeta) {
        author = authorMeta.content;
      } else {
        // Try to find username in the page title or description
        const pageTitle = doc.querySelector('title')?.textContent || '';
        const usernameMatch = pageTitle.match(/@([\w.-]+)/);
        if (usernameMatch) {
          author = usernameMatch[1];
        }
      }
    }
    
    // Extract published date
    let publishedDate: Date | undefined;
    const dateMeta = doc.querySelector('meta[property="article:published_time"]') as HTMLMetaElement;
    if (dateMeta) {
      publishedDate = new Date(dateMeta.content);
    }
    
    // Extract thumbnail/image
    let thumbnailUrl = '';
    const imageMeta = doc.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    if (imageMeta) {
      thumbnailUrl = imageMeta.content;
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
            message: 'URL is not a valid Instagram post URL',
          },
        };
      }

      const html = await this.fetchHtml(url);
      const normalizedContent = await this.extractContent(html, url);
      
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
        sourceUrl: url,
        sourceType: 'video' as const,
        author: normalizedContent.metadata.author,
        publishedDate: normalizedContent.metadata.publishedDate,
      };

      // Basic validation
      if (!recipe.title && !recipe.description) {
        return {
          success: false,
          error: {
            type: 'validation',
            message: 'Could not extract post content or caption',
          },
        };
      }

      // If no title, use description or create default
      if (!recipe.title) {
        recipe.title = recipe.description ? 
          (recipe.description.length > 50 ? recipe.description.substring(0, 50) + '...' : recipe.description) :
          'Instagram Recipe Post';
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
}