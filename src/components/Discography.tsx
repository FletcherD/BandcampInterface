import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAlbumArtUrl } from '../api/bandcamp';
import type { DiscographyItem, CollectionDisplayItem } from '../types/bandcamp';

type ViewMode = 'grid' | 'table';
type SortDirection = 'asc' | 'desc';

interface DiscographyModeProps {
  mode: 'discography';
  items: DiscographyItem[];
}

interface CollectionModeProps {
  mode: 'collection';
  items: CollectionDisplayItem[];
}

type DiscographyProps = DiscographyModeProps | CollectionModeProps;

type DiscographySortField = 'title' | 'artist_name' | 'release_date';
type CollectionSortField = 'title' | 'artist_name' | 'release_date' | 'added_date';

const VIEW_MODE_STORAGE_KEY = 'discography-view-mode';

export default function Discography(props: DiscographyProps) {
  const { mode, items } = props;

  // Load saved view mode from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (saved === 'grid' || saved === 'table') ? saved : 'grid';
  });

  const [sortField, setSortField] = useState<DiscographySortField | CollectionSortField>(
    mode === 'discography' ? 'release_date' : 'added_date'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Convert item_type to tralbum_type format ('album' -> 'a', 'track' -> 't')
  const getTrablumType = (itemType: string) => {
    return itemType === 'album' ? 'a' : 't';
  };

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'artist_name':
          comparison = a.artist_name.localeCompare(b.artist_name);
          break;
        case 'release_date':
          if (mode === 'discography') {
            const aItem = a as DiscographyItem;
            const bItem = b as DiscographyItem;
            comparison = new Date(aItem.release_date || 0).getTime() - new Date(bItem.release_date || 0).getTime();
          } else {
            // Collection mode: sort by release_date if available
            const aItem = a as CollectionDisplayItem;
            const bItem = b as CollectionDisplayItem;
            const aDate = aItem.release_date ? new Date(aItem.release_date).getTime() : 0;
            const bDate = bItem.release_date ? new Date(bItem.release_date).getTime() : 0;
            comparison = aDate - bDate;
          }
          break;
        case 'added_date':
          if (mode === 'collection') {
            const aItem = a as CollectionDisplayItem;
            const bItem = b as CollectionDisplayItem;
            comparison = new Date(aItem.added_date || 0).getTime() - new Date(bItem.added_date || 0).getTime();
          }
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [items, sortField, sortDirection, mode]);

  const handleSort = (field: DiscographySortField | CollectionSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: DiscographySortField | CollectionSortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Discography</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortedItems.map((item) => {
            // Show release year if available
            let releaseYear: string | null = null;
            if (mode === 'discography') {
              const discItem = item as DiscographyItem;
              if (discItem.release_date) {
                releaseYear = new Date(discItem.release_date).getFullYear().toString();
              }
            } else {
              // Collection mode: show release year if fetched from album details
              const collItem = item as CollectionDisplayItem;
              if (collItem.release_date) {
                releaseYear = new Date(collItem.release_date).getFullYear().toString();
              }
            }

            return (
              <div key={item.item_id} className="group">
                <Link
                  to={`/album/${item.band_id}/${getTrablumType(item.item_type)}/${item.item_id}`}
                  className="block"
                >
                  <div className="relative aspect-square mb-2 overflow-hidden rounded-lg shadow-md">
                    <img
                      src={getAlbumArtUrl(item.art_id, 10)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium truncate hover:text-blue-600 dark:hover:text-blue-400">
                      {item.title}
                    </div>
                  </div>
                </Link>
                <div className="text-sm">
                  <Link
                    to={`/band/${item.band_id}`}
                    className="text-gray-600 dark:text-gray-400 truncate block hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {item.artist_name}
                  </Link>
                  {releaseYear && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {releaseYear}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 w-16"></th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    Title <SortIcon field="title" />
                  </div>
                </th>
                <th
                  className="text-left p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('artist_name')}
                >
                  <div className="flex items-center gap-2">
                    Artist <SortIcon field="artist_name" />
                  </div>
                </th>
                {mode === 'discography' ? (
                  <th
                    className="text-left p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('release_date')}
                  >
                    <div className="flex items-center gap-2">
                      Released <SortIcon field="release_date" />
                    </div>
                  </th>
                ) : (
                  <>
                    <th
                      className="text-left p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort('release_date')}
                    >
                      <div className="flex items-center gap-2">
                        Released <SortIcon field="release_date" />
                      </div>
                    </th>
                    <th
                      className="text-left p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => handleSort('added_date')}
                    >
                      <div className="flex items-center gap-2">
                        Added <SortIcon field="added_date" />
                      </div>
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => {
                if (mode === 'discography') {
                  const discItem = item as DiscographyItem;
                  const releaseDate = discItem.release_date
                    ? new Date(discItem.release_date).toLocaleDateString()
                    : '-';

                  return (
                    <tr
                      key={item.item_id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="p-3">
                        <Link to={`/album/${item.band_id}/${getTrablumType(item.item_type)}/${item.item_id}`}>
                          <img
                            src={getAlbumArtUrl(item.art_id, 2)}
                            alt={item.title}
                            className="w-12 h-12 rounded shadow-sm"
                          />
                        </Link>
                      </td>
                      <td className="p-3">
                        <Link
                          to={`/album/${item.band_id}/${getTrablumType(item.item_type)}/${item.item_id}`}
                          className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td className="p-3">
                        <Link
                          to={`/band/${item.band_id}`}
                          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {item.artist_name}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {releaseDate}
                      </td>
                    </tr>
                  );
                } else {
                  // Collection mode
                  const collItem = item as CollectionDisplayItem;
                  const releaseDate = collItem.release_date
                    ? new Date(collItem.release_date).toLocaleDateString()
                    : '-';
                  const addedDate = collItem.added_date
                    ? new Date(collItem.added_date).toLocaleDateString()
                    : '-';

                  return (
                    <tr
                      key={item.item_id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="p-3">
                        <Link to={`/album/${item.band_id}/${getTrablumType(item.item_type)}/${item.item_id}`}>
                          <img
                            src={getAlbumArtUrl(item.art_id, 2)}
                            alt={item.title}
                            className="w-12 h-12 rounded shadow-sm"
                          />
                        </Link>
                      </td>
                      <td className="p-3">
                        <Link
                          to={`/album/${item.band_id}/${getTrablumType(item.item_type)}/${item.item_id}`}
                          className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td className="p-3">
                        <Link
                          to={`/band/${item.band_id}`}
                          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {item.artist_name}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {releaseDate}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {addedDate}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
