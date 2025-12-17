import type { RecipeSection } from './types';

export class ContentParser {
  // Common recipe section headers
  private readonly RECIPE_INDICATORS = [
    'recipe', 'ingredients', 'instructions', 'directions', 'method',
    'preparation', 'cooking', 'baking', 'serves', 'servings', 'yield'
  ];

  // Common ingredient indicators
  private readonly INGREDIENT_INDICATORS = [
    'ingredients', 'you will need', 'shopping list', 'what you need'
  ];

  // Common instruction indicators
  private readonly INSTRUCTION_INDICATORS = [
    'instructions', 'directions', 'method', 'steps', 'preparation',
    'how to make', 'cooking method', 'procedure'
  ];

  // Recipe title patterns
  private readonly TITLE_PATTERNS = [
    /^(.+?)\s*recipe$/i,
    /^recipe\s*:\s*(.+)$/i,
    /^(.+?)\s*-\s*recipe$/i,
    /^(.+?)\s*\(recipe\)$/i
  ];

  /**
   * Identify recipe sections within a document text
   */
  identifyRecipeSections(text: string): RecipeSection[] {
    const sections: RecipeSection[] = [];
    
    // Split text into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    // Try to identify complete recipes
    const recipes = this.findCompleteRecipes(paragraphs);
    
    if (recipes.length > 0) {
      return recipes;
    }

    // Fallback: try to identify any recipe-like content
    const recipeContent = this.findRecipeContent(text);
    if (recipeContent) {
      sections.push({
        title: this.extractTitle(recipeContent) || 'Recipe',
        content: recipeContent,
        startIndex: 0,
        endIndex: recipeContent.length,
        confidence: 0.6
      });
    }

    return sections;
  }

  /**
   * Find complete recipes with clear structure
   */
  private findCompleteRecipes(paragraphs: string[]): RecipeSection[] {
    const recipes: RecipeSection[] = [];
    let currentRecipe: { title?: string; content: string[]; startIndex: number } | null = null;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      
      // Check if this paragraph looks like a recipe title
      if (this.isRecipeTitle(paragraph)) {
        // Save previous recipe if exists
        if (currentRecipe && currentRecipe.content.length > 0) {
          const content = currentRecipe.content.join('\n\n');
          if (this.hasRecipeStructure(content)) {
            recipes.push({
              title: currentRecipe.title || 'Recipe',
              content,
              startIndex: currentRecipe.startIndex,
              endIndex: currentRecipe.startIndex + content.length,
              confidence: 0.8
            });
          }
        }
        
        // Start new recipe
        currentRecipe = {
          title: this.cleanTitle(paragraph),
          content: [],
          startIndex: i
        };
      } else if (currentRecipe) {
        // Add content to current recipe
        currentRecipe.content.push(paragraph);
      } else if (this.containsRecipeIndicators(paragraph)) {
        // Start a recipe without a clear title
        currentRecipe = {
          content: [paragraph],
          startIndex: i
        };
      }
    }
    
    // Don't forget the last recipe
    if (currentRecipe && currentRecipe.content.length > 0) {
      const content = currentRecipe.content.join('\n\n');
      if (this.hasRecipeStructure(content)) {
        recipes.push({
          title: currentRecipe.title || 'Recipe',
          content,
          startIndex: currentRecipe.startIndex,
          endIndex: currentRecipe.startIndex + content.length,
          confidence: 0.8
        });
      }
    }
    
    return recipes;
  }

  /**
   * Find any recipe-like content as fallback
   */
  private findRecipeContent(text: string): string | null {
    // Look for sections with ingredients and instructions
    const hasIngredients = this.INGREDIENT_INDICATORS.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
    
    const hasInstructions = this.INSTRUCTION_INDICATORS.some(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasIngredients && hasInstructions) {
      return text;
    }
    
    return null;
  }

  /**
   * Check if a paragraph looks like a recipe title
   */
  private isRecipeTitle(paragraph: string): boolean {
    const text = paragraph.toLowerCase().trim();
    
    // Check for explicit recipe patterns
    if (this.TITLE_PATTERNS.some(pattern => pattern.test(text))) {
      return true;
    }
    
    // Check for recipe-like titles (short, descriptive)
    if (text.length < 100 && text.length > 5) {
      const words = text.split(/\s+/);
      if (words.length <= 8) {
        // Check if it contains food-related words or cooking terms
        const foodWords = ['chicken', 'beef', 'pasta', 'cake', 'bread', 'soup', 'salad', 'pie', 'cookies'];
        const cookingWords = ['baked', 'grilled', 'roasted', 'fried', 'steamed', 'sauteed'];
        
        const hasFoodWords = foodWords.some(word => text.includes(word));
        const hasCookingWords = cookingWords.some(word => text.includes(word));
        
        if (hasFoodWords || hasCookingWords) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if text contains recipe indicators
   */
  private containsRecipeIndicators(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.RECIPE_INDICATORS.some(indicator => 
      lowerText.includes(indicator.toLowerCase())
    );
  }

  /**
   * Check if content has recipe structure (ingredients + instructions)
   */
  private hasRecipeStructure(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    const hasIngredients = this.INGREDIENT_INDICATORS.some(indicator => 
      lowerContent.includes(indicator.toLowerCase())
    );
    
    const hasInstructions = this.INSTRUCTION_INDICATORS.some(indicator => 
      lowerContent.includes(indicator.toLowerCase())
    );
    
    // Also check for list-like structures (numbered or bulleted)
    const hasLists = /^\s*[\d\-\*\•]\s+/m.test(content);
    
    return (hasIngredients && hasInstructions) || (hasLists && (hasIngredients || hasInstructions));
  }

  /**
   * Extract title from recipe content
   */
  private extractTitle(content: string): string | null {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) return null;
    
    // Check first few lines for title patterns
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      
      if (this.isRecipeTitle(line)) {
        return this.cleanTitle(line);
      }
    }
    
    // Fallback: use first line if it's not too long and doesn't look like ingredients/instructions
    const firstLine = lines[0];
    if (firstLine.length < 100 && !this.containsRecipeIndicators(firstLine)) {
      return this.cleanTitle(firstLine);
    }
    
    return null;
  }

  /**
   * Clean and format recipe title
   */
  private cleanTitle(title: string): string {
    // Remove common prefixes/suffixes
    let cleaned = title.trim();
    
    // Remove "Recipe:" prefix
    cleaned = cleaned.replace(/^recipe\s*:\s*/i, '');
    
    // Remove "Recipe" suffix
    cleaned = cleaned.replace(/\s*recipe\s*$/i, '');
    
    // Remove parenthetical "(recipe)"
    cleaned = cleaned.replace(/\s*\(recipe\)\s*$/i, '');
    
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    
    return cleaned;
  }

  /**
   * Separate multiple recipes from a single text
   */
  separateMultipleRecipes(text: string): string[] {
    const sections = this.identifyRecipeSections(text);
    return sections.map(section => section.content);
  }

  /**
   * Get confidence score for recipe identification
   */
  getConfidenceScore(text: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // Check for ingredients section
    if (this.INGREDIENT_INDICATORS.some(indicator => lowerText.includes(indicator))) {
      score += 0.3;
    }
    
    // Check for instructions section
    if (this.INSTRUCTION_INDICATORS.some(indicator => lowerText.includes(indicator))) {
      score += 0.3;
    }
    
    // Check for list structures
    if (/^\s*[\d\-\*\•]\s+/m.test(text)) {
      score += 0.2;
    }
    
    // Check for cooking terms
    const cookingTerms = ['cook', 'bake', 'fry', 'boil', 'mix', 'stir', 'heat', 'serve'];
    const foundTerms = cookingTerms.filter(term => lowerText.includes(term));
    score += Math.min(foundTerms.length * 0.05, 0.2);
    
    return Math.min(score, 1.0);
  }
}