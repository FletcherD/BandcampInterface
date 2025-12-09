import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAlbumArtUrl } from '../api/bandcamp';
import type { DiscographyItem } from '../types/bandcamp';

interface DiscographyProps {
  items: DiscographyItem[];
}

type ViewMode = 'grid' | 'table';
type SortField = 'title' | 'artist_name' | 'release_date';
type SortDirection = 'asc' | 'desc';

export default function Discography({ items }: DiscographyProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('release_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
          comparison = new Date(a.release_date || 0).getTime() - new Date(b.release_date || 0).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [items, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
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
          {sortedItems.map((item) => (
            <Link
              key={item.item_id}
              to={`/album/${item.band_id}/${getTrablumType(item.item_type)}/${item.item_id}`}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square mb-2 overflow-hidden rounded-lg shadow-md">
                <img
                  src={getAlbumArtUrl(item.art_id, 10)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="text-sm">
                <div className="font-medium truncate">{item.title}</div>
                <div className="text-gray-600 dark:text-gray-400 truncate">
                  {item.artist_name}
                </div>
                {item.release_date && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(item.release_date).getFullYear()}
                  </div>
                )}
              </div>
            </Link>
          ))}
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
                <th
                  className="text-left p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort('release_date')}
                >
                  <div className="flex items-center gap-2">
                    Year <SortIcon field="release_date" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
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
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {item.artist_name}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {item.release_date ? new Date(item.release_date).getFullYear() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
