import { getAlbumArtUrl } from '../api/bandcamp';

interface AlbumArtProps {
  artId: number;
  title: string;
  size?: number;
}

export default function AlbumArt({ artId, title, size = 10 }: AlbumArtProps) {
  return (
    <img
      src={getAlbumArtUrl(artId, size)}
      alt={`${title} album art`}
      className="w-full h-auto rounded-lg shadow-lg"
    />
  );
}
