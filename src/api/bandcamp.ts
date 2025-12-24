import type { AlbumDetails, AlbumDetailsRequest, BandDetails, BandDetailsRequest, FanCollection, FanCollectionRequest, StreamingUrl } from '../types/bandcamp';

// Direct API calls to Bandcamp (for browser extension)
const BANDCAMP_API_BASE = 'https://bandcamp.com/api';

// Custom error class for rate limiting
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super(`Rate limited. Retry after ${retryAfter} seconds.`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Simple mutex to ensure only one request executes at a time.
 */
class Mutex {
  private locked = false;
  private waiting: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.locked = false;
    }
  }
}

/**
 * Global rate limiter that coordinates backoff across all requests to the same endpoint.
 * Uses a mutex per endpoint to serialize requests and prevent race conditions.
 */
class RateLimiter {
  private rateLimitedUntil: Map<string, number> = new Map();
  private mutexes: Map<string, Mutex> = new Map();

  /**
   * Get or create a mutex for an endpoint.
   */
  private getMutex(endpoint: string): Mutex {
    let mutex = this.mutexes.get(endpoint);
    if (!mutex) {
      mutex = new Mutex();
      this.mutexes.set(endpoint, mutex);
    }
    return mutex;
  }

  /**
   * Execute a request with proper serialization and rate limit handling.
   * Ensures only one request per endpoint executes at a time.
   */
  async executeRequest<T>(endpoint: string, requestFn: () => Promise<T>): Promise<T> {
    const mutex = this.getMutex(endpoint);

    // Acquire mutex - only one request per endpoint at a time
    await mutex.acquire();

    try {
      // Check if rate limited and wait
      const until = this.rateLimitedUntil.get(endpoint);
      if (until && Date.now() < until) {
        const waitTime = until - Date.now();
        console.log(`[RateLimiter] Waiting ${Math.ceil(waitTime / 1000)}s for ${endpoint} rate limit to clear`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Execute the request
      return await requestFn();
    } finally {
      // Always release the mutex
      mutex.release();
    }
  }

  /**
   * Mark an endpoint as rate limited until the specified time.
   * Called when a 429 response is received.
   */
  setRateLimited(endpoint: string, retryAfterSeconds: number): void {
    const until = Date.now() + (retryAfterSeconds * 1000);
    this.rateLimitedUntil.set(endpoint, until);
    console.log(`[RateLimiter] ${endpoint} rate limited for ${retryAfterSeconds}s`);
  }
}

// Global singleton rate limiter shared across all API calls
const globalRateLimiter = new RateLimiter();

export async function fetchAlbumDetails(
  request: AlbumDetailsRequest
): Promise<AlbumDetails> {
  const endpoint = '/mobile/24/tralbum_details';

  return globalRateLimiter.executeRequest(endpoint, async () => {
    const response = await fetch(`${BANDCAMP_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authenticated requests
      body: JSON.stringify(request),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
      // Mark this endpoint as rate limited so all other requests will wait
      globalRateLimiter.setRateLimited(endpoint, retryAfter);
      throw new RateLimitError(retryAfter);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch album details: ${response.statusText}`);
    }

    return response.json();
  });
}

export async function fetchBandDetails(
  request: BandDetailsRequest
): Promise<BandDetails> {
  const endpoint = '/mobile/24/band_details';

  return globalRateLimiter.executeRequest(endpoint, async () => {
    const response = await fetch(`${BANDCAMP_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authenticated requests
      body: JSON.stringify(request),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
      // Mark this endpoint as rate limited so all other requests will wait
      globalRateLimiter.setRateLimited(endpoint, retryAfter);
      throw new RateLimitError(retryAfter);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch band details: ${response.statusText}`);
    }

    return response.json();
  });
}

export async function fetchFanCollection(
  request: FanCollectionRequest
): Promise<FanCollection> {
  const endpoint = '/mobile/24/fan_collection';

  return globalRateLimiter.executeRequest(endpoint, async () => {
    const response = await fetch(`${BANDCAMP_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authenticated requests
      body: JSON.stringify(request),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
      // Mark this endpoint as rate limited so all other requests will wait
      globalRateLimiter.setRateLimited(endpoint, retryAfter);
      throw new RateLimitError(retryAfter);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch fan collection: ${response.statusText}`);
    }

    return response.json();
  });
}

export async function fetchFanWishlist(
  request: FanCollectionRequest
): Promise<FanCollection> {
  const endpoint = '/mobile/24/fan_wishlist';

  return globalRateLimiter.executeRequest(endpoint, async () => {
    const response = await fetch(`${BANDCAMP_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authenticated requests
      body: JSON.stringify(request),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
      // Mark this endpoint as rate limited so all other requests will wait
      globalRateLimiter.setRateLimited(endpoint, retryAfter);
      throw new RateLimitError(retryAfter);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch fan wishlist: ${response.statusText}`);
    }

    return response.json();
  });
}

// Helper to construct album art URL
export function getAlbumArtUrl(artId: number, size: number = 10): string {
  return `https://f4.bcbits.com/img/a${artId}_${size}.jpg`;
}

// Helper to construct band image URL
export function getBandImageUrl(imageId: number): string {
  return `https://f4.bcbits.com/img/${imageId}_3.jpg`;
}

// Helper to format duration in seconds to MM:SS
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper to format release date
export function formatReleaseDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Extracts streaming URLs from an album/track page HTML.
 * This is a fallback method when the mobile API doesn't return mp3-v0 URLs.
 *
 * For owned tracks, Bandcamp includes streaming URLs in the page's data-tralbum attribute.
 * The data structure includes:
 * - trackinfo[].file['mp3-128']: Standard quality (128kbps)
 * - trackinfo[].file['mp3-v0']: High quality VBR MP3 (only for owned tracks)
 *
 * @param albumUrl - The Bandcamp album or track URL
 * @returns Object mapping track IDs to their streaming URLs
 */
export async function extractStreamingUrlsFromPage(
  albumUrl: string
): Promise<Map<number, { standard?: string; hq?: string }>> {
  const response = await fetch(albumUrl, {
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch album page: ${response.statusText}`);
  }

  const html = await response.text();

  // Extract the data-tralbum JSON blob from the page
  const dataTralbumMatch = html.match(/data-tralbum="([^"]+)"/);
  if (!dataTralbumMatch) {
    throw new Error('Could not find data-tralbum in page HTML');
  }

  // Decode HTML entities and parse JSON
  const decodedJson = dataTralbumMatch[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const tralbumData = JSON.parse(decodedJson);

  // Extract streaming URLs from trackinfo array
  const streamingUrls = new Map<number, { standard?: string; hq?: string }>();

  if (Array.isArray(tralbumData.trackinfo)) {
    for (const track of tralbumData.trackinfo) {
      const trackId = track.track_id || track.id;
      if (!trackId) continue;

      const urls: { standard?: string; hq?: string } = {};

      if (track.file?.['mp3-128']) {
        urls.standard = track.file['mp3-128'];
      }

      // High quality URL - only present for owned tracks
      if (track.file?.['mp3-v0']) {
        urls.hq = track.file['mp3-v0'];
      }

      if (urls.standard || urls.hq) {
        streamingUrls.set(trackId, urls);
      }
    }
  }

  return streamingUrls;
}

/**
 * Refreshes an expired streaming URL.
 * Bandcamp streaming URLs can expire. This function uses Bandcamp's refresh API
 * to get a new valid URL for the same stream.
 *
 * @param streamUrl - The expired streaming URL
 * @returns The refreshed streaming URL, or null if refresh failed
 */
export async function refreshStreamUrl(streamUrl: string): Promise<string | null> {
  const endpoint = '/stream/1/refresh';

  try {
    const refreshUrl = new URL(`${BANDCAMP_API_BASE}${endpoint}`);
    refreshUrl.searchParams.set('url', streamUrl);

    const response = await fetch(refreshUrl.toString(), {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Failed to refresh stream URL: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error('Error refreshing stream URL:', error);
    return null;
  }
}

/**
 * Tests if a streaming URL is still valid.
 *
 * @param streamUrl - The streaming URL to test
 * @returns Object with ok (boolean) and status (HTTP status code)
 */
export async function testStreamUrl(streamUrl: string): Promise<{ ok: boolean; status: number }> {
  try {
    const response = await fetch(streamUrl, {
      method: 'HEAD',
    });

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    console.error('Error testing stream URL:', error);
    return { ok: false, status: 0 };
  }
}

/**
 * Gets the best available streaming URL for a track.
 * Prefers high quality (mp3-v0) if available, falls back to standard (mp3-128).
 *
 * @param streamingUrl - StreamingUrl object from API response
 * @returns The best available streaming URL
 */
export function getBestStreamingUrl(streamingUrl: StreamingUrl): string {
  return streamingUrl['mp3-v0'] || streamingUrl['mp3-128'];
}

/**
 * Gets the high quality streaming URL if available.
 *
 * @param streamingUrl - StreamingUrl object from API response
 * @returns The HQ streaming URL, or null if not available
 */
export function getHQStreamingUrl(streamingUrl: StreamingUrl): string | null {
  return streamingUrl['mp3-v0'] || null;
}
