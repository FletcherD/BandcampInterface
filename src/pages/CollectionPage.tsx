import { useMemo, useEffect, useRef } from 'react';
import { useFanCollection } from '../api/queries';
import Discography from '../components/Discography';
import type { CollectionDisplayItem } from '../types/bandcamp';

// Test fan_id from API_ENDPOINTS.md
const TEST_FAN_ID = 621507;

export default function CollectionPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFanCollection(TEST_FAN_ID);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Convert collection items to CollectionDisplayItem format
  const albums = useMemo(() => {
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
          purchased_date: item.purchased,
          is_purchasable: true,
          band_id: item.band_id,
        });
      });
    });

    return items;
  }, [data]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading collection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">
          Error loading collection: {error.message}
        </div>
      </div>
    );
  }

  if (!albums.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No items in collection</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">My Collection</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {albums.length} item{albums.length !== 1 ? 's' : ''} in your collection
          {hasNextPage && ' (loading more...)'}
        </p>
        <Discography mode="collection" items={albums} />

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="text-gray-500 dark:text-gray-400">
              Loading more...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
