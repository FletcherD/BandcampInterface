export interface BandInfo {
  band_id: number;
  name: string;
  image_id: number;
  bio: string;
  location: string;
}

export interface StreamingUrl {
  "mp3-128": string;
  "mp3-v0"?: string;  // High quality - only available for owned tracks when authenticated
}

export interface Track {
  track_id: number;
  track_license_id: number | null;
  title: string;
  track_num: number;
  streaming_url: StreamingUrl;
  duration: number;
  encodings_id: number;
  album_title: string | null;
  band_name: string;
  art_id: number | null;
  album_id: number;
  is_streamable: boolean;
  has_lyrics: boolean;
  is_set_price: boolean;
  price: number;
  has_digital_download: boolean;
  merch_ids: number[] | null;
  merch_sold_out: boolean | null;
  currency: string;
  require_email: boolean;
  is_purchasable: boolean;
  band_id: number;
  label: string | null;
  label_id: number | null;
}

export interface Tag {
  name: string;
  norm_name: string;
  url: string;
  isloc: boolean;
  loc_id: number | null;
  geoname: {
    id: number;
    name: string;
    fullname: string;
  } | null;
}

export interface PackageDetails {
  title: string;
  image_ids: number[];
}

export interface AlbumDetails {
  id: number;
  type: string;
  title: string;
  bandcamp_url: string;
  art_id: number;
  band: BandInfo;
  tralbum_artist: string;
  package_art: number[];
  featured_track_id: number;
  tracks: Track[];
  credits: string;
  about: string | null;
  album_id: number;
  album_title: string;
  release_date: number;
  is_purchasable: boolean;
  free_download: boolean;
  is_preorder: boolean;
  tags: Tag[];
  currency: string;
  is_set_price: boolean;
  price: number;
  require_email: boolean;
  label: string | null;
  label_id: number | null;
  package_details_lite: Record<string, PackageDetails>;
  has_digital_download: boolean;
  num_downloadable_tracks: number;
  merch_sold_out: boolean;
  streaming_limit: number;
}

export interface AlbumDetailsRequest {
  band_id: number;
  tralbum_type: string;
  tralbum_id: number;
}

export interface BandSite {
  url: string;
  title: string;
}

export interface DiscographyItem {
  item_id: number;
  item_type: string;
  artist_name: string;
  band_name: string;
  title: string;
  art_id: number;
  release_date: string;
  is_purchasable: boolean;
  band_id: number;
}

export interface CollectionDisplayItem {
  item_id: number;
  item_type: string;
  artist_name: string;
  band_name: string;
  title: string;
  art_id: number;
  added_date: string;
  purchased_date?: string;
  release_date?: string;  // Fetched from album details in background
  is_purchasable: boolean;
  band_id: number;
  tralbum_type: string;  // Need this to fetch album details
}

export interface BandDetails {
  id: number;
  name: string;
  bio_image_id: number;
  bio_image_width: number;
  bio_image_height: number;
  bio: string;
  bandcamp_url: string;
  sites: BandSite[];
  discography: DiscographyItem[];
}

export interface BandDetailsRequest {
  band_id: number;
}

export interface CollectionTrack {
  track_id: number;
  track_license_id: number | null;
  title: string;
  track_num: number;
  streaming_url: StreamingUrl;
  duration: number;
  encodings_id: number;
  album_title: string;
  band_name: string;
  art_id: number;
  album_id: number;
  is_streamable: boolean;
  has_lyrics: boolean | null;
  is_set_price: boolean;
  price: number;
  has_digital_download: boolean | null;
  merch_ids: number[] | null;
  merch_sold_out: boolean | null;
  currency: string;
  require_email: boolean | null;
  is_purchasable: boolean;
  band_id: number;
  label: string | null;
  label_id: number | null;
}

export interface CollectionItem {
  fan_id: number;
  item_id: number;
  item_type: string;
  band_id: number;
  tralbum_id: number;
  tralbum_type: string;
  item_title: string;
  item_art_id: number;
  band_name: string;
  token: string;
  purchased?: string;
  added: string;
  // ... other fields available but not critical
}

export interface FanCollection {
  items: CollectionItem[];
  track_list: CollectionTrack[];
}

export interface FanCollectionRequest {
  fan_id: number;
  older_than?: string;
}

export interface CurrentUser {
  fan_id: number;
  username?: string;
  name?: string;
}

// Search API types

export interface AutocompleteSearchRequest {
  search_text: string;
  search_filter: string;
  fan_id: number;
  full_page: boolean;
}

export interface AutocompleteSearchResultBase {
  type: 'b' | 'a' | 't' | 'f';  // band, album, track, fan
  id: number;
  name: string;
  img?: string;
  item_url_root: string;
  stat_params: string;
}

export interface AutocompleteSearchResultBand extends AutocompleteSearchResultBase {
  type: 'b';
  img_id: number | null;
  location: string;
  is_label: boolean;
  tag_names: string[];
  genre_name: string;
  following: boolean;
}

export interface AutocompleteSearchResultAlbum extends AutocompleteSearchResultBase {
  type: 'a';
  art_id: number;
  band_id: number;
  band_name: string;
  item_url_path: string;
  tag_names: string[] | null;
}

export interface AutocompleteSearchResultTrack extends AutocompleteSearchResultBase {
  type: 't';
  art_id: number;
  band_id: number;
  band_name: string;
  album_name: string;
  album_id: number;
  item_url_path: string;
}

export interface AutocompleteSearchResultFan extends AutocompleteSearchResultBase {
  type: 'f';
  // Fans have minimal info in search results
}

export type AutocompleteSearchResult =
  | AutocompleteSearchResultBand
  | AutocompleteSearchResultAlbum
  | AutocompleteSearchResultTrack
  | AutocompleteSearchResultFan;

export interface AutocompleteSearchResponse {
  auto: {
    results: AutocompleteSearchResult[];
    stat_params_for_tag: string;
    time_ms: number;
  };
  tag: {
    matches: any[];
    count: number;
    time_ms: number;
  };
  genre: Record<string, any>;
}

export interface CollectionSearchRequest {
  fan_id: number;
  search_key: string;
  search_type: 'collection' | 'wishlist';
}

export interface CollectionSearchResponse {
  tralbums: CollectionItem[];
}

// Unified search result with source information
export type SearchResultSource = 'collection' | 'wishlist' | 'bandcamp';

export interface UnifiedSearchResult {
  id: string;  // Unique identifier: "{type}-{id}"
  type: 'band' | 'album' | 'track' | 'fan';
  name: string;
  band_name?: string;
  album_name?: string;
  url: string;
  image_url?: string;
  source: SearchResultSource;
  source_data: AutocompleteSearchResult | CollectionItem;
}
