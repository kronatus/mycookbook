'use client';

import { Navigation } from '@/components/Navigation';
import { CategoryRecipeBrowser } from '@/components/CategoryRecipeBrowser';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

const VALID_CATEGORIES = [
  'cooking',
  'baking', 
  'appetizers',
  'beverages',
  'breakfast',
  'dinner'
];

const CATEGORY_INFO = {
  cooking: {
    displayName: 'Cooking',
    description: 'Main dishes, sides, and savory recipes',
    icon: '🍳'
  },
  baking: {
    displayName: 'Baking', 
    description: 'Breads, desserts, and sweet treats',
    icon: '🧁'
  },
  appetizers: {
    displayName: 'Appetizers',
    description: 'Starters and small plates', 
    icon: '🥗'
  },
  beverages: {
    displayName: 'Beverages',
    description: 'Drinks, smoothies, and cocktails',
    icon: '🥤'
  },
  breakfast: {
    displayName: 'Breakfast',
    description: 'Morning meals and brunch dishes',
    icon: '🥞'
  },
  dinner: {
    displayName: 'Dinner',
    description: 'Evening meals and hearty dishes',
    icon: '🍽️'
  }
};

export default function CategoryPage({ params }: CategoryPageProps) {
  const { category } = params;

  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-4" role="img" aria-label={categoryInfo.displayName}>
              {categoryInfo.icon}
            </span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {categoryInfo.displayName}
              </h1>
              <p className="text-gray-600 mt-1">
                {categoryInfo.description}
              </p>
            </div>
          </div>
        </div>

        <CategoryRecipeBrowser category={category} />
      </main>
    </div>
  );
}