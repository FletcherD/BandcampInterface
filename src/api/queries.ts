import { useQuery } from '@tanstack/react-query';
import { fetchAlbumDetails, fetchBandDetails, fetchFanCollection } from './bandcamp';
import type { AlbumDetailsRequest, BandDetailsRequest, FanCollectionRequest } from '../types/bandcamp';

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

export function useFanCollection(request: FanCollectionRequest) {
  return useQuery({
    queryKey: ['collection', request.fan_id],
    queryFn: () => fetchFanCollection(request),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
