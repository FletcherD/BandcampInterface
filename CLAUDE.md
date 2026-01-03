# Bandcamp Interface - Development Documentation

---

## 🤖 AI Assistant Instructions

**IMPORTANT: When making any code changes, architecture updates, or adding new features:**
1. Make the changes/implementations as requested
2. **ALWAYS update this CLAUDE.md file** with the new information before completing the task
3. Update relevant sections: Project Structure, Key Features, Implementation Details, etc.
4. Add new sections if introducing major new functionality
5. Keep code examples and architecture diagrams up to date

**This file should always reflect the current state of the project.**

---

## Project Overview

An alternative interface to Bandcamp built as a browser extension (Chrome/Firefox compatible). The application fetches data from Bandcamp's internal API and displays it in a clean, modern interface with navigation between band and album pages. Built with React and distributed as a browser extension to enable direct API access with user authentication.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.4.1
- **Distribution**: Browser Extension (Manifest V3)
- **Cross-Browser**: webextension-polyfill (Chrome & Firefox compatible)
- **Styling**: Tailwind CSS v4
- **Data Fetching**: React Query (@tanstack/react-query)
- **Routing**: React Router v6
- **API**: Bandcamp internal API (direct access via extension permissions)

## Architecture

### Project Structure

```
src/
├── api/
│   ├── bandcamp.ts          # API client & helper functions + style extraction
│   ├── queries.ts           # React Query hooks
│   └── streaming-queries.ts # Streaming URL React Query hooks
├── lib/
│   └── persister.ts         # Custom IndexedDB persister (per-query storage)
├── types/
│   └── bandcamp.ts          # TypeScript interfaces for API responses
├── utils/
│   └── browser-api.ts       # Browser extension API utilities (cookies)
├── contexts/
│   ├── AudioPlayerContext.tsx  # Centralized audio player state management
│   └── ThemeContext.tsx     # Theme state management (default/Bandcamp)
├── styles/
│   └── bandcamp-theme.css   # Bandcamp theme CSS with dynamic variables
├── components/
│   ├── AlbumArt.tsx            # Album artwork display component
│   ├── TrackList.tsx           # Track listing with play buttons & quality indicators
│   ├── BandInfo.tsx            # Band/label info card (clickable)
│   ├── TagList.tsx             # Genre/location tags display
│   ├── Discography.tsx         # Grid/table view with sorting
│   ├── PlaybackControl.tsx     # Fixed playback control bar (seek, prev/next)
│   ├── ThemeToggle.tsx         # Theme toggle button (default/Bandcamp)
│   └── CollectionNavigation.tsx # Tab navigation between Collection and Wishlist
├── pages/
│   ├── AlbumPage.tsx        # Album/track detail page with audio player & theme toggle
│   ├── BandPage.tsx         # Band detail page with discography
│   ├── CollectionPage.tsx   # User collection with infinite scroll
│   ├── WishlistPage.tsx     # User wishlist with infinite scroll
│   └── StreamingTest.tsx    # Streaming URL testing page
├── App.tsx                  # Router setup & React Query provider
└── main.tsx                 # Application entry point

public/
├── manifest.json            # Extension manifest (Manifest V3)
├── background.js            # Background service worker
├── icon16.png               # Extension icon (16x16)
├── icon48.png               # Extension icon (48x48)
└── icon128.png              # Extension icon (128x128)

API_ENDPOINTS.md             # Documentation of discovered API endpoints
```

## API Integration

### Endpoints Used

1. **Current User**: `POST /api/design_system/1/menubar`
   - Fetches current logged-in user session data
   - Parameters: Empty object `{}`
   - Returns: User data including `fan_id`, `username`, and `name`
   - **Authentication Required**: Must be logged into Bandcamp
   - Used to automatically detect the current user instead of hardcoding fan_id

2. **Album/Track Details**: `POST /api/mobile/24/tralbum_details`
   - Fetches detailed information about an album or track
   - Parameters:
     - `band_id`: Artist ID (number)
     - `tralbum_type`: 'a' for album, 't' for track
     - `tralbum_id`: Album or track ID (number)

3. **Band Details**: `POST /api/mobile/24/band_details`
   - Fetches band information and complete discography
   - Parameters:
     - `band_id`: Artist ID (number)

4. **Fan Collection**: `POST /api/mobile/24/fan_collection`
   - Fetches a user's Bandcamp collection with pagination
   - Parameters:
     - `fan_id`: User/fan ID (number)
     - `older_than`: Pagination token (string, optional)
     - `count`: Number of items per page (default: 40)
   - Returns paginated results with tokens for infinite scroll

5. **Fan Wishlist**: `POST /api/mobile/24/fan_wishlist`
   - Fetches a user's Bandcamp wishlist with pagination
   - Parameters:
     - `fan_id`: User/fan ID (number)
     - `older_than`: Pagination token (string, optional)
     - `count`: Number of items per page (default: 40)
   - Returns paginated results with tokens for infinite scroll

### Browser Extension Setup

The application is built as a browser extension to bypass CORS restrictions and access user authentication cookies.

**Key Files:**

**manifest.json** (Manifest V3):
```json
{
  "manifest_version": 3,
  "name": "Bandcamp Interface",
  "version": "1.0.0",
  "permissions": ["cookies", "storage"],
  "host_permissions": ["https://*.bandcamp.com/*"],
  "action": {
    "default_title": "Bandcamp Interface"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}
```

**background.js**:
```javascript
// Opens the app in a new tab when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
```

**API Configuration:**
The API client makes direct requests to Bandcamp's API with credentials:

```typescript
// src/api/bandcamp.ts
const BANDCAMP_API_BASE = 'https://bandcamp.com/api';

// All fetch calls include credentials: 'include' to send cookies
const response = await fetch(`${BANDCAMP_API_BASE}${endpoint}`, {
  method: 'POST',
  credentials: 'include', // Includes user's Bandcamp cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request),
});
```

**Cookie Access (Optional):**
If you need to programmatically access cookies, use the browser API utilities:

```typescript
// src/utils/browser-api.ts
import browser from 'webextension-polyfill';

export async function getBandcampCookies(): Promise<Record<string, string>> {
  const cookies = await browser.cookies.getAll({ domain: '.bandcamp.com' });
  return cookies.reduce((acc, cookie) => {
    acc[cookie.name] = cookie.value;
    return acc;
  }, {} as Record<string, string>);
}
```

### Error Handling

All API functions include proper error handling for rate limiting with coordinated backoff:

**Global Rate Limiter with Mutex:**
- Singleton `RateLimiter` class coordinates all requests to the same endpoint
- **Per-endpoint mutex** ensures requests execute one at a time (serialized)
- Eliminates race conditions where multiple requests bypass rate limit checks
- When ANY request gets a 429, subsequent requests wait for the rate limit to clear
- Prevents "thundering herd" of failed requests

**Rate Limit Flow:**
1. Acquire mutex for endpoint (blocks if another request is in progress)
2. Check if endpoint is rate limited and wait if necessary
3. Execute the API request
4. If 429 response: Mark endpoint as rate limited for all future requests
5. Release mutex (allows next request to proceed)
6. Throw `RateLimitError` which triggers React Query retry

**Example:**
```typescript
return globalRateLimiter.executeRequest(endpoint, async () => {
  const response = await fetch(...);

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
    // Mark endpoint as rate limited - all other waiting requests will now wait
    globalRateLimiter.setRateLimited(endpoint, retryAfter);
    throw new RateLimitError(retryAfter);
  }

  return response.json();
});
```

React Query automatically handles these errors and retries with the specified delay.

## Routing

Uses `HashRouter` (required for browser extensions) with hash-based URLs.

### Routes

- `#/` - Collection page (user's Bandcamp collection)
- `#/wishlist` - Wishlist page (user's Bandcamp wishlist)
- `#/band/:bandId` - Band details page with discography
- `#/album/:bandId/:tralbumType/:tralbumId` - Album or track details page
- `#/streaming-test` - Streaming URL test page (development)

### Navigation Flow

1. **Collection Page → Album Page**: Click any album in the collection
2. **Band Page → Album Page**: Click any album in the discography grid/table
3. **Album Page → Band Page**: Click the band info card
4. All navigation uses React Router's `Link` component for client-side routing
5. URLs are shareable and bookmarkable

### Type Conversion

The discography API returns `item_type` as 'album' or 'track', but the album details API expects `tralbum_type` as 'a' or 't'. The Discography component handles this conversion:

```typescript
const getTrablumType = (itemType: string) => {
  return itemType === 'album' ? 'a' : 't';
};
```

## Key Features

### Collection & Wishlist Navigation

Both Collection and Wishlist pages include tab navigation at the top to easily switch between views:
- **Tab Navigation Component** (`CollectionNavigation.tsx`):
  - Two tabs: "Collection" and "Wishlist"
  - Active tab highlighted with blue underline and text color
  - Inactive tabs show gray with hover effect
  - Uses React Router's `Link` component for client-side navigation
  - Automatically detects current page using `useLocation()` hook

### Collection Page

- **Automatically detects current logged-in user** via `useCurrentUser()` hook
- Display user's Bandcamp collection
- **Tab navigation** to switch to Wishlist page
- **Auto-loads all collection items** on page load (no manual pagination)
- **Authentication Required**: Shows error message if user is not logged into Bandcamp
- **Status bar** showing real-time progress (automatically hidden when complete):
  - Only visible while loading collection pages or album details
  - Shows collection items loaded count
  - Shows album details being fetched in background
  - Visual spinner during active operations
  - Automatically hides when all loading is complete
- Switchable views: grid or table
- Sorting by title, artist name, release date, or date added (table view only)
- **Background Data Enrichment**: Automatically fetches album details for each collection item to get release dates
  - Initial load shows collection without release dates
  - Release dates progressively fill in as album details are fetched in background
  - Uses React Query caching - data persists across page reloads
  - Each album is only fetched once and cached permanently

### Wishlist Page

- **Automatically detects current logged-in user** via `useCurrentUser()` hook
- Display user's Bandcamp wishlist
- **Tab navigation** to switch to Collection page
- **Auto-loads all wishlist items** on page load (no manual pagination)
- **Authentication Required**: Shows error message if user is not logged into Bandcamp
- **Status bar** showing real-time progress (automatically hidden when complete):
  - Only visible while loading wishlist pages or album details
  - Shows wishlist items loaded count
  - Shows album details being fetched in background
  - Visual spinner during active operations
  - Automatically hides when all loading is complete
- Switchable views: grid or table
- Sorting by title, artist name, release date, or date added (table view only)
- **Background Data Enrichment**: Automatically fetches album details for each wishlist item to get release dates
  - Initial load shows wishlist without release dates
  - Release dates progressively fill in as album details are fetched in background
  - Uses React Query caching - data persists across page reloads
  - Each album is only fetched once and cached permanently
- Works identically to Collection Page but displays wishlist items instead of owned items

### Band Page

- Band image and bio
- Social media links (Instagram, Twitter, Facebook, etc.)
- Complete discography with dual view modes:
  - **Grid View**: Card-based layout with artwork thumbnails
  - **Table View**: Sortable table with columns for title, artist, and year
- Both views include:
  - Album/track artwork
  - Title and artist name
  - Release year
  - Hover effects
  - Click to navigate to detail page

### Album/Track Page

- Large album artwork
- Album title and artist
- Release date
- Album description/about text
- Band/label information (clickable)
- Genre and location tags
- Credits
- Complete track listing with:
  - Track numbers
  - Track titles
  - Durations (formatted as MM:SS)
  - **Play buttons** for each track with quality indicators
  - Color-coded buttons (green for HQ, blue for standard, red for playing)
- **Unified Playback Control** (fixed at bottom):
  - Play/pause, previous, next controls
  - Seek bar with time display
  - Current track info and quality badge
  - Auto-plays next track when current finishes
- **High-Quality Streaming** for owned tracks (MP3 V0 ~245kbps)
- Pricing information
- Link to original Bandcamp page
- **Bandcamp Theme Toggle**: Switch between default styling and extracted Bandcamp page styling
  - Toggle button in top-right corner
  - Dynamically extracts custom colors, backgrounds, and styling from each album's Bandcamp page
  - Preserves theme choice in localStorage
  - Each album has unique styling matching the artist's customization

### Theme Toggle Feature

The Album Page includes a theme toggle that allows switching between two visual styles:

**Default Theme:**
- Clean, consistent interface with blue accents
- White background with gray text
- Standard Tailwind styling

**Bandcamp Theme:**
- Dynamically extracts and applies each album's custom styling from its Bandcamp page
- Matches the artist's chosen colors, backgrounds, and aesthetic
- Each album has unique styling (different background colors, accent colors, text colors, etc.)

**How It Works:**

1. **Style Extraction** (`extractPageStyle` in `bandcamp.ts`):
   - Fetches the album's Bandcamp page HTML
   - Parses CSS from style tags and inline styles
   - Extracts colors from:
     - Body background color and background images
     - Text colors (primary and secondary)
     - Link colors and accent colors
     - Button styles
   - Returns a `BandcampPageStyle` object with all extracted styling

2. **Theme Management** (`ThemeContext.tsx`):
   - React Context provides theme state (`'default'` or `'bandcamp'`)
   - `toggleTheme()` function switches between themes
   - `bandcampStyle` state stores extracted styling
   - Theme preference persisted in localStorage

3. **Dynamic Styling** (`bandcamp-theme.css`):
   - CSS custom properties (variables) set dynamically from extracted style
   - `[data-theme="bandcamp"]` selector applies themed styles
   - Variables like `--bc-bg-color`, `--bc-text-color`, `--bc-link-color`
   - All components styled with theme-aware classes

4. **Theme Toggle Button** (`ThemeToggle.tsx`):
   - Fixed position in top-right corner
   - Shows current theme and toggles on click
   - Always accessible across page navigation
   - **Loading State Handling**: Displays "⏳ Loading Style..." while style is being fetched
   - **Error State Handling**: Disables button only if style fetch fails (CORS/custom domain)
   - **Race Condition Fix**: Button remains functional even if toggled before style finishes loading
     - Previously: Toggling to default style before style loaded would disable the button
     - Now: Distinguishes between "loading" (allow toggle) and "failed" (disable button)
     - Props: `styleLoading` and `styleError` passed from AlbumPage query state

5. **Theme Application Logic** (`AlbumPage.tsx:115-117`):
   - Uses "effective theme" to prevent ugly intermediate state
   - If user's theme preference is 'bandcamp' but style isn't loaded yet, applies 'default' theme
   - Only applies 'bandcamp' theme when `bandcampStyle` is actually available
   - Seamlessly transitions from default → bandcamp once style loads
   - Code: `const effectiveTheme = theme === 'bandcamp' && bandcampStyle ? 'bandcamp' : 'default'`

**Implementation Details:**

```typescript
// Extract styling from Bandcamp page
export async function extractPageStyle(albumUrl: string): Promise<BandcampPageStyle> {
  // Fetches HTML, parses CSS, extracts colors
  // Returns: { backgroundColor, backgroundImage, textColor, linkColor, etc. }
}

// Theme context provides theme state
const { theme, toggleTheme, bandcampStyle, setBandcampStyle } = useTheme();

// Apply theme with data attribute and CSS variables
<div
  data-theme={theme}
  data-has-bg-image={theme === 'bandcamp' && !!bandcampStyle?.backgroundImage}
  style={{
    '--bc-bg-color': bandcampStyle?.backgroundColor,
    '--bc-text-color': bandcampStyle?.textColor,
    '--bc-link-color': bandcampStyle?.linkColor,
    // ... more variables
  }}
>
```

**CSS Classes for Theming:**
- `.album-page-content` - Main content wrapper
- `.band-info-card` - Band information card
- `.tag` - Genre/location tags
- `.track-list-item` - Track rows
- `.track-number` - Track number display
- `.track-duration` - Duration display
- `.play-button-hq` / `.play-button-standard` - Play buttons
- `.quality-badge-hq` / `.quality-badge-sd` - Quality indicators
- `.playback-control` - Fixed playback bar

**File Locations:**
- `/src/api/bandcamp.ts` - `extractPageStyle()` function and `BandcampPageStyle` interface
- `/src/contexts/ThemeContext.tsx` - Theme state management
- `/src/components/ThemeToggle.tsx` - Toggle button component
- `/src/styles/bandcamp-theme.css` - Theme-specific CSS rules
- `/src/pages/AlbumPage.tsx` - Theme integration and style application

## Helper Functions

### Image URLs

```typescript
// Album art (various sizes available: 2, 3, 4, 5, 7, 10, 16, 23)
getAlbumArtUrl(artId: number, size: number = 10)
// Returns: https://f4.bcbits.com/img/a{artId}_{size}.jpg

// Band image
getBandImageUrl(imageId: number)
// Returns: https://f4.bcbits.com/img/{imageId}_3.jpg
```

### Formatting

```typescript
// Duration: seconds → "MM:SS"
formatDuration(seconds: number): string

// Release date: Unix timestamp → "Month Day, Year"
formatReleaseDate(timestamp: number): string
```

### Streaming URLs

```typescript
// Get the best available streaming URL (prefers HQ if available)
getBestStreamingUrl(streamingUrl: StreamingUrl): string

// Get high quality streaming URL (mp3-v0) if available
getHQStreamingUrl(streamingUrl: StreamingUrl): string | null

// Extract streaming URLs from album page HTML (fallback method)
// Returns Map of track_id -> { standard?: string, hq?: string }
extractStreamingUrlsFromPage(albumUrl: string): Promise<Map<number, { standard?: string; hq?: string }>>

// Test if a streaming URL is still valid
testStreamUrl(streamUrl: string): Promise<{ ok: boolean; status: number }>

// Refresh an expired streaming URL
refreshStreamUrl(streamUrl: string): Promise<string | null>
```

**Streaming URL Quality Levels:**
- **`mp3-128`**: Standard quality (128kbps MP3) - available for all streamable tracks
- **`mp3-v0`**: High quality (VBR MP3, ~245kbps average) - **only available for tracks you own** when authenticated

**Important Notes:**
- The mobile API (`/api/mobile/24/tralbum_details`) returns `streaming_url` objects with `"mp3-128"` and potentially `"mp3-v0"` fields
- For owned tracks, check if `track.streaming_url["mp3-v0"]` exists first - this is the full quality streaming version
- If the mobile API doesn't include `mp3-v0`, use `extractStreamingUrlsFromPage()` to scrape the album page HTML as a fallback
- Streaming URLs can expire - use `testStreamUrl()` to check validity and `refreshStreamUrl()` to get a new URL

## React Query Setup

### Configuration

The application uses React Query with aggressive caching and IndexedDB persistence:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache
      staleTime: Infinity, // Never refetch (album data rarely changes)
    },
  },
});

// Custom persister that stores each query individually in IndexedDB
const persister = createPerQueryPersister({
  throttleTime: 1000, // Batch writes every 1 second
});

// Wrap app with PersistQueryClientProvider
<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
  {/* app routes */}
</PersistQueryClientProvider>
```

### Caching Strategy

**Why aggressive caching?**
- Album/track data is mostly static (rarely changes after release)
- Reduces API load on Bandcamp's servers
- Instant navigation to previously viewed albums
- Better user experience when browsing collections

**Cache behavior:**
- `staleTime: Infinity` - Data never considered stale, won't refetch unless manually invalidated
- `gcTime: 24 hours` - Unused data stays in memory for 24 hours before garbage collection
- **Persistent cache** - Stored in IndexedDB (50MB+ capacity vs 5-10MB localStorage limit)
- **Per-query storage** - Each query stored individually for efficient I/O
- Survives page reloads and browser restarts
- Each album/band is ~5-50KB of JSON data

**IndexedDB Storage Structure:**
```
Database: "keyval-store"
├─ rq:query:["collection",621507]  → Collection infinite query (~5MB)
├─ rq:query:["wishlist",621507]    → Wishlist infinite query (~5MB)
├─ rq:query:["album",12345]        → Album details (~40KB)
├─ rq:query:["album",67890]        → Album details (~40KB)
├─ ... (hundreds of album queries)
└─ rq:metadata                     → Cache metadata (timestamp, buster)
```

**Cached data includes:**
- Album/track details (title, tracks, artwork IDs, credits, tags)
- Band details (bio, discography, social links)
- Collection pages (infinite scroll results)
- Wishlist pages (infinite scroll results)

**Why per-query storage?**
- **Efficiency**: Only writes what changed (one 40KB album vs entire 20MB cache)
- **Scalability**: Handles hundreds of cached albums without performance issues
- **No size limits**: IndexedDB supports 50MB-1GB+ depending on browser

**Cache invalidation:**
To clear the cache manually (if needed):
- DevTools → Application → IndexedDB → Delete `keyval-store` database
- Or programmatically: The persister's `removeClient()` method clears all `rq:*` keys

### Custom Hooks

All hooks inherit the global caching configuration (Infinity staleTime, 24hr gcTime):

```typescript
// Fetch current logged-in user (cached for 1 hour)
useCurrentUser()
// Returns: { data: CurrentUser, isLoading, error }
// - data: { fan_id: number, username?: string, name?: string }
// - Automatically used by CollectionPage and WishlistPage to detect current user
// - Shows error if user is not logged into Bandcamp

// Fetch album/track details (cached permanently)
useAlbumDetails({ band_id, tralbum_type, tralbum_id })

// Fetch band details (cached permanently)
useBandDetails({ band_id })

// Fetch fan collection with infinite scroll pagination (cached permanently)
useFanCollection(fan_id)
// Returns: { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage }

// Fetch fan wishlist with infinite scroll pagination (cached permanently)
useFanWishlist(fan_id)
// Returns: { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage }

// Enrich collection items with album details in background
useEnrichedCollectionItems(items: CollectionDisplayItem[])
// Returns: { items: CollectionDisplayItem[], stats: { total, pending, fetching, loaded } }
// - items: Enriched collection items with release_date field populated from album details
// - stats: Object tracking background fetch progress
// Uses React Query's useQueries to fetch all album details in parallel
// Each query is cached, so subsequent renders don't re-fetch
```

### Persister Implementation

The application uses a custom per-query persister (`src/lib/persister.ts`) that stores each React Query individually in IndexedDB for maximum efficiency.

**Implementation Details:**

```typescript
// Storage keys
const QUERY_PREFIX = 'rq:query:';
const MUTATION_PREFIX = 'rq:mutation:';
const METADATA_KEY = 'rq:metadata';

// Query stored as: rq:query:["collection",621507]
// Album stored as: rq:query:["album",12345]
```

**Key Features:**

1. **Granular Storage**: Each query gets its own IndexedDB key
   - Collection query: `rq:query:["collection",621507]`
   - Album queries: `rq:query:["album",12345]`, `rq:query:["album",67890]`, etc.

2. **Efficient Writes**: Only modified queries are written
   - Loading one album = one 40KB write (not entire 20MB cache)
   - 500x more efficient than single-blob persistence

3. **Throttled Persistence**: Batches writes every 1000ms to avoid excessive I/O

4. **Cache Validation**: Stores `buster` and `timestamp` for cache versioning
   - React Query validates cache on restore using these fields
   - Mismatched `buster` or expired `timestamp` triggers cache clear

5. **Cleanup**: On `removeClient()`, removes all keys with `rq:*` prefix

**Why This Approach:**
- **Scalability**: Handles 450+ collection items + 450+ album details without performance issues
- **No size limits**: IndexedDB typically supports 50MB-1GB (vs 5-10MB localStorage)
- **Better UX**: Faster writes mean less blocking, smoother user experience
- **Reliability**: Each query persisted independently, partial failures don't corrupt entire cache

### Background Data Enrichment

The `useEnrichedCollectionItems` hook implements progressive enhancement for collection data:

**How it works:**
1. CollectionPage initially renders with basic collection data (no release dates)
2. `useEnrichedCollectionItems` triggers background queries for each album's details
3. As album details load, release dates are merged into collection items
4. React re-renders progressively as data arrives
5. All data is cached in IndexedDB, so subsequent visits are instant

**Benefits:**
- Fast initial render (doesn't wait for album details)
- Progressive enhancement (UI updates as data loads)
- Efficient caching (each album fetched only once, stored in separate IndexedDB key)
- Persistent across sessions (stored in IndexedDB with 50MB+ capacity)
- No loading spinners needed - data appears organically

**Performance:**
- Uses React Query's `useQueries` to trigger fetches for all albums
- Requests are serialized by the global rate limiter's mutex (one at a time per endpoint)
- Queries are marked as background enhancements (don't block UI)
- Cached with `staleTime: Infinity` (permanent cache)

**Stats Calculation:**
The hook returns stats about the enrichment progress:
- `total`: Total number of albums in the collection
- `remaining`: Number of albums without data yet (queries not complete)
- `fetching`: Number of albums actively being fetched
- `loaded`: Number of albums with data loaded
- `rateLimited`: Number of albums waiting for rate limit to clear

**Important Note:** In React Query, `isPending` and `isFetching` are NOT mutually exclusive. A query in its initial fetch has both `isPending=true` AND `isFetching=true`. Previously, the stats incorrectly added these together, showing ~2x the actual count (e.g., 1280 instead of 673). Now we count queries without data (`remaining`) instead of adding the two flags.

**Rate Limit Handling:**
- Detects HTTP 429 (rate limit) responses from Bandcamp API
- **Mutex-based serialization**: Only one request per endpoint executes at a time
- **Coordinated backoff**: When one request hits rate limit, ALL waiting requests pause
- Prevents "thundering herd" and race conditions
- Respects `retry-after` header from API responses
- Automatically retries up to 5 times with proper delays
- Status bar shows "Rate limited, waiting to retry" message
- Console logs show coordination: "[RateLimiter] Waiting Xs for endpoint rate limit to clear"

## Development Setup

### Installation

```bash
npm install
```

### Building the Extension

```bash
npm run build
```

This creates a `dist/` folder with all the extension files.

### Loading the Extension

**Chrome:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. Click the extension icon in your toolbar to open the app

**Firefox:**
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `dist/` folder (e.g., `manifest.json`)
4. Click the extension icon in your toolbar to open the app

**Note:** You must be logged into Bandcamp in your browser for the extension to access your collection and other authenticated features.

### Development Workflow

For rapid development, you can still use Vite's dev server for testing UI changes:

```bash
npm run dev
```

However, API calls will fail due to CORS restrictions. For full functionality testing, you must build and load the extension.

## Important Implementation Details

### Null Safety

1. **Tags**: Some albums/tracks don't have tags. Always check:
   ```typescript
   {album.tags && album.tags.length > 0 && <TagList tags={album.tags} />}
   ```

2. **Optional Fields**: Many API fields can be null. Use optional chaining and null checks:
   ```typescript
   {album.credits && <div>{album.credits}</div>}
   ```

### URL Parameters

Pages use `useParams()` from React Router to extract route parameters:

```typescript
// AlbumPage
const { bandId, tralbumType, tralbumId } = useParams();

// BandPage
const { bandId } = useParams();
```

### TypeScript Types

All API response types are defined in `src/types/bandcamp.ts`:
- `CurrentUser` - Current logged-in user data (includes `fan_id`, `username`, `name`)
- `AlbumDetails` - Complete album/track information
- `BandDetails` - Band information with discography
- `Track` - Individual track information
- `DiscographyItem` - Album/track in band discography list (includes `release_date`)
- `CollectionDisplayItem` - Album/track in user's collection (includes `added_date` and optional `purchased_date`, no release_date)
- `FanCollectionResponse` - Paginated collection response with items and tokens
- `CollectionItem` - Raw individual item from the collection API
- `Tag` - Genre/location tag
- `BandSite` - Social media link

**Important Data Structure Differences:**
- **Band Discography** (`DiscographyItem`): Includes `release_date` (when the album was released)
- **User Collection** (`CollectionDisplayItem`): Includes `added_date` (when user added to collection), optional `purchased_date`, and optional `release_date` (fetched in background from album details API)

### Discography Component Features

The `Discography` component is a polymorphic component that supports two different display modes and two view types.

**Display Modes:**

1. **Discography Mode** (`mode="discography"`):
   - Used on BandPage to display band's releases
   - Accepts `DiscographyItem[]` with `release_date` field
   - Accepts optional `defaultArtistName` prop to populate blank artist fields
   - Shows "Released" column (full date)
   - Sorts by title, artist, or release date
   - When artist_name is blank, displays the band name from the page context

2. **Collection Mode** (`mode="collection"`):
   - Used on CollectionPage to display user's collection
   - Accepts `CollectionDisplayItem[]` with `added_date`, optional `purchased_date`, and optional `release_date` fields
   - Table view shows both "Released" and "Added" columns
   - Sorts by title, artist, release date, or date added
   - Release dates are progressively filled in as background queries complete

**View Types (available in both modes):**

1. **Grid View** (default):
   - Responsive grid layout (2-5 columns based on screen size)
   - Card-based design with album artwork
   - Hover effects with image scaling
   - Displays title, artist, and year (both modes show release year when available)
   - Album artwork and title link to album page
   - Artist name is clickable and links to band page

2. **Table View**:
   - Compact tabular layout
   - Sortable columns adapt to mode:
     - Discography: Title, Artist, Released (full date)
     - Collection: Title, Artist, Released (full date), Added (full date)
   - Click column headers to toggle sort direction
   - Visual indicators for current sort field and direction (↑↓)
   - Smaller thumbnails for efficient space usage
   - Album titles link to album page
   - Artist names are clickable and link to band page

Both views:
- Support client-side sorting
- Maintain sort state when switching views
- Link to album detail pages
- Adapt date display based on mode
- **View preference is persisted** in localStorage and remembered across sessions

### Auto-Loading Collection Items

The Collection Page automatically loads all collection items on initial load:

```typescript
// Auto-load all pages immediately
useEffect(() => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

This uses React Query's `useInfiniteQuery` which fetches pages sequentially until all collection items are loaded.

**Status Bar:**
- Shows real-time progress of collection loading
- Displays number of album details being fetched in background
- Includes animated spinner during active operations
- Updates as `useEnrichedCollectionItems` stats change

Benefits:
- Immediate access to entire collection for sorting/filtering
- Clear visibility into background operations
- No need to scroll to load more items
- Works seamlessly with React Query caching

## Tailwind CSS v4

This project uses Tailwind CSS v4 with the Vite plugin:

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";
```

No `tailwind.config.js` is needed - Tailwind v4 uses CSS-based configuration.

## Dark Mode Support

The application includes dark mode styles using Tailwind's `dark:` variants:

```typescript
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
```

## Audio Streaming & Playback

### Overview

The application includes a full-featured audio player for streaming owned tracks in high quality. Streaming is implemented using page scraping to extract URLs from Bandcamp's `data-tralbum` attribute, as the mobile API does not include high-quality streaming URLs.

### Architecture

```
User clicks Play on track
    ↓
useAlbumStreamingUrls(albumUrl) - Fetches streaming URLs via page scraping
    ↓
AudioPlayerContext - Manages playback state globally
    ↓
PlaybackControl - Unified player UI at bottom of page
    ↓
HTML5 Audio element streams the track
```

### Streaming Quality Levels

- **mp3-128**: Standard quality (128kbps MP3) - available for all streamable tracks
- **mp3-v0**: High quality VBR MP3 (~245kbps average) - **only available for tracks you own**

The mobile API (`/api/mobile/24/tralbum_details`) only returns standard quality URLs. For high-quality streaming, the app scrapes the album page HTML to extract URLs from the `data-tralbum` JSON object.

### Implementation Details

**Page Scraping Approach:**
```typescript
// src/api/bandcamp.ts
export async function extractStreamingUrlsFromPage(albumUrl: string) {
  // 1. Fetch album page HTML with credentials
  const response = await fetch(albumUrl, { credentials: 'include' });

  // 2. Extract <script data-tralbum> content
  const dataTralbumMatch = html.match(/data-tralbum="([^"]+)"/);

  // 3. Decode HTML entities and parse JSON
  const tralbumData = JSON.parse(decodedJson);

  // 4. Extract streaming URLs from trackinfo array
  for (const track of tralbumData.trackinfo) {
    const urls = {
      standard: track.file?.['mp3-128'],  // Always present
      hq: track.file?.['mp3-v0']          // Only for owned tracks
    };
  }

  // Returns Map<trackId, { standard?: string, hq?: string }>
}
```

**Caching Strategy:**
- Streaming URLs are fetched fresh on each album page load
- `staleTime: 0` - No caching between page loads
- `gcTime: 0` - Don't persist after component unmounts
- URLs are time-sensitive and expire after several hours

**React Query Hook:**
```typescript
// src/api/streaming-queries.ts
export function useAlbumStreamingUrls(albumUrl: string) {
  return useQuery({
    queryKey: ['streaming-urls', albumUrl],
    queryFn: () => extractStreamingUrlsFromPage(albumUrl),
    enabled: !!albumUrl,
    staleTime: 0,           // Always fetch fresh
    gcTime: 0,              // Don't cache
    refetchOnMount: true,   // Refetch when component mounts
  });
}
```

### Audio Player Architecture

**Centralized State Management:**
```typescript
// src/contexts/AudioPlayerContext.tsx
export function AudioPlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState<TrackWithUrl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Methods: playTrack, togglePlayPause, seekTo, playNext, playPrevious
}
```

**Key Features:**
- Single audio element shared across all tracks
- Clicking play on any track switches to that track
- Auto-plays next track when current track ends
- Previous button restarts track if >3 seconds in, otherwise goes to previous
- Seek bar with visual progress indicator
- Displays current track info and quality badge

### Components

**PlaybackControl** (`src/components/PlaybackControl.tsx`):
- Fixed position at bottom of page
- Shows current track title, artist, and quality badge
- Play/pause, previous, next buttons
- Seek bar with time display
- Only visible when a track is loaded

**TrackPlayer** (in `src/components/TrackList.tsx`):
- Play/Pause button for each track
- Quality indicator badge (HQ/SD)
- Button color indicates quality:
  - 🟢 Green = HQ available
  - 🔵 Blue = Standard quality
  - 🔴 Red = Currently playing (shows Pause)
- Integrates with AudioPlayerContext

### Usage Example

```typescript
// AlbumPage wraps content with AudioPlayerProvider
<AudioPlayerProvider>
  <div className="pb-32"> {/* Bottom padding for fixed player */}
    <TrackList tracks={album.tracks} albumUrl={album.bandcamp_url} />
  </div>
  <PlaybackControl />
</AudioPlayerProvider>
```

```typescript
// TrackList uses the audio player context
function TrackPlayer({ track, allTracks, albumUrl }) {
  const { playTrack, isPlaying, currentTrack } = useAudioPlayer();
  const { data: streamingUrls } = useAlbumStreamingUrls(albumUrl);
  const { url, quality } = getTrackStreamingUrl(streamingUrls, track.track_id);

  const handlePlay = () => {
    playTrack(track, url, quality, allTracks, streamingUrls);
  };
}
```

### Streaming URL Helpers

```typescript
// Get best available quality (prefers HQ)
getBestStreamingUrl(streamingUrl: StreamingUrl): string

// Get HQ URL if available
getHQStreamingUrl(streamingUrl: StreamingUrl): string | null

// Extract streaming URLs from album page HTML
extractStreamingUrlsFromPage(albumUrl: string): Promise<Map<number, { standard?: string; hq?: string }>>

// Test if a streaming URL is still valid
testStreamUrl(streamUrl: string): Promise<{ ok: boolean; status: number }>

// Refresh an expired streaming URL
refreshStreamUrl(streamUrl: string): Promise<string | null>
```

### Performance Notes

**Page Scraping Overhead:**
- ~100-300ms to fetch album page
- <10ms to parse JSON
- One request per album page load
- Negligible compared to audio streaming bandwidth (4-8MB per track)

**Why Not Use Mobile API?**
- Mobile API only returns mp3-128 (standard quality)
- Designed for bandwidth-constrained mobile apps
- HQ streaming URLs only available in web page HTML
- Page scraping is what Bandcamp's web player uses

### Testing

**Test Page:** `/streaming-test`
- Verify page scraping extracts URLs correctly
- Test HQ URLs for owned albums
- Validate URLs can be played
- Debug streaming issues

### Future Enhancements

Potential features to add:
- Search functionality
- Genre/tag browsing
- Artist recommendations
- Responsive mobile optimization
- Keyboard shortcuts for playback control
- Volume control
- Shuffle and repeat modes
- Playlist creation
- Loading skeletons instead of basic "Loading..." text
- Filter/search within collection
- Collection statistics and insights
- Export collection data
- Multiple collection view modes (compact, detailed, etc.)
- Download manager for purchased albums

## Testing

### Testing Different Content

**Band/Album Pages:**
1. Find a Bandcamp URL (e.g., https://artist.bandcamp.com)
2. Use browser DevTools to inspect API calls and get `band_id`
3. Navigate directly to `/band/{band_id}` in the browser

**Collection & Wishlist Pages:**
1. **Automatically detects the logged-in user** - No configuration needed!
2. Ensure you are logged into Bandcamp in your browser before using the extension
3. The extension will fetch your collection/wishlist automatically using the `useCurrentUser()` hook
4. If not logged in, you'll see an error message with a link to bandcamp.com

## Notes

- This is a read-only interface - no write operations to Bandcamp
- API endpoints are undocumented/unofficial and may change
- Respect Bandcamp's terms of service and rate limits
- The extension requires user to be logged into Bandcamp
- Built with Manifest V3 for future-proof compatibility
- Works in both Chrome and Firefox (uses webextension-polyfill for compatibility)
- Extension bypasses CORS and includes user's authentication cookies automatically
