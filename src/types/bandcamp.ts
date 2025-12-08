export interface BandInfo {
  band_id: number;
  name: string;
  image_id: number;
  bio: string;
  location: string;
}

export interface StreamingUrl {
  "mp3-128": string;
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
