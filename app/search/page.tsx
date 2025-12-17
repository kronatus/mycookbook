'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { SearchInterface } from '@/components/SearchInterface';
import { RecipeCard } from '@/components/RecipeCard';
import type { Recipe } from '@/db';

interface SearchResult {
  recipe: Recipe;
  rank: number;
  highlights: {
    title?: string;
    description?: string;
    ingredients?: string[];
    instructions?: string[];
  };
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [showHighlights, setShowHighlights] = useState(true);

  // Fetch search results
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}&highlights=${showHighlights}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to search your recipes');
        }
        throw new Error('Failed to search recipes');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    // Update URL with search parameter
    const params = new URLSearchParams();
    if (term.trim()) {
      params.set('q', term.trim());
    }
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    router.replace(newUrl);
    
    performSearch(term);
  };

  // Perform initial search if there's a query parameter
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Search Recipes
          </h1>
          <p className="text-gray-600">
            Find recipes by ingredients, titles, or instructions
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search Interface */}
          <div className="space-y-4">
            <SearchInterface
              searchTerm={searchTerm}
              onSearch={handleSearch}
              placeholder="Search recipes by title, ingredients, or instructions..."
              enableServerSuggestions={true}
            />
            
            {/* Search Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showHighlights}
                    onChange={(e) => {
                      setShowHighlights(e.target.checked);
                      if (searchTerm.trim()) {
                        performSearch(searchTerm);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Show highlights</span>
                </label>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {error ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Search Error
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => performSearch(searchTerm)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim() ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {searchResults.length > 0 
                    ? `Found ${searchResults.length} recipe${searchResults.length !== 1 ? 's' : ''} for "${searchTerm}"`
                    : `No recipes found for "${searchTerm}"`
                  }
                </p>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-6">
                  {searchResults.map((result) => (
                    <div key={result.recipe.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Recipe Card */}
                        <div className="lg:w-1/2">
                          <RecipeCard recipe={result.recipe} />
                        </div>
                        
                        {/* Search Highlights */}
                        {showHighlights && (result.highlights.title || result.highlights.description || 
                         result.highlights.ingredients?.length || result.highlights.instructions?.length) && (
                          <div className="lg:w-1/2 space-y-4">
                            <h4 className="text-sm font-medium text-gray-900">Search Matches</h4>
                            
                            {result.highlights.title && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Title:</p>
                                <p 
                                  className="text-sm text-gray-700"
                                  dangerouslySetInnerHTML={{ __html: result.highlights.title }}
                                />
                              </div>
                            )}
                            
                            {result.highlights.description && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Description:</p>
                                <p 
                                  className="text-sm text-gray-700"
                                  dangerouslySetInnerHTML={{ __html: result.highlights.description }}
                                />
                              </div>
                            )}
                            
                            {result.highlights.ingredients && result.highlights.ingredients.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {result.highlights.ingredients.slice(0, 3).map((ingredient, idx) => (
                                    <li 
                                      key={idx}
                                      dangerouslySetInnerHTML={{ __html: ingredient }}
                                    />
                                  ))}
                                  {result.highlights.ingredients.length > 3 && (
                                    <li className="text-xs text-gray-500">
                                      +{result.highlights.ingredients.length - 3} more matches
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                            
                            {result.highlights.instructions && result.highlights.instructions.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Instructions:</p>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {result.highlights.instructions.slice(0, 2).map((instruction, idx) => (
                                    <li 
                                      key={idx}
                                      dangerouslySetInnerHTML={{ __html: instruction }}
                                    />
                                  ))}
                                  {result.highlights.instructions.length > 2 && (
                                    <li className="text-xs text-gray-500">
                                      +{result.highlights.instructions.length - 2} more matches
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                            
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                Relevance score: {(result.rank * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    No recipes found
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Try different keywords or check your spelling. You can search by recipe title, ingredients, or cooking instructions.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="mb-2">Search tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Try searching for specific ingredients like &quot;chicken&quot; or &quot;tomato&quot;</li>
                      <li>Search for cooking methods like &quot;baked&quot; or &quot;grilled&quot;</li>
                      <li>Look for cuisine types like &quot;italian&quot; or &quot;mexican&quot;</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Start searching
              </h2>
              <p className="text-gray-600 mb-6">
                Enter keywords to find recipes in your collection
              </p>
              <div className="text-sm text-gray-500">
                <p className="mb-2">You can search by:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Recipe titles</li>
                  <li>Ingredient names</li>
                  <li>Cooking instructions</li>
                  <li>Recipe descriptions</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading search...</div>
        </main>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
