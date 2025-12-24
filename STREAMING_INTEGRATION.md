# Streaming Integration Guide

Since the mobile API doesn't include HQ (mp3-v0) URLs, we use **page scraping** to extract streaming URLs from the album's HTML. This is the same approach Bandcamp's web player uses.

## Architecture

```
┌─────────────────────────────────────────────────┐
│ User clicks Play button on track               │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ useAlbumStreamingUrls(albumUrl)                │
│ - Fetches album page HTML                      │
│ - Extracts data-tralbum JSON                   │
│ - Parses streaming URLs for all tracks         │
│ - Cached by React Query (1 hour)               │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ getTrackStreamingUrl(streamingUrls, trackId)   │
│ - Returns { url, quality } for specific track  │
│ - Prefers HQ (mp3-v0) if available             │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ Audio element plays the stream                 │
└─────────────────────────────────────────────────┘
```

## Quick Start: Add to AlbumPage

### Step 1: Import the Component

```typescript
// src/pages/AlbumPage.tsx
import { TrackPlayer } from '../components/TrackPlayer';
```

### Step 2: Add to TrackList Component

Update your `TrackList` component to include play buttons:

```typescript
// src/components/TrackList.tsx
import { TrackPlayer } from './TrackPlayer';

interface TrackListProps {
  tracks: Track[];
  albumUrl: string; // Add this prop
}

export function TrackList({ tracks, albumUrl }: TrackListProps) {
  return (
    <div className="space-y-2">
      {tracks.map((track, index) => (
        <div
          key={track.track_id}
          className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-6 text-right">
              {index + 1}
            </span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {track.title}
              </div>
              {track.duration && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDuration(track.duration)}
                </div>
              )}
            </div>
          </div>

          {/* Add the play button */}
          <TrackPlayer
            trackId={track.track_id}
            trackTitle={track.title}
            albumUrl={albumUrl}
          />
        </div>
      ))}
    </div>
  );
}
```

### Step 3: Pass albumUrl to TrackList

In your `AlbumPage.tsx`:

```typescript
export default function AlbumPage() {
  const { bandId, tralbumType, tralbumId } = useParams();
  // ... existing code ...

  return (
    <div>
      {/* ... existing album info ... */}

      {album.tracks && album.tracks.length > 0 && (
        <TrackList
          tracks={album.tracks}
          albumUrl={album.bandcamp_url}  // Pass the album URL
        />
      )}
    </div>
  );
}
```

## How It Works

### 1. Lazy Loading

Streaming URLs are only fetched when:
- User opens an album page with the TrackList component
- React Query automatically caches the result

### 2. Caching Strategy

```typescript
staleTime: Infinity  // Never refetch automatically
gcTime: 1 hour       // Keep in memory for 1 hour
```

**Why?**
- Streaming URLs are valid for hours/days
- One fetch per album, shared across all tracks
- Persisted in IndexedDB via your existing persister

### 3. Quality Selection

The hook automatically prefers HQ quality:
```typescript
if (urls.hq) {
  return { url: urls.hq, quality: 'hq' };  // MP3 V0 (~245kbps)
}
if (urls.standard) {
  return { url: urls.standard, quality: 'standard' };  // 128kbps
}
```

## Advanced: Handle Expired URLs

If a streaming URL expires (after hours/days), you can refresh it:

```typescript
import { refreshStreamUrl } from '../api/bandcamp';

const handlePlayWithRefresh = async () => {
  if (!streamUrl) return;

  try {
    await audioRef.current.play();
  } catch (error) {
    // URL might be expired, try refreshing
    console.log('Stream failed, attempting refresh...');

    const refreshed = await refreshStreamUrl(streamUrl);
    if (refreshed) {
      audioRef.current.src = refreshed;
      await audioRef.current.play();
    } else {
      console.error('Failed to refresh stream URL');
    }
  }
};
```

## Performance Notes

### Bandwidth

Each album page fetch is ~50-200KB of HTML:
- Negligible compared to streaming audio (4-8MB per track)
- Only happens once per album (cached)

### Parsing

Parsing `data-tralbum` JSON is fast:
- Regex extraction: <1ms
- JSON.parse: <5ms
- Total overhead: <10ms per album

### Network

```
User clicks Play
    ↓
Is data cached? → YES → Play immediately (0ms)
    ↓ NO
Fetch album page → 100-300ms
    ↓
Parse streaming URLs → <10ms
    ↓
Cache in React Query
    ↓
Play audio
```

Subsequent plays on the same album: **instant** (cached)

## Collection Page Integration

For the collection page, you can preload streaming URLs for visible albums:

```typescript
// src/pages/CollectionPage.tsx
import { useAlbumStreamingUrls } from '../api/streaming-queries';

// Optionally preload streaming URLs for currently visible albums
function PreloadStreamingUrls({ albumUrls }: { albumUrls: string[] }) {
  // Only preload first 10 visible albums to avoid excessive requests
  const visibleUrls = albumUrls.slice(0, 10);

  visibleUrls.forEach(url => {
    useAlbumStreamingUrls(url); // Triggers fetch and caching
  });

  return null; // This is a data-fetching component, no UI
}
```

But honestly, **on-demand fetching is fine**. The overhead is minimal and users typically don't play every track.

## Testing

Use the `/streaming-test` page to verify:
1. Page scraping successfully extracts URLs
2. HQ URLs are present for owned albums
3. Standard URLs are present for all streamable tracks
4. URLs can be played in an audio element

## Fallback Behavior

If page scraping fails:
- Track player shows "N/A" button (disabled)
- Error is logged to console
- React Query will retry with exponential backoff

## Summary

✅ **Use page scraping** - It works and it's stable
✅ **Cache aggressively** - URLs valid for hours, one fetch per album
✅ **Load on-demand** - Only when user opens album or clicks play
✅ **Prefer HQ** - Automatically use mp3-v0 when available
❌ **Don't preload everything** - Unnecessary bandwidth/requests

This approach is:
- **Simple**: One hook, one helper function
- **Efficient**: Cached, on-demand, minimal overhead
- **Reliable**: Uses same data as Bandcamp's web player
- **Maintainable**: Isolated in streaming-queries.ts
