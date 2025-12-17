import { Navigation } from '@/components/Navigation';

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Kitchen Wishlist
          </h1>
          <p className="text-gray-600">
            Track cooking equipment and tools you want to purchase
          </p>
        </div>

        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-600 mb-6">
            Wishlist functionality will be implemented in future tasks
          </p>
        </div>
      </main>
    </div>
  );
}