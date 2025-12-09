import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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

export function useFanCollection(fanId: number) {
  return useInfiniteQuery({
    queryKey: ['collection', fanId],
    queryFn: ({ pageParam }) => fetchFanCollection({ fan_id: fanId, older_than: pageParam }),
    getNextPageParam: (lastPage) => {
      // Return the token of the last item for the next page
      const lastItem = lastPage.items[lastPage.items.length - 1];
      return lastItem?.token;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
