import { useMemo, useEffect } from 'react';
import { useFanWishlist, useEnrichedCollectionItems } from '../api/queries';
import Discography from '../components/Discography';
import type { CollectionDisplayItem } from '../types/bandcamp';

// Test fan_id from API_ENDPOINTS.md
const TEST_FAN_ID = 621507;

export default function WishlistPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFanWishlist(TEST_FAN_ID);

  // Auto-load all pages immediately
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Convert wishlist items to CollectionDisplayItem format
  const baseAlbums = useMemo(() => {
    if (!data?.pages) return [];

    const items: CollectionDisplayItem[] = [];

    data.pages.forEach((page) => {
      page.items.forEach((item) => {
        items.push({
          item_id: item.tralbum_id,
          item_type: item.item_type,
          artist_name: item.band_name,
          band_name: item.band_name,
          title: item.item_title,
          art_id: item.item_art_id,
          added_date: item.added,
          is_purchasable: true,
          band_id: item.band_id,
          tralbum_type: item.tralbum_type,
        });
      });
    });

    return items;
  }, [data]);

  // Only start enriching album details AFTER all wishlist pages are loaded
  const allWishlistPagesLoaded = !hasNextPage && !isFetchingNextPage;
  const itemsToEnrich = allWishlistPagesLoaded ? baseAlbums : [];
  const { items: enrichedAlbums, stats } = useEnrichedCollectionItems(itemsToEnrich);

  // Use enriched albums if available, otherwise use base albums
  const albums = enrichedAlbums.length > 0 ? enrichedAlbums : baseAlbums;

  // Only show loading screen if we have no data AND we're loading
  // This allows cached data to display immediately
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading wishlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">
          Error loading wishlist: {error.message}
        </div>
      </div>
    );
  }

  if (!albums.length && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No items in wishlist</div>
      </div>
    );
  }

  // Determine status message
  const getStatusMessage = () => {
    const messages: string[] = [];

    // Show wishlist loading progress with count
    if (isFetchingNextPage || hasNextPage) {
      messages.push(`Loaded ${albums.length} wishlist item${albums.length !== 1 ? 's' : ''}...`);
    } else {
      messages.push(`Loaded ${albums.length} wishlist item${albums.length !== 1 ? 's' : ''}`);
    }

    // Show album details fetching status
    if (stats.rateLimited > 0) {
      messages.push(`⏳ Rate limited, waiting to retry ${stats.rateLimited} album${stats.rateLimited !== 1 ? 's' : ''}...`);
    } else if (stats.fetching > 0 || stats.pending > 0) {
      messages.push(`Fetching details for ${stats.fetching + stats.pending} album${stats.fetching + stats.pending !== 1 ? 's' : ''}`);
    } else if (stats.loaded > 0) {
      messages.push(`Album details loaded (${stats.loaded}/${stats.total})`);
    }

    return messages.join(' • ');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">My Wishlist</h1>

        {/* Status Bar */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            {(isFetchingNextPage || hasNextPage || stats.fetching > 0 || stats.pending > 0) && (
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            )}
            <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              {getStatusMessage()}
            </span>
          </div>
        </div>

        <Discography mode="collection" items={albums} />
      </div>
    </div>
  );
}
