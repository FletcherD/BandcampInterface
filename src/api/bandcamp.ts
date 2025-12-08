import type { AlbumDetails, AlbumDetailsRequest, BandDetails, BandDetailsRequest } from '../types/bandcamp';

// Use relative path to leverage Vite's proxy in development
const BANDCAMP_API_BASE = '/api';

export async function fetchAlbumDetails(
  request: AlbumDetailsRequest
): Promise<AlbumDetails> {
  const response = await fetch(`${BANDCAMP_API_BASE}/mobile/24/tralbum_details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch album details: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchBandDetails(
  request: BandDetailsRequest
): Promise<BandDetails> {
  const response = await fetch(`${BANDCAMP_API_BASE}/mobile/24/band_details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch band details: ${response.statusText}`);
  }

  return response.json();
}

// Helper to construct album art URL
export function getAlbumArtUrl(artId: number, size: number = 10): string {
  return `https://f4.bcbits.com/img/a${artId}_${size}.jpg`;
}

// Helper to construct band image URL
export function getBandImageUrl(imageId: number): string {
  return `https://f4.bcbits.com/img/${imageId}_3.jpg`;
}

// Helper to format duration in seconds to MM:SS
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper to format release date
export function formatReleaseDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
