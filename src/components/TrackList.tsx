import { formatDuration } from '../api/bandcamp';
import type { Track } from '../types/bandcamp';

interface TrackListProps {
  tracks: Track[];
}

export default function TrackList({ tracks }: TrackListProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold mb-4">Tracks</h2>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {tracks.map((track) => (
          <div
            key={track.track_id}
            className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 px-3 rounded transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <span className="text-gray-500 dark:text-gray-400 w-8 text-right">
                {track.track_num}
              </span>
              <div className="flex-1">
                <div className="font-medium">{track.title}</div>
              </div>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              {formatDuration(track.duration)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
