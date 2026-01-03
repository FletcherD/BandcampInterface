import { useMemo, useEffect } from 'react';
import { useFanWishlist, useEnrichedCollectionItems, useCurrentUser } from '../api/queries';
import Discography from '../components/Discography';
import { CollectionNavigation } from '../components/CollectionNavigation';
import type { CollectionDisplayItem } from '../types/bandcamp';

export default function WishlistPage() {
  // Fetch current logged-in user
  const { data: currentUser, isLoading: isLoadingUser, error: userError } = useCurrentUser();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFanWishlist(currentUser?.fan_id);

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

  // Handle user authentication loading and errors first
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading user session...</div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl text-red-500">
          Error: Not logged in to Bandcamp
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          Please log in at{' '}
          <a
            href="https://bandcamp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            bandcamp.com
          </a>{' '}
          and reload this extension.
        </div>
      </div>
    );
  }

  // Check if we successfully loaded user but don't have a valid fan_id
  if (!isLoadingUser && (!currentUser?.fan_id || currentUser.fan_id <= 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl text-red-500">
          Error: Could not find your Bandcamp user ID
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          Please make sure you are logged in at{' '}
          <a
            href="https://bandcamp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            bandcamp.com
          </a>{' '}
          and reload this extension.
        </div>
      </div>
    );
  }

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

  // Determine if we should show the status bar
  const showStatusBar = isFetchingNextPage || hasNextPage || stats.remaining > 0 || stats.rateLimited > 0;

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
    } else if (stats.remaining > 0) {
      messages.push(`Fetching details for ${stats.remaining} album${stats.remaining !== 1 ? 's' : ''}`);
    } else if (stats.loaded > 0 && (isFetchingNextPage || hasNextPage)) {
      // Only show "loaded" message if still loading wishlist pages
      messages.push(`Album details loaded (${stats.loaded}/${stats.total})`);
    }

    return messages.join(' • ');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6">My Wishlist</h1>

        {/* Navigation Tabs */}
        <CollectionNavigation />

        {/* Status Bar - only show when loading */}
        {showStatusBar && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                {getStatusMessage()}
              </span>
            </div>
          </div>
        )}

        <Discography mode="collection" items={albums} />
      </div>
    </div>
  );
}
