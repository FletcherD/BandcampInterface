import { Link, useLocation } from 'react-router-dom';

export function CollectionNavigation() {
  const location = useLocation();
  const isCollection = location.pathname === '/' || location.pathname === '';
  const isWishlist = location.pathname === '/wishlist';

  return (
    <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
      <Link
        to="/"
        className={`pb-3 px-1 font-medium transition-colors ${
          isCollection
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        Collection
      </Link>
      <Link
        to="/wishlist"
        className={`pb-3 px-1 font-medium transition-colors ${
          isWishlist
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        Wishlist
      </Link>
    </div>
  );
}
