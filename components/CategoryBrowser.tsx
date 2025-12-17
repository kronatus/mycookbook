'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Recipe } from '@/db/schema';

interface CategoryData {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  recipeCount: number;
  color: string;
}

const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    name: 'cooking',
    displayName: 'Cooking',
    description: 'Main dishes, sides, and savory recipes',
    icon: '🍳',
    recipeCount: 0,
    color: 'bg-orange-100 hover:bg-orange-200 border-orange-200'
  },
  {
    name: 'baking',
    displayName: 'Baking',
    description: 'Breads, desserts, and sweet treats',
    icon: '🧁',
    recipeCount: 0,
    color: 'bg-pink-100 hover:bg-pink-200 border-pink-200'
  },
  {
    name: 'appetizers',
    displayName: 'Appetizers',
    description: 'Starters and small plates',
    icon: '🥗',
    recipeCount: 0,
    color: 'bg-green-100 hover:bg-green-200 border-green-200'
  },
  {
    name: 'beverages',
    displayName: 'Beverages',
    description: 'Drinks, smoothies, and cocktails',
    icon: '🥤',
    recipeCount: 0,
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-200'
  },
  {
    name: 'breakfast',
    displayName: 'Breakfast',
    description: 'Morning meals and brunch dishes',
    icon: '🥞',
    recipeCount: 0,
    color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200'
  },
  {
    name: 'dinner',
    displayName: 'Dinner',
    description: 'Evening meals and hearty dishes',
    icon: '🍽️',
    recipeCount: 0,
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-200'
  }
];

export function CategoryBrowser() {
  const [categories, setCategories] = useState<CategoryData[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  const fetchCategoryCounts = async () => {
    try {
      // For now, we'll use the total count endpoint and distribute evenly
      // In future tasks, this will be replaced with proper category-specific counts
      const response = await fetch('/api/recipes/count');
      if (response.ok) {
        const data = await response.json();
        const totalCount = data.count || 0;
        
        // For demonstration, distribute recipes across categories
        // This is a placeholder until proper category filtering is implemented
        const countPerCategory = Math.floor(totalCount / categories.length);
        const remainder = totalCount % categories.length;
        
        setCategories(prevCategories => 
          prevCategories.map((category, index) => ({
            ...category,
            recipeCount: countPerCategory + (index < remainder ? 1 : 0)
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch category counts:', error);
      // Gracefully handle the error by showing 0 counts
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          recipeCount: 0
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Browse by Category
        </h2>
        <p className="text-gray-600">
          Explore your recipe collection organized by cooking style and meal type
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border-2 border-gray-200 p-6 animate-pulse"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/recipes/category/${category.name}`}
              className={`block bg-white rounded-lg border-2 ${category.color} p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
            >
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-4" role="img" aria-label={category.displayName}>
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {category.displayName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.recipeCount} recipe{category.recipeCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      )}

      {!loading && categories.every(cat => cat.recipeCount === 0) && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No recipes yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start building your cookbook by adding recipes from your favorite sources
          </p>
          <Link
            href="/recipes/add"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Recipe
          </Link>
        </div>
      )}
    </div>
  );
}