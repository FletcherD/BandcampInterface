import { useQuery, useInfiniteQuery, useQueries } from '@tanstack/react-query';
import { fetchAlbumDetails, fetchBandDetails, fetchFanCollection, fetchFanWishlist, fetchCurrentUser, extractPageStyle, RateLimitError, fetchAutocompleteSearch, fetchCollectionSearch, getAlbumArtUrl } from './bandcamp';
import type { AlbumDetailsRequest, BandDetailsRequest, CollectionDisplayItem, UnifiedSearchResult, AutocompleteSearchResult, CollectionItem } from '../types/bandcamp';

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

/**
 * Searches across all of Bandcamp using the autocomplete/elastic API.
 * Returns bands, albums, tracks, and fans.
 */
export function useAutocompleteSearch(searchText: string, fanId: number | undefined) {
  return useQuery({
    queryKey: ['autocomplete-search', searchText, fanId],
    queryFn: () => fetchAutocompleteSearch({
      search_text: searchText,
      search_filter: '',
      fan_id: fanId || 0,
      full_page: false,
    }),
    enabled: !!searchText && searchText.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

/**
 * Searches within a user's collection or wishlist.
 */
export function useCollectionSearch(searchKey: string, searchType: 'collection' | 'wishlist', fanId: number | undefined) {
  return useQuery({
    queryKey: ['collection-search', searchType, searchKey, fanId],
    queryFn: () => fetchCollectionSearch({
      fan_id: fanId!,
      search_key: searchKey,
      search_type: searchType,
    }),
    enabled: !!searchKey && !!fanId && searchKey.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

/**
 * Helper function to convert autocomplete result to unified result format
 */
function autocompleteToUnified(result: AutocompleteSearchResult, source: 'bandcamp'): UnifiedSearchResult {
  const typeMap = { b: 'band', a: 'album', t: 'track', f: 'fan' } as const;

  return {
    id: `${result.type}-${result.id}`,
    type: typeMap[result.type],
    name: result.name,
    band_name: result.type !== 'b' && 'band_name' in result ? result.band_name : undefined,
    album_name: result.type === 't' && 'album_name' in result ? result.album_name : undefined,
    url: result.type === 'b' ? result.item_url_root : ('item_url_path' in result ? result.item_url_path : result.item_url_root),
    image_url: result.img,
    source,
    source_data: result,
  };
}

/**
 * Helper function to convert collection item to unified result format
 */
function collectionToUnified(item: CollectionItem, source: 'collection' | 'wishlist'): UnifiedSearchResult {
  const typeMap = { a: 'album', t: 'track' } as const;

  return {
    id: `${item.tralbum_type}-${item.tralbum_id}`,
    type: typeMap[item.tralbum_type as 'a' | 't'] || 'album',
    name: item.item_title,
    band_name: item.band_name,
    url: `https://bandcamp.com/redirect_to_app?url=x-bandcamp://show_tralbum?tralbum_type=${item.tralbum_type}&tralbum_id=${item.tralbum_id}`,
    image_url: getAlbumArtUrl(item.item_art_id, 3),
    source,
    source_data: item,
  };
}

/**
 * Unified search hook that combines collection, wishlist, and global Bandcamp search.
 * Results are prioritized: Collection > Wishlist > Bandcamp
 * Duplicates are removed (owned/wishlisted items take precedence over global results)
 */
export function useUnifiedSearch(searchText: string, fanId: number | undefined) {
  const collectionSearch = useCollectionSearch(searchText, 'collection', fanId);
  const wishlistSearch = useCollectionSearch(searchText, 'wishlist', fanId);
  const bandcampSearch = useAutocompleteSearch(searchText, fanId);

  // Combine and deduplicate results
  const results: UnifiedSearchResult[] = [];
  const seenIds = new Set<string>();

  // Priority 1: Collection results
  if (collectionSearch.data?.tralbums) {
    for (const item of collectionSearch.data.tralbums) {
      const unified = collectionToUnified(item, 'collection');
      results.push(unified);
      seenIds.add(unified.id);
    }
  }

  // Priority 2: Wishlist results (skip if already in collection)
  if (wishlistSearch.data?.tralbums) {
    for (const item of wishlistSearch.data.tralbums) {
      const unified = collectionToUnified(item, 'wishlist');
      if (!seenIds.has(unified.id)) {
        results.push(unified);
        seenIds.add(unified.id);
      }
    }
  }

  // Priority 3: Bandcamp results (skip if already in collection/wishlist)
  if (bandcampSearch.data?.auto.results) {
    for (const result of bandcampSearch.data.auto.results) {
      const unified = autocompleteToUnified(result, 'bandcamp');
      if (!seenIds.has(unified.id)) {
        results.push(unified);
        seenIds.add(unified.id);
      }
    }
  }

  return {
    results,
    isLoading: collectionSearch.isLoading || wishlistSearch.isLoading || bandcampSearch.isLoading,
    isError: collectionSearch.isError || wishlistSearch.isError || bandcampSearch.isError,
    error: collectionSearch.error || wishlistSearch.error || bandcampSearch.error,
  };
}
