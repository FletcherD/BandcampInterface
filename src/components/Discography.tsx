import { Link } from 'react-router-dom';
import { getAlbumArtUrl } from '../api/bandcamp';
import type { DiscographyItem } from '../types/bandcamp';

interface DiscographyProps {
  items: DiscographyItem[];
}

export default function Discography({ items }: DiscographyProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Discography</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {items.map((item) => (
          <Link
            key={item.item_id}
            to={`/album/${item.band_id}/${item.item_type}/${item.item_id}`}
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
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(item.release_date).getFullYear()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
