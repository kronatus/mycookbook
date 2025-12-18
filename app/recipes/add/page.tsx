import { Navigation } from '@/components/Navigation';
import { RecipeIngestionForm } from '@/components/RecipeIngestionForm';

export default function AddRecipePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Add Recipe
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add recipes from URLs, documents, or create manually
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <RecipeIngestionForm />
          </div>
        </div>
      </main>
    </div>
  );
}