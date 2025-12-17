'use client';

import Link from 'next/link';
import type { Recipe } from '@/db';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const formatTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'web': return '🌐';
      case 'video': return '📹';
      case 'document': return '📄';
      case 'manual': return '✍️';
      default: return '📝';
    }
  };

  return (
    <Link href={`/recipes/${recipe.id}`} className="block h-full">
      <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all duration-200 p-6 h-full cursor-pointer active:scale-[0.98]">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Recipe Stats */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
          {recipe.servings && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="sr-only">Servings: </span>
              {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
            </div>
          )}
          
          {recipe.prepTime && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="sr-only">Prep time: </span>
              Prep: {formatTime(recipe.prepTime)}
            </div>
          )}
          
          {recipe.cookingTime && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <span className="sr-only">Cook time: </span>
              Cook: {formatTime(recipe.cookingTime)}
            </div>
          )}
        </div>

        {/* Categories and Tags */}
        <div className="mb-4">
          {recipe.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {recipe.categories.slice(0, 3).map((category: string) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {category}
                </span>
              ))}
              {recipe.categories.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  +{recipe.categories.length - 3} more
                </span>
              )}
            </div>
          )}
          
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  #{tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  +{recipe.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {recipe.difficulty && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                <span className="mr-1" aria-hidden="true">{getDifficultyIcon(recipe.difficulty)}</span>
                <span className="sr-only">Difficulty: </span>
                {recipe.difficulty}
              </span>
            )}
            
            <span className="text-xs text-gray-500 dark:text-gray-400" title={`Source: ${recipe.sourceType}`}>
              <span className="sr-only">Source type: {recipe.sourceType}</span>
              <span aria-hidden="true">{getSourceIcon(recipe.sourceType)}</span>
            </span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className="sr-only">Number of ingredients: </span>
            {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
          </div>
        </div>
      </article>
    </Link>
  );
}