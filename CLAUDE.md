# Bandcamp Interface - Development Documentation

## Project Overview

An alternative interface to Bandcamp built as a React Single Page Application (SPA). The application fetches data from Bandcamp's internal API and displays it in a clean, modern interface with navigation between band and album pages.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.4.1
- **Styling**: Tailwind CSS v4
- **Data Fetching**: React Query (@tanstack/react-query)
- **Routing**: React Router v6
- **API**: Bandcamp internal API (proxied through Vite dev server)

## Architecture

### Project Structure

```
src/
├── api/
│   ├── bandcamp.ts          # API client & helper functions
│   └── queries.ts           # React Query hooks
├── types/
│   └── bandcamp.ts          # TypeScript interfaces for API responses
├── components/
│   ├── AlbumArt.tsx         # Album artwork display component
│   ├── TrackList.tsx        # Track listing with durations
│   ├── BandInfo.tsx         # Band/label info card (clickable)
│   ├── TagList.tsx          # Genre/location tags display
│   └── Discography.tsx      # Grid/table view with sorting
├── pages/
│   ├── AlbumPage.tsx        # Album/track detail page
│   ├── BandPage.tsx         # Band detail page with discography
│   └── CollectionPage.tsx   # User collection with infinite scroll
├── App.tsx                  # Router setup & React Query provider
└── main.tsx                 # Application entry point

API_ENDPOINTS.md             # Documentation of discovered API endpoints
```

## API Integration

### Endpoints Used

1. **Album/Track Details**: `POST /api/mobile/24/tralbum_details`
   - Fetches detailed information about an album or track
   - Parameters:
     - `band_id`: Artist ID (number)
     - `tralbum_type`: 'a' for album, 't' for track
     - `tralbum_id`: Album or track ID (number)

2. **Band Details**: `POST /api/mobile/24/band_details`
   - Fetches band information and complete discography
   - Parameters:
     - `band_id`: Artist ID (number)

3. **Fan Collection**: `POST /api/mobile/24/collection_items`
   - Fetches a user's Bandcamp collection with pagination
   - Parameters:
     - `fan_id`: User/fan ID (number)
     - `older_than`: Pagination token (string, optional)
     - `count`: Number of items per page (default: 40)
   - Returns paginated results with tokens for infinite scroll

### CORS Handling

Bandcamp's API doesn't allow direct browser requests due to CORS restrictions. This is solved using Vite's proxy feature:

**vite.config.ts**:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://bandcamp.com',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

The API client uses relative paths (`/api/...`) which Vite proxies to `https://bandcamp.com/api/...` during development.

## Routing

### Routes

- `/` - Collection page (user's Bandcamp collection)
- `/band/:bandId` - Band details page with discography
- `/album/:bandId/:tralbumType/:tralbumId` - Album or track details page

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

### Collection Page

- Display user's Bandcamp collection
- **Auto-loads all collection items** on page load (no manual pagination)
- **Status bar** showing real-time progress:
  - Collection items loaded
  - Album details being fetched in background
  - Visual spinner during active operations
- Switchable views: grid or table
- Sorting by title, artist name, release date, or date added (table view only)
- **Background Data Enrichment**: Automatically fetches album details for each collection item to get release dates
  - Initial load shows collection without release dates
  - Release dates progressively fill in as album details are fetched in background
  - Uses React Query caching - data persists across page reloads
  - Each album is only fetched once and cached permanently

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
- Band/label information (clickable)
- Genre and location tags
- Credits
- Complete track listing with:
  - Track numbers
  - Track titles
  - Durations (formatted as MM:SS)
- Pricing information
- Link to original Bandcamp page

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

## React Query Setup

### Configuration

The application uses React Query with aggressive caching and localStorage persistence:

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

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'bandcamp-cache',
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
- **Persistent cache** - Stored in localStorage as `bandcamp-cache` key
- Survives page reloads and browser restarts
- Each album/band is ~5-50KB of JSON data

**Cached data includes:**
- Album/track details (title, tracks, artwork IDs, credits, tags)
- Band details (bio, discography, social links)
- Collection pages (infinite scroll results)

**Cache invalidation:**
To clear the cache manually (if needed):
```javascript
localStorage.removeItem('bandcamp-cache')
```

### Custom Hooks

All hooks inherit the global caching configuration (Infinity staleTime, 24hr gcTime):

```typescript
// Fetch album/track details (cached permanently)
useAlbumDetails({ band_id, tralbum_type, tralbum_id })

// Fetch band details (cached permanently)
useBandDetails({ band_id })

// Fetch fan collection with infinite scroll pagination (cached permanently)
useFanCollection(fan_id)
// Returns: { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage }

// Enrich collection items with album details in background
useEnrichedCollectionItems(items: CollectionDisplayItem[])
// Returns: { items: CollectionDisplayItem[], stats: { total, pending, fetching, loaded } }
// - items: Enriched collection items with release_date field populated from album details
// - stats: Object tracking background fetch progress
// Uses React Query's useQueries to fetch all album details in parallel
// Each query is cached, so subsequent renders don't re-fetch
```

### Background Data Enrichment

The `useEnrichedCollectionItems` hook implements progressive enhancement for collection data:

**How it works:**
1. CollectionPage initially renders with basic collection data (no release dates)
2. `useEnrichedCollectionItems` triggers background queries for each album's details
3. As album details load, release dates are merged into collection items
4. React re-renders progressively as data arrives
5. All data is cached in localStorage, so subsequent visits are instant

**Benefits:**
- Fast initial render (doesn't wait for album details)
- Progressive enhancement (UI updates as data loads)
- Efficient caching (each album fetched only once)
- Persistent across sessions (stored in localStorage)
- No loading spinners needed - data appears organically

**Performance:**
- Uses React Query's `useQueries` for parallel fetching
- Limited to 1 retry per failed request
- Queries are marked as background enhancements (don't block UI)
- Cached with `staleTime: Infinity` (permanent cache)

## Development Setup

### Installation

```bash
npm install
```

### Running Development Server

```bash
npm run dev
```

Server runs at: http://localhost:5173/

### Building for Production

```bash
npm run build
```

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
   - Shows "Year" column (release year only)
   - Sorts by title, artist, or release date

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

2. **Table View**:
   - Compact tabular layout
   - Sortable columns adapt to mode:
     - Discography: Title, Artist, Year (release year)
     - Collection: Title, Artist, Released (year), Added (full date)
   - Click column headers to toggle sort direction
   - Visual indicators for current sort field and direction (↑↓)
   - Smaller thumbnails for efficient space usage

Both views:
- Support client-side sorting
- Maintain sort state when switching views
- Link to album detail pages
- Adapt date display based on mode

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

## Future Enhancements

Potential features to add:
- Search functionality
- Audio player for streaming tracks
- Genre/tag browsing
- Artist recommendations
- Responsive mobile optimization
- Keyboard navigation
- Loading skeletons instead of basic "Loading..." text
- Filter/search within collection
- Collection statistics and insights
- Export collection data
- Multiple collection view modes (compact, detailed, etc.)

## Testing

### Testing Different Content

**Band/Album Pages:**
1. Find a Bandcamp URL (e.g., https://artist.bandcamp.com)
2. Use browser DevTools to inspect API calls and get `band_id`
3. Navigate directly to `/band/{band_id}` in the browser

**Collection Page:**
1. The default collection uses `TEST_FAN_ID = 621507` in `CollectionPage.tsx`
2. To test with a different user's collection:
   - Find a Bandcamp user profile
   - Inspect API calls in DevTools to get their `fan_id`
   - Update the `TEST_FAN_ID` constant in `CollectionPage.tsx`
3. Test infinite scroll by scrolling to the bottom of the page

## Notes

- This is a read-only interface - no write operations to Bandcamp
- API endpoints are undocumented/unofficial and may change
- Respect Bandcamp's terms of service and rate limits
- For production deployment, consider implementing proper backend API proxy instead of Vite proxy
