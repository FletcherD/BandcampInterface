## Discovered API Endpoints

Root domain: bandcamp.com

### 1. Design System / User Session
- **Endpoint**: `POST /api/design_system/1/menubar`
- **Purpose**: Get current user session data, cart info, connected bands
- **Authentication**: Requires login cookies

### 2. Fan Collection Summary  
- **Endpoint**: `GET /api/fan/2/collection_summary`
- **Purpose**: Get the logged in user's complete collection summary with purchase dates
- **Authentication**: Requires login cookies

### 3. Collection Items (Paginated)
- **Endpoint**: `POST /api/fancollection/1/collection_items`
- **Purpose**: Get a user's collection items with pagination
- **Parameters**: 
  - `fan_id`: User's fan ID
  - `older_than_token`: Pagination token
  - `count`: Items per page (default: 20)
- **Authentication**: None required (public access with fan_id)

### 4. Album Reviews (Initial)
- **Endpoint**: `POST /api/tralbumcollectors/2/initial`
- **Purpose**: Get initial reviews and thumbs for an album
- **Parameters**:
  - `tralbum_id`: Album/track ID
  - `tralbum_type`: 'a' for album, 't' for track
  - `reviews_count`: Number of reviews (default: 6)
  - `thumbs_count`: Number of thumbs (default: 66)

### 5. Album Reviews (Paginated)
- **Endpoint**: `POST /api/tralbumcollectors/2/reviews`
- **Purpose**: Get paginated album reviews (works from main domain)
- **Parameters**:
  - `tralbum_id`: Album/track ID
  - `token`: Pagination token
  - `count`: Reviews per page

### 6. Music Discovery
- **Endpoint**: `POST /api/discover/1/discover_web`  
- **Purpose**: Search/discover music by genre, location, category
- **Parameters**:
  - `tag_norm_names`: Array of genre tags (e.g., ["experimental"])
  - `category_id`: Category filter (0 for all)
  - `geoname_id`: Location filter (0 for all)
  - `slice`: "top", "new", etc.
  - `cursor`: Pagination cursor
  - `size`: Results per page (max 60)

### 7. Top Album Review
- **Endpoint**: `POST /api/discover/1/get_top_review`
- **Purpose**: Get featured/top review for an album
- **Parameters**:
  - `album_id`: The album ID

### 8. Editorial Recommendations
- **Endpoint**: `POST /api/design_system/1/editorial_recommendations`
- **Purpose**: Get Bandcamp Daily editorial features and recommendations
- **Authentication**: None required

### 9. Genre Preferences
- **Endpoint**: `POST /api/genrepreferences/1/open_genre_preferences`
- **Purpose**: Get user's followed genres
- **Authentication**: Requires login cookies

### 10. Following Bands
- **Endpoint**: `POST /api/fancollection/1/following_bands`
- **Purpose**: Get bands that a user follows
- **Parameters**:
  - `fan_id`: User's fan ID
  - `older_than_token`: Pagination token
  - `count`: Bands per page (default: 20)
- **Authentication**: None required (public access with fan_id)

### 11. Wishlist Items
- **Endpoint**: `POST /api/fancollection/1/wishlist_items`
- **Purpose**: Get items from user's wishlist
- **Parameters**:
  - `fan_id`: User's fan ID
  - `older_than_token`: Pagination token
  - `count`: Items per page (default: 20)
- **Authentication**: None required (public access with fan_id)

### 12. Band Details
- **Endpoint**: `POST /api/mobile/24/band_details`
- **Purpose**: Get information on an artist
- **Parameters**:
  - `band_id`: Artist ID
- **Authentication**: None required (public access with fan_id)

### 13. Album/Track Details
- **Endpoint**: `POST /api/mobile/24/tralbum_details`
- **Purpose**: Get information on an album
- **Parameters**:
  - `band_id`: Artist ID
  - `tralbum_type`: 'a' for album or 't' for track
  - `tralbum_id`: Track or album ID
- **Authentication**: None required (public access with fan_id)

### 14. User Collection
- **Endpoint**: `POST /api/mobile/24/fan_collection`
- **Purpose**: Get a user's collection
- **Parameters**:
  - `fan_id`: User's fan ID
  - `older_than`: Pagination token
- **Authentication**: None required (public access with fan_id)

### 15. User Wishlist
- **Endpoint**: `POST /api/mobile/24/fan_wishlist`
- **Purpose**: Get a user's wishlist
- **Parameters**:
  - `fan_id`: User's fan ID
  - `older_than`: Pagination token
- **Authentication**: None required (public access with fan_id)

### 16. Autocomplete Search (Elastic)
- **Endpoint**: `POST /api/bcsearch_public_api/1/autocomplete_elastic`
- **Purpose**: Global search autocomplete across all of Bandcamp (bands, albums, tracks, fans)
- **Parameters**:
  - `search_text`: Search query string
  - `search_filter`: Filter type (empty string for all, or specific type)
  - `fan_id`: User's fan ID (for personalization, e.g., showing followed status)
  - `full_page`: Boolean - whether this is for full page results (false for autocomplete dropdown)
- **Authentication**: Optional (works without login, but shows personalized data with cookies)
- **Returns**: JSON object with:
  - `auto.results[]`: Array of search results
    - `type`: Result type ('b' = band/artist, 'a' = album, 't' = track, 'f' = fan)
    - `id`: Item ID (band_id, album_id, track_id, or fan_id)
    - `name`: Item name/title
    - `item_url_root`: Base Bandcamp URL for the item
    - `item_url_path`: Full URL path (for albums/tracks)
    - `band_name`: Artist name (for albums/tracks)
    - `album_name`: Album name (for tracks)
    - `img`: Image URL (album art or band image)
    - `location`: Location string (for bands)
    - `tag_names[]`: Array of genre tags (for bands)
    - `genre_name`: Primary genre (for bands)
    - `following`: Boolean - whether user follows this band (requires authentication)
    - `stat_params`: Search analytics parameters
  - `tag.matches[]`: Tag/genre suggestions
  - `genre`: Genre-related matches
- **Notes**:
  - Returns up to 50 results per request
  - Results are ranked by relevance (search_rank field)
  - Very fast response time (~50-200ms)
  - Used for live search/autocomplete functionality

### 17. Collection/Wishlist Search
- **Endpoint**: `POST /api/fancollection/1/search_items`
- **Purpose**: Search within a user's collection or wishlist
- **Parameters**:
  - `fan_id`: User's fan ID (number)
  - `search_key`: Search query string (can be partial, e.g., "s", "so", "some artist")
  - `search_type`: Type of search - either "collection" or "wishlist"
- **Authentication**: Requires login cookies (must be the same user as fan_id)
- **Returns**: JSON object with:
  - `tralbums[]`: Array of matching albums/tracks from collection/wishlist
    - All standard collection item fields (see Collection Items endpoint)
    - Includes: `item_title`, `band_name`, `item_url`, `item_art_id`, `added`, `purchased`, etc.
    - Each item is a full collection item object with metadata
- **Notes**:
  - Searches across album titles, artist names, and other metadata
  - Returns results as user types (incremental search)
  - Results are not paginated - returns all matches
  - Case-insensitive search
  - Matches partial strings (e.g., "so" matches "Sosa", "Resolve", "Nuits Sonores")

## UNKNOWN Endpoints
- POST `/api/mobile/24/collected_by`
- Params: {tralbum_keys}


### Example Queries

**Album Details:**
```json
{"band_id":2197988008, "tralbum_type":"a", "tralbum_id":3616265308}
```

**Track Details:**
```json
{"band_id":2197988008, "tralbum_type":"t", "tralbum_id":2875186876}
```

**User Collection/Wishlist:**
```json
{"fan_id":621507}
```

**Autocomplete Search:**
```json
{"search_text":"twoism", "search_filter":"", "fan_id":621507, "full_page":false}
```

**Collection Search:**
```json
{"fan_id":621507, "search_key":"so", "search_type":"collection"}
```

**Wishlist Search:**
```json
{"fan_id":621507, "search_key":"ambient", "search_type":"wishlist"}
```

## Pagination

Some endpoints return results one page at a time. For these endpoints, each entry returned (e.g. an album returned from fan_collection) includes a 'token' field. By calling the endpoint with the pagination token of the last entry, the next page of results is returned.
older_than_token can be set to '9999999999::a::' for the first page of results.
