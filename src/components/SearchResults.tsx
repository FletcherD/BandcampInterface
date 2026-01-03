import { Link } from 'react-router-dom';
import type { UnifiedSearchResult } from '../types/bandcamp';

interface SearchResultsProps {
  results: UnifiedSearchResult[];
  isLoading: boolean;
}

function getSourceBadge(source: 'collection' | 'wishlist' | 'bandcamp') {
  const badges = {
    collection: { text: 'OWNED', color: 'bg-green-600 text-white' },
    wishlist: { text: 'WISHLIST', color: 'bg-yellow-600 text-white' },
    bandcamp: { text: 'BANDCAMP', color: 'bg-blue-600 text-white' },
  };

  const badge = badges[source];
  return (
    <span className={`text-xs px-2 py-1 rounded ${badge.color}`}>
      {badge.text}
    </span>
  );
}

function getResultLink(result: UnifiedSearchResult): string {
  // For collection/wishlist items, we need to construct the proper route
  if (result.source === 'collection' || result.source === 'wishlist') {
    const item = result.source_data as any;
    if (result.type === 'album' || result.type === 'track') {
      return `#/album/${item.band_id}/${item.tralbum_type}/${item.tralbum_id}`;
    }
  }

  // For Bandcamp results, use the URL directly
  if (result.type === 'band') {
    const bandResult = result.source_data as any;
    return `#/band/${bandResult.id}`;
  } else if (result.type === 'album' || result.type === 'track') {
    const albumResult = result.source_data as any;
    return `#/album/${albumResult.band_id}/${result.type === 'album' ? 'a' : 't'}/${albumResult.id}`;
  }

  return result.url;
}

export default function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Searching...</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          No results found. Try a different search term.
        </div>
      </div>
    );
  }

  // Group results by source
  const collectionResults = results.filter(r => r.source === 'collection');
  const wishlistResults = results.filter(r => r.source === 'wishlist');
  const bandcampResults = results.filter(r => r.source === 'bandcamp');

  return (
    <div className="space-y-8">
      {/* Collection Results */}
      {collectionResults.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Your Collection ({collectionResults.length})
          </h2>
          <div className="space-y-2">
            {collectionResults.map((result) => (
              <Link
                key={result.id}
                to={getResultLink(result)}
                className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {result.image_url && (
                  <img
                    src={result.image_url}
                    alt={result.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {result.name}
                  </div>
                  {result.band_name && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {result.band_name}
                    </div>
                  )}
                </div>
                {getSourceBadge(result.source)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist Results */}
      {wishlistResults.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Your Wishlist ({wishlistResults.length})
          </h2>
          <div className="space-y-2">
            {wishlistResults.map((result) => (
              <Link
                key={result.id}
                to={getResultLink(result)}
                className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {result.image_url && (
                  <img
                    src={result.image_url}
                    alt={result.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {result.name}
                  </div>
                  {result.band_name && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {result.band_name}
                    </div>
                  )}
                </div>
                {getSourceBadge(result.source)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bandcamp Results */}
      {bandcampResults.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            All of Bandcamp ({bandcampResults.length})
          </h2>
          <div className="space-y-2">
            {bandcampResults.map((result) => (
              <Link
                key={result.id}
                to={getResultLink(result)}
                className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {result.image_url && (
                  <img
                    src={result.image_url}
                    alt={result.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {result.name}
                  </div>
                  {result.band_name && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {result.band_name}
                      {result.album_name && <span> - {result.album_name}</span>}
                    </div>
                  )}
                </div>
                {getSourceBadge(result.source)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
