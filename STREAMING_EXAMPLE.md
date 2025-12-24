# Streaming URLs Example

This document shows how to get and use full-quality streaming URLs for tracks you own.

## Basic Usage

### 1. Check if Mobile API Returns HQ URLs

First, fetch album details and check if the mobile API already includes `mp3-v0` URLs:

```typescript
import { fetchAlbumDetails, getBestStreamingUrl, getHQStreamingUrl } from './api/bandcamp';

// Fetch album details for an album you own
const albumDetails = await fetchAlbumDetails({
  band_id: 12345,
  tralbum_type: 'a',
  tralbum_id: 67890,
});

// Check first track
const firstTrack = albumDetails.tracks[0];

console.log('Standard quality:', firstTrack.streaming_url['mp3-128']);
console.log('High quality:', firstTrack.streaming_url['mp3-v0']); // May be undefined

// Get the best available URL
const bestUrl = getBestStreamingUrl(firstTrack.streaming_url);
console.log('Best URL:', bestUrl); // Will prefer mp3-v0 if available

// Check specifically for HQ
const hqUrl = getHQStreamingUrl(firstTrack.streaming_url);
if (hqUrl) {
  console.log('HQ streaming available!');
} else {
  console.log('No HQ streaming - might need to scrape page');
}
```

### 2. Fallback: Scrape Album Page for HQ URLs

If the mobile API doesn't include `mp3-v0` URLs, scrape the album page HTML:

```typescript
import { extractStreamingUrlsFromPage } from './api/bandcamp';

// Use the album's bandcamp_url from the API response
const streamingUrls = await extractStreamingUrlsFromPage(albumDetails.bandcamp_url);

// Get streaming URLs for a specific track
const trackId = firstTrack.track_id;
const urls = streamingUrls.get(trackId);

if (urls?.hq) {
  console.log('Found HQ URL from page scraping:', urls.hq);
} else if (urls?.standard) {
  console.log('Only standard quality available:', urls.standard);
}
```

### 3. Handle Expired URLs

Streaming URLs can expire. Test and refresh them if needed:

```typescript
import { testStreamUrl, refreshStreamUrl } from './api/bandcamp';

async function getValidStreamUrl(url: string): Promise<string | null> {
  // Test if URL is still valid
  const testResult = await testStreamUrl(url);

  if (testResult.ok) {
    return url; // URL is still valid
  }

  console.log('Stream URL expired, refreshing...');

  // Try to refresh the URL
  const refreshedUrl = await refreshStreamUrl(url);

  if (refreshedUrl) {
    console.log('Successfully refreshed URL');
    return refreshedUrl;
  }

  console.error('Failed to refresh URL');
  return null;
}

// Usage
const streamUrl = getBestStreamingUrl(track.streaming_url);
const validUrl = await getValidStreamUrl(streamUrl);

if (validUrl) {
  // Use the valid URL to play audio
  audioElement.src = validUrl;
  audioElement.play();
}
```

## Complete Example: Audio Player Component

Here's a complete React component that plays tracks with proper URL handling:

```typescript
import { useState, useRef, useEffect } from 'react';
import {
  getBestStreamingUrl,
  getHQStreamingUrl,
  testStreamUrl,
  refreshStreamUrl,
  extractStreamingUrlsFromPage
} from '../api/bandcamp';
import type { Track } from '../types/bandcamp';

interface AudioPlayerProps {
  track: Track;
  albumUrl: string; // For fallback scraping
}

export function AudioPlayer({ track, albumUrl }: AudioPlayerProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<'standard' | 'hq' | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadStreamUrl = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, try to get HQ URL from mobile API
      let url = getHQStreamingUrl(track.streaming_url);

      if (url) {
        console.log('Using HQ URL from mobile API');
        setQuality('hq');
      } else {
        // Fallback: Try scraping the album page
        console.log('No HQ URL in mobile API, trying page scraping...');
        const streamingUrls = await extractStreamingUrlsFromPage(albumUrl);
        const urls = streamingUrls.get(track.track_id);

        if (urls?.hq) {
          console.log('Found HQ URL from page scraping');
          url = urls.hq;
          setQuality('hq');
        } else {
          // Fall back to standard quality
          console.log('Using standard quality');
          url = getBestStreamingUrl(track.streaming_url);
          setQuality('standard');
        }
      }

      // Test if URL is valid
      const testResult = await testStreamUrl(url);

      if (!testResult.ok) {
        console.log('URL expired, refreshing...');
        const refreshedUrl = await refreshStreamUrl(url);

        if (refreshedUrl) {
          url = refreshedUrl;
        } else {
          throw new Error('Failed to refresh stream URL');
        }
      }

      setStreamUrl(url);
    } catch (err) {
      console.error('Error loading stream URL:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stream');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    if (!streamUrl) {
      await loadStreamUrl();
    }

    if (audioRef.current && streamUrl) {
      audioRef.current.play();
    }
  };

  const handlePause = () => {
    audioRef.current?.pause();
  };

  return (
    <div className="audio-player">
      <div className="track-info">
        <h3>{track.title}</h3>
        {quality && (
          <span className="quality-badge">
            {quality === 'hq' ? 'HQ (MP3 V0)' : 'Standard (128kbps)'}
          </span>
        )}
      </div>

      <audio ref={audioRef} src={streamUrl || undefined} />

      <div className="controls">
        <button onClick={handlePlay} disabled={isLoading || !!error}>
          {isLoading ? 'Loading...' : 'Play'}
        </button>
        <button onClick={handlePause} disabled={!streamUrl}>
          Pause
        </button>
      </div>

      {error && <div className="error">Error: {error}</div>}
    </div>
  );
}
```

## Key Takeaways

1. **Try mobile API first**: Check for `track.streaming_url['mp3-v0']` - it may already be there for owned tracks
2. **Fallback to scraping**: Use `extractStreamingUrlsFromPage()` if mobile API doesn't include HQ URLs
3. **Always test URLs**: Use `testStreamUrl()` before playing to avoid 404 errors
4. **Refresh expired URLs**: Use `refreshStreamUrl()` if a URL has expired
5. **Quality levels**:
   - `mp3-128`: 128kbps MP3 (always available for streamable tracks)
   - `mp3-v0`: VBR MP3 ~245kbps (only for owned tracks, best quality for streaming)

## Notes

- Download URLs (for full albums as ZIP) are different from streaming URLs
- This guide focuses on **streaming** (individual track playback), not downloading
- You must be logged in (have valid cookies) to access HQ streaming URLs for owned tracks
- Streaming URLs are time-limited and may expire (typically after several hours)
