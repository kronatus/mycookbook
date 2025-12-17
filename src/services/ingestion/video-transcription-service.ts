import type { NormalizedContent } from './types';

export interface VideoMetadata {
  title: string;
  description: string;
  duration?: number;
  author?: string;
  publishedDate?: Date;
  thumbnailUrl?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export class VideoTranscriptionService {
  /**
   * Extract recipe content from video metadata and description
   */
  static extractRecipeFromMetadata(metadata: VideoMetadata, url: string): NormalizedContent | null {
    const { title, description, author, publishedDate } = metadata;
    
    // Look for recipe indicators in title and description
    const recipeIndicators = [
      'recipe', 'cooking', 'baking', 'how to make', 'ingredients',
      'cook', 'bake', 'prepare', 'dish', 'food', 'kitchen'
    ];
    
    const combinedText = `${title} ${description}`.toLowerCase();
    const hasRecipeIndicators = recipeIndicators.some(indicator => 
      combinedText.includes(indicator)
    );
    
    if (!hasRecipeIndicators) {
      return null;
    }
    
    // Extract ingredients from description
    const ingredients = this.extractIngredients(description);
    
    // Extract instructions from description
    const instructions = this.extractInstructions(description);
    
    // If we can't find ingredients or instructions, but we have recipe indicators, 
    // create a basic recipe structure
    if (ingredients.length === 0 && instructions.length === 0) {
      // Try to extract any cooking-related content from the description
      const sentences = description.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
      if (sentences.length > 0) {
        instructions.push(...sentences);
      } else {
        return null;
      }
    }
    
    return {
      title: title || 'Video Recipe',
      description: description,
      ingredients: ingredients.length > 0 ? ingredients : ['See video for ingredients'],
      instructions: instructions.length > 0 ? instructions : ['Follow along with the video'],
      metadata: {
        author,
        publishedDate,
        categories: this.extractCategories(combinedText),
        tags: this.extractTags(combinedText),
      },
    };
  }
  
  /**
   * Extract ingredients from text using common patterns
   */
  private static extractIngredients(text: string): string[] {
    const ingredients: string[] = [];
    
    // Look for ingredient sections
    const ingredientSectionRegex = /(?:ingredients?|what you need|shopping list|you'll need):?\s*\n?(.*?)(?:\n\n|instructions?|directions?|method|steps?|$)/i;
    const match = text.match(ingredientSectionRegex);
    
    if (match) {
      const ingredientText = match[1];
      
      // Split by lines and clean up
      const lines = ingredientText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.match(/^(instructions?|directions?|method|steps?)/i));
      
      // Look for bullet points, numbers, or dashes
      lines.forEach(line => {
        const cleaned = line.replace(/^[-•*\d+.)]\s*/, '').trim();
        if (cleaned.length > 0 && cleaned.length < 200) { // Reasonable ingredient length
          ingredients.push(cleaned);
        }
      });
    }
    
    // If no structured ingredients found, look for common ingredient patterns
    if (ingredients.length === 0) {
      const commonIngredients = [
        'flour', 'sugar', 'butter', 'eggs', 'milk', 'salt', 'pepper',
        'oil', 'onion', 'garlic', 'tomato', 'cheese', 'chicken', 'beef',
        'rice', 'pasta', 'bread', 'water', 'vanilla', 'baking powder'
      ];
      
      const foundIngredients = new Set<string>();
      commonIngredients.forEach(ingredient => {
        const regex = new RegExp(`\\b\\d+.*?${ingredient}s?\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          matches.forEach(match => foundIngredients.add(match.trim()));
        }
      });
      
      const ingredientArray = Array.from(foundIngredients);
      ingredients.push(...ingredientArray);
    }
    
    return ingredients;
  }
  
  /**
   * Extract instructions from text using common patterns
   */
  private static extractInstructions(text: string): string[] {
    const instructions: string[] = [];
    
    // Look for instruction sections
    const instructionSectionRegex = /(?:instructions?|directions?|method|steps?|how to):?\s*\n?(.*?)(?:\n\n|ingredients?|$)/i;
    const match = text.match(instructionSectionRegex);
    
    if (match) {
      const instructionText = match[1];
      
      // Split by lines and clean up
      const lines = instructionText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      lines.forEach(line => {
        const cleaned = line.replace(/^[-•*\d+.)]\s*/, '').trim();
        if (cleaned.length > 10) { // Reasonable instruction length
          instructions.push(cleaned);
        }
      });
    }
    
    // Look for numbered steps in the entire text
    if (instructions.length === 0) {
      const stepRegex = /(?:^|\n)\s*(\d+)[.)]\s*([^\n]+)/g;
      let stepMatch;
      
      while ((stepMatch = stepRegex.exec(text)) !== null) {
        const step = stepMatch[2].trim();
        if (step.length > 10) {
          instructions.push(step);
        }
      }
    }
    
    // If still no instructions, look for cooking action words
    if (instructions.length === 0) {
      const cookingActions = ['mix', 'bake', 'cook', 'boil', 'fry', 'sauté', 'roast', 'grill', 'add', 'combine', 'stir', 'heat', 'preheat'];
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
      
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        if (cookingActions.some(action => lowerSentence.includes(action))) {
          instructions.push(sentence);
        }
      });
    }
    
    return instructions;
  }
  
  /**
   * Extract categories from text
   */
  private static extractCategories(text: string): string[] {
    const categories: string[] = [];
    
    const categoryKeywords = {
      'baking': ['bake', 'baking', 'cake', 'cookies', 'bread', 'pastry', 'dessert'],
      'cooking': ['cook', 'cooking', 'fry', 'sauté', 'roast', 'grill', 'stir-fry'],
      'breakfast': ['breakfast', 'morning', 'pancake', 'waffle', 'cereal', 'toast'],
      'lunch': ['lunch', 'sandwich', 'salad', 'soup'],
      'dinner': ['dinner', 'main course', 'entree', 'supper'],
      'dessert': ['dessert', 'sweet', 'cake', 'ice cream', 'chocolate'],
      'appetizer': ['appetizer', 'starter', 'snack', 'finger food'],
    };
    
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        categories.push(category);
      }
    });
    
    return categories;
  }
  
  /**
   * Extract tags from text
   */
  private static extractTags(text: string): string[] {
    const tags: string[] = [];
    
    // Look for hashtags
    const hashtagRegex = /#(\w+)/g;
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
      tags.push(match[1].toLowerCase());
    }
    
    // Look for common cooking terms
    const cookingTerms = [
      'quick', 'easy', 'healthy', 'vegetarian', 'vegan', 'gluten-free',
      'dairy-free', 'low-carb', 'keto', 'paleo', 'spicy', 'mild',
      'comfort food', 'homemade', 'traditional', 'fusion'
    ];
    
    cookingTerms.forEach(term => {
      if (text.includes(term)) {
        tags.push(term.replace(' ', '-'));
      }
    });
    
    return Array.from(new Set(tags)); // Remove duplicates
  }
  
  /**
   * Process transcription text to extract recipe information
   */
  static extractRecipeFromTranscription(transcription: TranscriptionResult, metadata: VideoMetadata, url: string): NormalizedContent | null {
    const combinedText = `${metadata.title} ${metadata.description} ${transcription.text}`;
    
    // Use the same extraction logic but with more text
    const ingredients = this.extractIngredients(combinedText);
    const instructions = this.extractInstructions(combinedText);
    
    if (ingredients.length === 0 && instructions.length === 0) {
      return null;
    }
    
    return {
      title: metadata.title || 'Video Recipe',
      description: metadata.description,
      ingredients: ingredients.length > 0 ? ingredients : ['See video for ingredients'],
      instructions: instructions.length > 0 ? instructions : ['Follow along with the video'],
      metadata: {
        author: metadata.author,
        publishedDate: metadata.publishedDate,
        categories: this.extractCategories(combinedText),
        tags: this.extractTags(combinedText),
      },
    };
  }
}