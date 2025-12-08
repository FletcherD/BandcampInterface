import { Link } from 'react-router-dom';
import { getBandImageUrl } from '../api/bandcamp';
import type { BandInfo as BandInfoType } from '../types/bandcamp';

interface BandInfoProps {
  band: BandInfoType;
}

export default function BandInfo({ band }: BandInfoProps) {
  return (
    <Link
      to={`/band/${band.band_id}`}
      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
    >
      <img
        src={getBandImageUrl(band.image_id)}
        alt={band.name}
        className="w-16 h-16 rounded-full"
      />
      <div>
        <h3 className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400">
          {band.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{band.location}</p>
        {band.bio && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{band.bio}</p>
        )}
      </div>
    </Link>
  );
}
