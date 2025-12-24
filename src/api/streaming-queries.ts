import { useQuery } from '@tanstack/react-query';
import { extractStreamingUrlsFromPage } from './bandcamp';

/**
 * Fetches streaming URLs for an album by scraping its page.
 * Returns a Map of track_id -> { standard?: string, hq?: string }
 *
 * Fetches fresh URLs on each mount since streaming URLs are time-sensitive.
 * URLs typically last several hours but we fetch fresh to avoid expiration issues.
 */
export function useAlbumStreamingUrls(albumUrl: string | null | undefined) {
  return useQuery({
    queryKey: ['streaming-urls', albumUrl],
    queryFn: () => {
      if (!albumUrl) {
        throw new Error('Album URL is required');
      }
      return extractStreamingUrlsFromPage(albumUrl);
    },
    enabled: !!albumUrl,
    staleTime: 0, // Always fetch fresh URLs
    gcTime: 0, // Don't cache after component unmounts
    refetchOnMount: true, // Refetch when component mounts
  });
}

/**
 * Gets streaming URL for a specific track from the album's streaming URLs.
 * Returns the HQ URL if available, otherwise standard quality.
 */
export function getTrackStreamingUrl(
  streamingUrls: Map<number, { standard?: string; hq?: string }> | undefined,
  trackId: number
): { url: string | null; quality: 'hq' | 'standard' | null } {
  if (!streamingUrls) {
    return { url: null, quality: null };
  }

  const urls = streamingUrls.get(trackId);
  if (!urls) {
    return { url: null, quality: null };
  }

  // Prefer HQ if available
  if (urls.hq) {
    return { url: urls.hq, quality: 'hq' };
  }

  if (urls.standard) {
    return { url: urls.standard, quality: 'standard' };
  }

  return { url: null, quality: null };
}
