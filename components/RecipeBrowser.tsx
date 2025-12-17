'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchInterface } from './SearchInterface';
import { RecipeFilters } from './RecipeFilters';
import { RecipeCard } from './RecipeCard';
import type { Recipe } from '@/db';

interface RecipeFiltersState {
  categories: string[];
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  maxCookingTime?: number;
  maxPrepTime?: number;
}

export function RecipeBrowser() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<RecipeFiltersState>({
    categories: [],
    tags: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch recipes based on current search term and filters
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Add search parameter
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      // Add filter parameters
      if (filters.categories.length > 0) {
        params.append('categories', filters.categories.join(','));
      }
      if (filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }
      if (filters.difficulty) {
        params.append('difficulty', filters.difficulty);
      }
      if (filters.maxCookingTime) {
        params.append('maxCookingTime', filters.maxCookingTime.toString());
      }
      if (filters.maxPrepTime) {
        params.append('maxPrepTime', filters.maxPrepTime.toString());
      }

      const response = await fetch(`/api/recipes?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your recipes');
        }
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipes on component mount and when search/filters change
  useEffect(() => {
    fetchRecipes();
  }, [searchTerm, filters]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFiltersChange = (newFilters: RecipeFiltersState) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      tags: [],
    });
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm.trim() || 
    filters.categories.length > 0 || 
    filters.tags.length > 0 || 
    filters.difficulty || 
    filters.maxCookingTime || 
    filters.maxPrepTime;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Recipes
        </h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={fetchRecipes}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <SearchInterface
        searchTerm={searchTerm}
        onSearch={handleSearch}
        placeholder="Search recipes by title, ingredients, or instructions..."
      />

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-lg font-medium transition-colors ${
              showFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                {[
                  searchTerm.trim() ? 1 : 0,
                  filters.categories.length,
                  filters.tags.length,
                  filters.difficulty ? 1 : 0,
                  filters.maxCookingTime ? 1 : 0,
                  filters.maxPrepTime ? 1 : 0
                ].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Recipe Filters */}
      {showFilters && (
        <RecipeFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableCategories={getAvailableCategories(recipes)}
          availableTags={getAvailableTags(recipes)}
        />
      )}

      {/* Recipe List */}
      {loading ? (
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
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {hasActiveFilters ? '🔍' : '📚'}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {hasActiveFilters ? 'No recipes found' : 'No recipes yet'}
          </h2>
          <p className="text-gray-600 mb-6">
            {hasActiveFilters 
              ? 'Try adjusting your search terms or filters to find more recipes.'
              : 'Start building your cookbook by adding recipes from your favorite sources.'
            }
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              href="/recipes/add"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Recipe
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions to extract available categories and tags from recipes
function getAvailableCategories(recipes: Recipe[]): string[] {
  const categories = new Set<string>();
  recipes.forEach(recipe => {
    recipe.categories.forEach((category: string) => categories.add(category));
  });
  return Array.from(categories).sort();
}

function getAvailableTags(recipes: Recipe[]): string[] {
  const tags = new Set<string>();
  recipes.forEach(recipe => {
    recipe.tags.forEach((tag: string) => tags.add(tag));
  });
  return Array.from(tags).sort();
}