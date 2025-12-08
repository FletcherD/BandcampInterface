import { getBandImageUrl } from '../api/bandcamp';
import type { BandInfo as BandInfoType } from '../types/bandcamp';

interface BandInfoProps {
  band: BandInfoType;
}

export default function BandInfo({ band }: BandInfoProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <img
        src={getBandImageUrl(band.image_id)}
        alt={band.name}
        className="w-16 h-16 rounded-full"
      />
      <div>
        <h3 className="text-lg font-semibold">{band.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{band.location}</p>
        {band.bio && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{band.bio}</p>
        )}
      </div>
    </div>
  );
}
