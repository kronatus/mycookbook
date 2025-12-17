import { CategoryBrowser } from '@/components/CategoryBrowser';
import { Navigation } from '@/components/Navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Personal Cookbook
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your curated collection of recipes from around the web and beyond. 
            Organize, discover, and cook your favorite dishes.
          </p>
        </div>
        
        <CategoryBrowser />
      </main>
    </div>
  );
}