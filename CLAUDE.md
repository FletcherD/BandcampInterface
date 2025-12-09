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
│   └── Discography.tsx      # Grid of albums/releases
├── pages/
│   ├── AlbumPage.tsx        # Album/track detail page
│   └── BandPage.tsx         # Band detail page with discography
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

- `/` - Redirects to the default band page (Constellation Tatsu)
- `/band/:bandId` - Band details page with discography
- `/album/:bandId/:tralbumType/:tralbumId` - Album or track details page

### Navigation Flow

1. **Band Page → Album Page**: Click any album in the discography grid
2. **Album Page → Band Page**: Click the band info card
3. All navigation uses React Router's `Link` component for client-side routing
4. URLs are shareable and bookmarkable

### Type Conversion

The discography API returns `item_type` as 'album' or 'track', but the album details API expects `tralbum_type` as 'a' or 't'. The Discography component handles this conversion:

```typescript
const getTrablumType = (itemType: string) => {
  return itemType === 'album' ? 'a' : 't';
};
```

## Key Features

### Band Page

- Band image and bio
- Social media links (Instagram, Twitter, Facebook, etc.)
- Complete discography grid with:
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

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
```

### Custom Hooks

```typescript
// Fetch album/track details
useAlbumDetails({ band_id, tralbum_type, tralbum_id })

// Fetch band details
useBandDetails({ band_id })
```

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
- `DiscographyItem` - Album/track in discography list
- `Tag` - Genre/location tag
- `BandSite` - Social media link

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
- User collection/wishlist views
- Genre/tag browsing
- Artist recommendations
- Responsive mobile optimization
- Infinite scroll for large discographies
- Keyboard navigation
- Loading skeletons instead of basic "Loading..." text

## Testing

To test with a different band or album:

1. Find a Bandcamp URL (e.g., https://artist.bandcamp.com)
2. Use browser DevTools to inspect API calls and get `band_id`
3. Update the `TEST_BAND_ID` constant in `App.tsx`
4. Or navigate directly to `/band/{band_id}` in the browser

## Notes

- This is a read-only interface - no write operations to Bandcamp
- API endpoints are undocumented/unofficial and may change
- Respect Bandcamp's terms of service and rate limits
- For production deployment, consider implementing proper backend API proxy instead of Vite proxy
