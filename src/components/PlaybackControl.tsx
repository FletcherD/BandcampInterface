import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { formatDuration } from '../api/bandcamp';

export default function PlaybackControl() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
  } = useAudioPlayer();

  if (!currentTrack) {
    return null; // Don't show player if nothing is loaded
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Track info and controls */}
        <div className="flex items-center gap-4 mb-2">
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{currentTrack.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>{currentTrack.band_name}</span>
              {currentTrack.quality === 'hq' ? (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded font-medium">
                  HQ
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded font-medium">
                  SD
                </span>
              )}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={playPrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Previous track (or restart if > 3s)"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={playNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Next track"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Time display */}
          <div className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </div>
        </div>

        {/* Seek bar */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              background: `linear-gradient(to right, #2563eb ${progress}%, #e5e7eb ${progress}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
