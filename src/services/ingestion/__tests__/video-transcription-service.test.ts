import { describe, it, expect } from 'vitest';
import { VideoTranscriptionService } from '../video-transcription-service';
import type { VideoMetadata } from '../video-transcription-service';

describe('VideoTranscriptionService', () => {
  describe('extractRecipeFromMetadata', () => {
    it('should extract recipe from video metadata with clear recipe content', () => {
      const metadata: VideoMetadata = {
        title: 'How to Make Chocolate Chip Cookies',
        description: `
          Ingredients:
          - 2 cups flour
          - 1 cup sugar
          - 1/2 cup butter
          - 2 eggs
          - 1 tsp vanilla
          
          Instructions:
          1. Preheat oven to 350°F
          2. Mix dry ingredients
          3. Add wet ingredients
          4. Bake for 12 minutes
        `,
        author: 'Chef John',
        publishedDate: new Date('2023-01-01'),
      };

      const result = VideoTranscriptionService.extractRecipeFromMetadata(metadata, 'https://youtube.com/watch?v=test');

      expect(result).not.toBeNull();
      expect(result!.title).toBe('How to Make Chocolate Chip Cookies');
      expect(result!.ingredients).toContain('2 cups flour');
      expect(result!.ingredients).toContain('1 cup sugar');
      expect(result!.instructions).toContain('Preheat oven to 350°F');
      expect(result!.instructions).toContain('Mix dry ingredients');
      expect(result!.metadata.author).toBe('Chef John');
    });

    it('should return null for non-recipe content', () => {
      const metadata: VideoMetadata = {
        title: 'My Daily Vlog',
        description: 'Just talking about my day and what I did.',
        author: 'Vlogger',
      };

      const result = VideoTranscriptionService.extractRecipeFromMetadata(metadata, 'https://youtube.com/watch?v=test');

      expect(result).toBeNull();
    });

    it('should extract categories from content', () => {
      const metadata: VideoMetadata = {
        title: 'Easy Baking Recipe for Beginners',
        description: 'Learn how to bake delicious cookies at home!',
        author: 'Baker',
      };

      const result = VideoTranscriptionService.extractRecipeFromMetadata(metadata, 'https://youtube.com/watch?v=test');

      expect(result).not.toBeNull();
      expect(result!.metadata.categories).toContain('baking');
    });

    it('should extract tags from hashtags and cooking terms', () => {
      const metadata: VideoMetadata = {
        title: 'Quick and Easy Healthy Recipe',
        description: 'A simple recipe that\'s #healthy #quick #homemade',
        author: 'HealthyChef',
      };

      const result = VideoTranscriptionService.extractRecipeFromMetadata(metadata, 'https://youtube.com/watch?v=test');

      expect(result).not.toBeNull();
      expect(result!.metadata.tags).toContain('healthy');
      expect(result!.metadata.tags).toContain('quick');
      expect(result!.metadata.tags).toContain('homemade');
      expect(result!.metadata.tags).toContain('easy');
    });

    it('should handle minimal recipe content', () => {
      const metadata: VideoMetadata = {
        title: 'Cooking pasta',
        description: 'Just boil water and add pasta. Cook for 10 minutes.',
        author: 'SimpleChef',
      };

      const result = VideoTranscriptionService.extractRecipeFromMetadata(metadata, 'https://youtube.com/watch?v=test');

      expect(result).not.toBeNull();
      expect(result!.title).toBe('Cooking pasta');
      // The service should extract cooking instructions from the description
      expect(result!.instructions.length).toBeGreaterThan(0);
      expect(result!.instructions.some(instruction => 
        instruction.includes('boil') || instruction.includes('add') || instruction.includes('cook')
      )).toBe(true);
    });
  });

  describe('extractRecipeFromTranscription', () => {
    it('should combine metadata and transcription for better extraction', () => {
      const metadata: VideoMetadata = {
        title: 'Cooking Show',
        description: 'Today we make cookies',
        author: 'Chef',
      };

      const transcription = {
        text: `
          So first we need flour, about 2 cups of it.
          Then add sugar, maybe 1 cup.
          Mix everything together.
          Bake at 350 degrees for about 12 minutes.
        `,
      };

      const result = VideoTranscriptionService.extractRecipeFromTranscription(
        transcription,
        metadata,
        'https://youtube.com/watch?v=test'
      );

      expect(result).not.toBeNull();
      expect(result!.title).toBe('Cooking Show');
      // The service should extract cooking instructions from the transcription
      expect(result!.instructions.length).toBeGreaterThan(0);
      expect(result!.instructions.some(instruction => 
        instruction.includes('Mix') || instruction.includes('Bake')
      )).toBe(true);
    });
  });
});