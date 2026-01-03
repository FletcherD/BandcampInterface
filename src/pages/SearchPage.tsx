import { useState, useEffect } from 'react';
import { useCurrentUser } from '../api/queries';
import { useUnifiedSearch } from '../api/queries';
import SearchResults from '../components/SearchResults';
import { CollectionNavigation } from '../components/CollectionNavigation';

export default function SearchPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();
  const { results, isLoading: searchLoading } = useUnifiedSearch(debouncedSearch, currentUser?.fan_id);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <CollectionNavigation />
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <CollectionNavigation />
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{(userError as Error).message}</p>
            <p className="mt-2">
              Please make sure you are logged into Bandcamp at{' '}
              <a
                href="https://bandcamp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                bandcamp.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <CollectionNavigation />

        <div className="mt-8">
          {/* Search Input */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search your collection, wishlist, and all of Bandcamp..."
                className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
            {searchInput && searchInput !== debouncedSearch && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Searching...
              </div>
            )}
          </div>

          {/* Search Results */}
          {debouncedSearch ? (
            <SearchResults results={results} isLoading={searchLoading} />
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Start typing to search your collection, wishlist, and all of Bandcamp
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Results will be grouped by source with owned items prioritized
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
