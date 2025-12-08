import { useQuery } from '@tanstack/react-query';
import { fetchAlbumDetails } from './bandcamp';
import type { AlbumDetailsRequest } from '../types/bandcamp';

export function useAlbumDetails(request: AlbumDetailsRequest) {
  return useQuery({
    queryKey: ['album', request.tralbum_id],
    queryFn: () => fetchAlbumDetails(request),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
