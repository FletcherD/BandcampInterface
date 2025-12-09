import { useMemo } from 'react';
import { useFanCollection } from '../api/queries';
import Discography from '../components/Discography';
import type { DiscographyItem } from '../types/bandcamp';

// Test fan_id from API_ENDPOINTS.md
const TEST_FAN_ID = 621507;

export default function CollectionPage() {
  const { data: collection, isLoading, error } = useFanCollection({ fan_id: TEST_FAN_ID });

  // Convert collection tracks to DiscographyItem format
  // Group tracks by album_id and create one item per album
  const albums = useMemo(() => {
    if (!collection?.track_list) return [];

    const albumMap = new Map<number, DiscographyItem>();

    collection.track_list.forEach((track) => {
      if (!albumMap.has(track.album_id)) {
        albumMap.set(track.album_id, {
          item_id: track.album_id,
          item_type: 'album',
          artist_name: track.band_name,
          band_name: track.label || track.band_name,
          title: track.album_title,
          art_id: track.art_id,
          release_date: '', // Not available in collection API
          is_purchasable: track.is_purchasable,
          band_id: track.band_id,
        });
      }
    });

    return Array.from(albumMap.values());
  }, [collection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading collection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">
          Error loading collection: {error.message}
        </div>
      </div>
    );
  }

  if (!albums.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No items in collection</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">My Collection</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {albums.length} album{albums.length !== 1 ? 's' : ''} in your collection
        </p>
        <Discography items={albums} />
      </div>
    </div>
  );
}
