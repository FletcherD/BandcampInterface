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

### 14. User 
- **Endpoint**: `POST /api/mobile/24/fan_wishlist`
- **Purpose**: Get a user's wishlist
- **Parameters**:
  - `fan_id`: User's fan ID
  - `older_than`: Pagination token
- **Authentication**: None required (public access with fan_id)

An example valid album detail query that can be used for testing: {"band_id":2197988008, "tralbum_type":"a", "tralbum_id":3616265308}
An example valid track detail query that can be used for testing: {"band_id":2197988008, "tralbum_type":"t", "tralbum_id":2875186876}
An example valid user collection/wishlist query that can be used for testing: {"fan_id":621507}

## Pagination

Some endpoints return results one page at a time. For these endpoints, each entry returned (e.g. an album returned from fan_collection) includes a 'token' field. By calling the endpoint with the pagination token of the last entry, the next page of results is returned.
