'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navigation } from '../../../components/Navigation';
import { RecipeEditor } from '../../../components/RecipeEditor';
import OfflineRecipeViewer from '../../../components/OfflineRecipeViewer';
import type { Recipe } from '@/db';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Recipe not found');
          } else if (response.status === 403) {
            setError('You do not have permission to view this recipe');
          } else {
            setError('Failed to load recipe');
          }
          return;
        }

        const data = await response.json();
        setRecipe(data.recipe);
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRecipe();
    }
  }, [params.id]);

  const handleRecipeUpdate = (updatedRecipe: Recipe) => {
    setRecipe(updatedRecipe);
  };

  const handleRecipeDelete = () => {
    router.push('/recipes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Recipe not found'}
            </h1>
            <button
              onClick={() => router.push('/recipes')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Back to Recipes
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {/* View mode toggle */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('view')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'view'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              View Recipe
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'edit'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Edit Recipe
            </button>
          </div>
          <button
            onClick={() => router.push('/recipes')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Recipes
          </button>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'view' ? (
          <OfflineRecipeViewer 
            recipeId={params.id as string}
            fallbackRecipe={recipe ? {
              ...recipe,
              description: recipe.description || undefined,
              personalNotes: recipe.personalNotes || undefined,
              sourceUrl: recipe.sourceUrl || undefined,
              cookingTime: recipe.cookingTime || undefined,
              prepTime: recipe.prepTime || undefined,
              servings: recipe.servings || undefined,
              difficulty: recipe.difficulty || undefined
            } : undefined}
          />
        ) : (
          <RecipeEditor
            recipe={recipe}
            onUpdate={handleRecipeUpdate}
            onDelete={handleRecipeDelete}
          />
        )}
      </main>
    </div>
  );
}