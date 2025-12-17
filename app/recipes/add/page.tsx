import { Navigation } from '@/components/Navigation';

export default function AddRecipePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Add Recipe
          </h1>
          <p className="text-gray-600">
            Add recipes from URLs, documents, or create manually
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-center">
              Recipe ingestion functionality will be implemented in future tasks.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}