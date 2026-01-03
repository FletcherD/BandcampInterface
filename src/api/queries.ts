import { useQuery, useInfiniteQuery, useQueries } from '@tanstack/react-query';
import { fetchAlbumDetails, fetchBandDetails, fetchFanCollection, fetchFanWishlist, fetchCurrentUser, extractPageStyle, RateLimitError } from './bandcamp';
import type { AlbumDetailsRequest, BandDetailsRequest, CollectionDisplayItem } from '../types/bandcamp';

export function useAlbumDetails(request: AlbumDetailsRequest) {
  return useQuery({
    queryKey: ['album', request.tralbum_id],
    queryFn: () => fetchAlbumDetails(request),
  });
}

export function useBandDetails(request: BandDetailsRequest) {
  return useQuery({
    queryKey: ['band', request.band_id],
    queryFn: () => fetchBandDetails(request),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 60, // 1 hour - user session doesn't change often
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1, // Only retry once for auth failures
  });
}

export function useFanCollection(fanId: number | undefined) {
  return useInfiniteQuery({
    queryKey: ['collection', fanId],
    queryFn: ({ pageParam }) => fetchFanCollection({ fan_id: fanId!, older_than: pageParam }),
    getNextPageParam: (lastPage) => {
      // Return the token of the last item for the next page
      const lastItem = lastPage.items[lastPage.items.length - 1];
      return lastItem?.token;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!fanId && fanId > 0, // Only run when we have a valid fan_id
  });
}

export function useFanWishlist(fanId: number | undefined) {
  return useInfiniteQuery({
    queryKey: ['wishlist', fanId],
    queryFn: ({ pageParam }) => fetchFanWishlist({ fan_id: fanId!, older_than: pageParam }),
    getNextPageParam: (lastPage) => {
      // Return the token of the last item for the next page
      const lastItem = lastPage.items[lastPage.items.length - 1];
      return lastItem?.token;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!fanId && fanId > 0, // Only run when we have a valid fan_id
  });
}

/**
 * Enriches collection items with album details (particularly release_date)
 * by fetching from the tralbum_details endpoint in the background.
 * Uses React Query's caching, so data persists and only fetches once per album.
 */
export function useEnrichedCollectionItems(items: CollectionDisplayItem[]) {
  // Fetch album details for each collection item
  const albumQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ['album', item.item_id],
      queryFn: () => fetchAlbumDetails({
        band_id: item.band_id,
        tralbum_type: item.tralbum_type,
        tralbum_id: item.item_id,
      }),
      // Retry up to 5 times for rate limit errors
      retry: (failureCount: number, error: Error) => {
        // Retry rate limit errors up to 5 times
        if (error instanceof RateLimitError && failureCount < 5) {
          return true;
        }
        // Don't retry other errors
        return false;
      },
      // Custom retry delay that respects retry-after header
      retryDelay: (attemptIndex: number, error: Error) => {
        if (error instanceof RateLimitError) {
          // Use the retry-after value from the API (in seconds), convert to ms
          return error.retryAfter * 1000;
        }
        // Default exponential backoff for other errors
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
      // These queries are background enhancements, so don't block on them
      staleTime: Infinity,
    })),
  });

  // Calculate loading stats
  // Note: isPending and isFetching are not mutually exclusive
  // A query in initial fetch has both isPending=true AND isFetching=true
  // So we count queries without data (remaining) instead of adding the two
  const loadedCount = albumQueries.filter(q => q.data).length;
  const remainingCount = albumQueries.filter(q => !q.data).length;
  const activelyFetchingCount = albumQueries.filter(q => q.isFetching).length;
  const rateLimitedCount = albumQueries.filter(q =>
    q.error instanceof RateLimitError && q.isError
  ).length;

  // Merge album details into collection items
  const enrichedItems = items.map((item, index) => {
    const albumData = albumQueries[index].data;

    return {
      ...item,
      // Add release_date from album details if available
      release_date: albumData?.release_date
        ? new Date(albumData.release_date * 1000).toISOString()
        : item.release_date,
    };
  });

  return {
    items: enrichedItems,
    stats: {
      total: items.length,
      remaining: remainingCount,
      fetching: activelyFetchingCount,
      loaded: loadedCount,
      rateLimited: rateLimitedCount,
    },
  };
}

/**
 * Fetches and caches Bandcamp page styling for an album.
 * Styles are cached permanently (staleTime: Infinity) since album styling rarely changes.
 */
export function useBandcampPageStyle(albumUrl: string | undefined) {
  return useQuery({
    queryKey: ['bandcamp-style', albumUrl],
    queryFn: () => extractPageStyle(albumUrl!),
    enabled: !!albumUrl,
    staleTime: Infinity, // Never refetch - album styling rarely changes
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: false, // Don't retry if page fetch fails (CORS, custom domain, etc.)
  });
}
