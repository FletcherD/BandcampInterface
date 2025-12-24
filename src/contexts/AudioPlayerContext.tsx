import { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Track } from '../types/bandcamp';

interface TrackWithUrl extends Track {
  streamUrl: string;
  quality: 'hq' | 'standard';
}

interface AudioPlayerContextType {
  currentTrack: TrackWithUrl | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playTrack: (track: Track, streamUrl: string, quality: 'hq' | 'standard', allTracks: Track[], streamingUrls: Map<number, { standard?: string; hq?: string }>) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackWithUrl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Store all tracks and streaming URLs for navigation
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [streamingUrls, setStreamingUrls] = useState<Map<number, { standard?: string; hq?: string }>>(new Map());

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      playNext(); // Auto-play next track
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const playTrack = (
    track: Track,
    streamUrl: string,
    quality: 'hq' | 'standard',
    tracks: Track[],
    urls: Map<number, { standard?: string; hq?: string }>
  ) => {
    const audio = audioRef.current;
    if (!audio) return;

    setAllTracks(tracks);
    setStreamingUrls(urls);

    const trackWithUrl: TrackWithUrl = {
      ...track,
      streamUrl,
      quality,
    };

    setCurrentTrack(trackWithUrl);
    audio.src = streamUrl;
    audio.play().catch(err => console.error('Failed to play:', err));
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Failed to play:', err));
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
  };

  const getStreamUrl = (track: Track): { url: string; quality: 'hq' | 'standard' } | null => {
    const urls = streamingUrls.get(track.track_id);
    if (!urls) return null;

    if (urls.hq) {
      return { url: urls.hq, quality: 'hq' };
    }
    if (urls.standard) {
      return { url: urls.standard, quality: 'standard' };
    }
    return null;
  };

  const playNext = () => {
    if (!currentTrack || allTracks.length === 0) return;

    const currentIndex = allTracks.findIndex(t => t.track_id === currentTrack.track_id);
    if (currentIndex === -1 || currentIndex === allTracks.length - 1) return; // Last track

    const nextTrack = allTracks[currentIndex + 1];
    const streamData = getStreamUrl(nextTrack);
    if (streamData) {
      playTrack(nextTrack, streamData.url, streamData.quality, allTracks, streamingUrls);
    }
  };

  const playPrevious = () => {
    if (!currentTrack || allTracks.length === 0) return;

    // If we're more than 3 seconds into the track, restart it
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    const currentIndex = allTracks.findIndex(t => t.track_id === currentTrack.track_id);
    if (currentIndex <= 0) return; // First track

    const previousTrack = allTracks[currentIndex - 1];
    const streamData = getStreamUrl(previousTrack);
    if (streamData) {
      playTrack(previousTrack, streamData.url, streamData.quality, allTracks, streamingUrls);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playTrack,
        togglePlayPause,
        seekTo,
        playNext,
        playPrevious,
        audioRef,
      }}
    >
      {children}
      <audio ref={audioRef} />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}
