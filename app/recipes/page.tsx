'use client';

import { Navigation } from '@/components/Navigation';
import { RecipeBrowser } from '@/components/RecipeBrowser';

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            All Recipes
          </h1>
          <p className="text-gray-600">
            Browse your complete recipe collection
          </p>
        </div>

        <RecipeBrowser />
      </main>
    </div>
  );
}