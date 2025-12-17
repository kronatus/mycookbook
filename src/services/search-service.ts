import { db } from '../db/connection';
import { recipes, searchHistory } from '../db/schema';
import { eq, and, sql, desc, or } from 'drizzle-orm';
import type { Recipe, SearchHistory } from '../db/schema';

export interface SearchResult {
  recipe: Recipe;
  rank: number;
  highlights: {
    title?: string;
    description?: string;
    ingredients?: string[];
    instructions?: string[];
  };
}

export interface SearchSuggestion {
  suggestion: string;
  source: 'history' | 'ingredient' | 'category' | 'tag';
  frequency: number;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  includeHighlights?: boolean;
}

export class SearchService {
  /**
   * Perform full-text search using PostgreSQL tsvector
   */
  async searchRecipes(
    userId: string, 
    searchTerm: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { limit = 50, offset = 0, includeHighlights = true } = options;

    if (!searchTerm.trim()) {
      return [];
    }

    // Record search in history
    await this.recordSearch(userId, searchTerm.trim());

    // Prepare search query - handle phrases and individual terms
    const tsQuery = this.prepareTsQuery(searchTerm);

    const searchResults = await db
      .select({
        recipe: recipes,
        rank: sql<number>`ts_rank(${recipes.searchVector}, to_tsquery('english', ${tsQuery}))`,
        titleHighlight: includeHighlights 
          ? sql<string>`ts_headline('english', ${recipes.title}, to_tsquery('english', ${tsQuery}), 'MaxWords=10, MinWords=1, ShortWord=3, HighlightAll=false, MaxFragments=1')`
          : sql<string>`NULL`,
        descriptionHighlight: includeHighlights 
          ? sql<string>`ts_headline('english', COALESCE(${recipes.description}, ''), to_tsquery('english', ${tsQuery}), 'MaxWords=15, MinWords=1, ShortWord=3, HighlightAll=false, MaxFragments=1')`
          : sql<string>`NULL`,
      })
      .from(recipes)
      .where(
        and(
          eq(recipes.userId, userId),
          sql`${recipes.searchVector} @@ to_tsquery('english', ${tsQuery})`
        )
      )
      .orderBy(desc(sql`ts_rank(${recipes.searchVector}, to_tsquery('english', ${tsQuery}))`))
      .limit(limit)
      .offset(offset);

    // Process results and add ingredient/instruction highlights
    const results: SearchResult[] = [];
    
    for (const row of searchResults) {
      const highlights: SearchResult['highlights'] = {};
      
      if (includeHighlights) {
        // Add title and description highlights
        if (row.titleHighlight && row.titleHighlight !== row.recipe.title) {
          highlights.title = row.titleHighlight;
        }
        if (row.descriptionHighlight && row.descriptionHighlight !== (row.recipe.description || '')) {
          highlights.description = row.descriptionHighlight;
        }

        // Add ingredient highlights
        highlights.ingredients = this.highlightIngredients(row.recipe.ingredients, searchTerm);
        
        // Add instruction highlights
        highlights.instructions = this.highlightInstructions(row.recipe.instructions, searchTerm);
      }

      results.push({
        recipe: row.recipe,
        rank: row.rank,
        highlights,
      });
    }

    return results;
  }

  /**
   * Get search suggestions based on search history and recipe content
   */
  async getSearchSuggestions(
    userId: string, 
    partialTerm: string, 
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    if (!partialTerm.trim() || partialTerm.length < 2) {
      // Return recent search history if no partial term
      return await this.getRecentSearches(userId, limit);
    }

    const suggestions = await db.execute(
      sql`SELECT * FROM get_search_suggestions(${userId}, ${partialTerm}, ${limit})`
    );

    return suggestions.rows.map((row: any) => ({
      suggestion: row.suggestion,
      source: row.source as 'history' | 'ingredient' | 'category' | 'tag',
      frequency: row.frequency,
    }));
  }

  /**
   * Get recent search history for a user
   */
  async getRecentSearches(userId: string, limit: number = 10): Promise<SearchSuggestion[]> {
    const recentSearches = await db
      .select({
        searchTerm: searchHistory.searchTerm,
        searchCount: searchHistory.searchCount,
      })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.lastSearchedAt))
      .limit(limit);

    return recentSearches.map((search: { searchTerm: string; searchCount: number }) => ({
      suggestion: search.searchTerm,
      source: 'history' as const,
      frequency: search.searchCount,
    }));
  }

  /**
   * Clear search history for a user
   */
  async clearSearchHistory(userId: string): Promise<void> {
    await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
  }

  /**
   * Record a search term in the user's search history
   */
  private async recordSearch(userId: string, searchTerm: string): Promise<void> {
    // Check if search term already exists
    const existing = await db
      .select()
      .from(searchHistory)
      .where(
        and(
          eq(searchHistory.userId, userId),
          eq(searchHistory.searchTerm, searchTerm)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(searchHistory)
        .set({
          searchCount: sql`${searchHistory.searchCount} + 1`,
          lastSearchedAt: new Date(),
        })
        .where(
          and(
            eq(searchHistory.userId, userId),
            eq(searchHistory.searchTerm, searchTerm)
          )
        );
    } else {
      // Insert new record
      await db.insert(searchHistory).values({
        userId,
        searchTerm,
        searchCount: 1,
        lastSearchedAt: new Date(),
        createdAt: new Date(),
      });
    }
  }

  /**
   * Prepare PostgreSQL tsquery from user input
   */
  private prepareTsQuery(searchTerm: string): string {
    // Clean and prepare the search term
    const cleaned = searchTerm
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleaned) {
      return '';
    }

    // Split into words and create OR query for better matching
    const words = cleaned.split(' ').filter(word => word.length > 0);
    
    if (words.length === 1) {
      // Single word - use prefix matching
      return `${words[0]}:*`;
    } else {
      // Multiple words - create OR query with prefix matching
      return words.map(word => `${word}:*`).join(' | ');
    }
  }

  /**
   * Highlight matching terms in ingredients
   */
  private highlightIngredients(
    ingredients: Array<{ name: string; quantity?: number; unit?: string; notes?: string }>,
    searchTerm: string
  ): string[] {
    const highlights: string[] = [];
    const terms = searchTerm.toLowerCase().split(/\s+/);

    for (const ingredient of ingredients) {
      const name = ingredient.name.toLowerCase();
      const hasMatch = terms.some(term => name.includes(term.toLowerCase()));
      
      if (hasMatch) {
        let highlighted = ingredient.name;
        for (const term of terms) {
          const regex = new RegExp(`(${term})`, 'gi');
          highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        }
        highlights.push(highlighted);
      }
    }

    return highlights;
  }

  /**
   * Highlight matching terms in instructions
   */
  private highlightInstructions(
    instructions: Array<{ stepNumber: number; description: string; duration?: number }>,
    searchTerm: string
  ): string[] {
    const highlights: string[] = [];
    const terms = searchTerm.toLowerCase().split(/\s+/);

    for (const instruction of instructions) {
      const description = instruction.description.toLowerCase();
      const hasMatch = terms.some(term => description.includes(term.toLowerCase()));
      
      if (hasMatch) {
        let highlighted = instruction.description;
        for (const term of terms) {
          const regex = new RegExp(`(${term})`, 'gi');
          highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        }
        
        // Truncate long instructions for highlights
        if (highlighted.length > 150) {
          const firstMarkIndex = highlighted.indexOf('<mark>');
          const start = Math.max(0, firstMarkIndex - 50);
          const end = Math.min(highlighted.length, firstMarkIndex + 100);
          highlighted = (start > 0 ? '...' : '') + 
                       highlighted.substring(start, end) + 
                       (end < highlighted.length ? '...' : '');
        }
        
        highlights.push(`Step ${instruction.stepNumber}: ${highlighted}`);
      }
    }

    return highlights;
  }

  /**
   * Get search analytics for a user
   */
  async getSearchAnalytics(userId: string): Promise<{
    totalSearches: number;
    uniqueTerms: number;
    topSearches: Array<{ term: string; count: number }>;
  }> {
    const analytics = await db
      .select({
        totalSearches: sql<number>`SUM(${searchHistory.searchCount})`,
        uniqueTerms: sql<number>`COUNT(DISTINCT ${searchHistory.searchTerm})`,
      })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId));

    const topSearches = await db
      .select({
        term: searchHistory.searchTerm,
        count: searchHistory.searchCount,
      })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.searchCount))
      .limit(10);

    return {
      totalSearches: analytics[0]?.totalSearches || 0,
      uniqueTerms: analytics[0]?.uniqueTerms || 0,
      topSearches: topSearches.map((search: { term: string; count: number }) => ({
        term: search.term,
        count: search.count,
      })),
    };
  }
}