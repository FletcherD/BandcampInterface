import { useQuery } from '@tanstack/react-query';
import { fetchAlbumDetails, fetchBandDetails } from './bandcamp';
import type { AlbumDetailsRequest, BandDetailsRequest } from '../types/bandcamp';

export function useAlbumDetails(request: AlbumDetailsRequest) {
  return useQuery({
    queryKey: ['album', request.tralbum_id],
    queryFn: () => fetchAlbumDetails(request),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBandDetails(request: BandDetailsRequest) {
  return useQuery({
    queryKey: ['band', request.band_id],
    queryFn: () => fetchBandDetails(request),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
