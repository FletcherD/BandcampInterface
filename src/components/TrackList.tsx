import { formatDuration } from '../api/bandcamp';
import type { Track } from '../types/bandcamp';
import { useAlbumStreamingUrls, getTrackStreamingUrl } from '../api/streaming-queries';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

interface TrackListProps {
  tracks: Track[];
  albumUrl: string;
}

function TrackPlayer({ track, albumUrl, allTracks }: { track: Track; albumUrl: string; allTracks: Track[] }) {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudioPlayer();

  // Fetch streaming URLs for the entire album
  const { data: streamingUrls, isLoading } = useAlbumStreamingUrls(albumUrl);

  // Get URL and quality for this specific track
  const { url: streamUrl, quality } = getTrackStreamingUrl(streamingUrls, track.track_id);

  // Check if this track is currently playing
  const isCurrentTrack = currentTrack?.track_id === track.track_id;
  const isThisTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlay = () => {
    if (!streamUrl || !streamingUrls) return;

    if (isCurrentTrack) {
      // If this track is already loaded, just toggle play/pause
      togglePlayPause();
    } else {
      // Load and play this track
      playTrack(track, streamUrl, quality || 'standard', allTracks, streamingUrls);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled
          className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded cursor-wait"
        >
          Loading...
        </button>
      </div>
    );
  }

  if (!streamUrl) {
    return null; // No streaming URL available
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlay}
        className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
          isThisTrackPlaying
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : quality === 'hq'
            ? 'play-button-hq bg-green-600 hover:bg-green-700 text-white'
            : 'play-button-standard bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={
          isThisTrackPlaying
            ? 'Pause'
            : quality === 'hq'
            ? 'Play High Quality (MP3 V0)'
            : 'Play Standard Quality (128kbps)'
        }
      >
        <span>{isThisTrackPlaying ? '⏸' : '▶'}</span>
        <span>{isThisTrackPlaying ? 'Pause' : 'Play'}</span>
      </button>

      {/* Quality indicator */}
      {quality === 'hq' ? (
        <span
          className="quality-badge-hq text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded font-medium"
          title="High Quality - MP3 V0 (~245kbps)"
        >
          HQ
        </span>
      ) : (
        <span
          className="quality-badge-sd text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded font-medium"
          title="Standard Quality - 128kbps"
        >
          SD
        </span>
      )}
    </div>
  );
}

export default function TrackList({ tracks, albumUrl }: TrackListProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold mb-4">Tracks</h2>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {tracks.map((track) => (
          <div
            key={track.track_id}
            className="track-list-item py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 px-3 rounded transition-colors"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="track-number text-gray-500 dark:text-gray-400 w-8 text-right flex-shrink-0">
                {track.track_num}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{track.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="track-duration text-gray-500 dark:text-gray-400 text-sm">
                {formatDuration(track.duration)}
              </div>
              <TrackPlayer track={track} albumUrl={albumUrl} allTracks={tracks} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
