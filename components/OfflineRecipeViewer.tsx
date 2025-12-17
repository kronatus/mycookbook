'use client';

import { useEffect, useState } from 'react';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  instructions: Array<{
    stepNumber: number;
    description: string;
    duration?: number;
  }>;
  cookingTime?: number;
  prepTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  categories: string[];
  tags: string[];
  sourceUrl?: string;
  personalNotes?: string;
}

interface OfflineRecipeViewerProps {
  recipeId: string;
  fallbackRecipe?: Recipe;
}

export default function OfflineRecipeViewer({ recipeId, fallbackRecipe }: OfflineRecipeViewerProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(fallbackRecipe || null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(!fallbackRecipe);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!fallbackRecipe) {
      fetchRecipe();
    }
  }, [recipeId, fallbackRecipe]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recipes/${recipeId}`);
      
      if (!response.ok) {
        if (response.status === 503) {
          // Offline response from service worker
          const errorData = await response.json();
          if (errorData.offline) {
            setError('This recipe is not available offline. Please connect to the internet to view it.');
            return;
          }
        }
        throw new Error(`Failed to fetch recipe: ${response.statusText}`);
      }

      const recipeData = await response.json();
      setRecipe(recipeData);

      // Store in localStorage for offline access
      if ('localStorage' in window) {
        try {
          const offlineRecipes = JSON.parse(localStorage.getItem('offlineRecipes') || '{}');
          offlineRecipes[recipeId] = {
            ...recipeData,
            cachedAt: Date.now()
          };
          localStorage.setItem('offlineRecipes', JSON.stringify(offlineRecipes));
        } catch (storageError) {
          console.warn('Failed to cache recipe offline:', storageError);
        }
      }
    } catch (fetchError) {
      console.error('Failed to fetch recipe:', fetchError);
      
      // Try to load from localStorage if offline
      if ('localStorage' in window) {
        try {
          const offlineRecipes = JSON.parse(localStorage.getItem('offlineRecipes') || '{}');
          const cachedRecipe = offlineRecipes[recipeId];
          
          if (cachedRecipe) {
            setRecipe(cachedRecipe);
            setError('Showing cached version (offline)');
          } else {
            setError('Recipe not available offline. Please connect to the internet.');
          }
        } catch (storageError) {
          setError('Failed to load recipe. Please check your connection.');
        }
      } else {
        setError('Failed to load recipe. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !recipe) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-red-800 mb-2">Recipe Unavailable</h2>
          <p className="text-red-600 mb-4">{error}</p>
          {isOffline && (
            <p className="text-sm text-red-500">
              You&apos;re currently offline. This recipe hasn&apos;t been cached for offline viewing.
            </p>
          )}
          <button
            onClick={fetchRecipe}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Offline indicator for this recipe */}
      {error && recipe && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Recipe header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
        )}
        
        {/* Recipe metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {recipe.prepTime && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Prep: {recipe.prepTime}min
            </span>
          )}
          {recipe.cookingTime && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              Cook: {recipe.cookingTime}min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Serves: {recipe.servings}
            </span>
          )}
          {recipe.difficulty && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {recipe.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Recipe content */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Ingredients */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-gray-700">
                  {ingredient.quantity && ingredient.unit && (
                    <span className="font-medium">{ingredient.quantity} {ingredient.unit} </span>
                  )}
                  {ingredient.name}
                  {ingredient.notes && (
                    <span className="text-gray-500 text-sm"> ({ingredient.notes})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction) => (
              <li key={instruction.stepNumber} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {instruction.stepNumber}
                </span>
                <div className="flex-1">
                  <p className="text-gray-700">{instruction.description}</p>
                  {instruction.duration && (
                    <p className="text-sm text-gray-500 mt-1">
                      Duration: {instruction.duration} minutes
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Personal notes */}
      {recipe.personalNotes && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Personal Notes</h3>
          <p className="text-blue-800">{recipe.personalNotes}</p>
        </div>
      )}

      {/* Categories and tags */}
      {(recipe.categories.length > 0 || recipe.tags.length > 0) && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          {recipe.categories.length > 0 && (
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-500 mr-2">Categories:</span>
              {recipe.categories.map((category, index) => (
                <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm mr-2">
                  {category}
                </span>
              ))}
            </div>
          )}
          {recipe.tags.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-500 mr-2">Tags:</span>
              {recipe.tags.map((tag, index) => (
                <span key={index} className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm mr-2">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}