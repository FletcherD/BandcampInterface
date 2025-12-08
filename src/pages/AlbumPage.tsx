import { useParams } from 'react-router-dom';
import { useAlbumDetails } from '../api/queries';
import { formatReleaseDate } from '../api/bandcamp';
import AlbumArt from '../components/AlbumArt';
import TrackList from '../components/TrackList';
import BandInfo from '../components/BandInfo';
import TagList from '../components/TagList';

export default function AlbumPage() {
  const { bandId, tralbumType, tralbumId } = useParams<{
    bandId: string;
    tralbumType: string;
    tralbumId: string;
  }>();

  const { data: album, isLoading, error } = useAlbumDetails({
    band_id: Number(bandId),
    tralbum_type: tralbumType!,
    tralbum_id: Number(tralbumId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">
          Error loading album: {error.message}
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Album not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left column - Album art */}
          <div>
            <AlbumArt artId={album.art_id} title={album.title} />
          </div>

          {/* Right column - Album info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
              <h2 className="text-2xl text-gray-600 dark:text-gray-400 mb-4">
                {album.tralbum_artist}
              </h2>
              <p className="text-gray-500 dark:text-gray-500">
                Released {formatReleaseDate(album.release_date)}
              </p>
            </div>

            <BandInfo band={album.band} />

            {album.tags && album.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
                  Tags
                </h3>
                <TagList tags={album.tags} />
              </div>
            )}

            {album.credits && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
                  Credits
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {album.credits}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <div className="text-3xl font-bold">${album.price}</div>
              <a
                href={album.bandcamp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                View on Bandcamp
              </a>
            </div>
          </div>
        </div>

        {/* Track list */}
        <div className="mt-8">
          <TrackList tracks={album.tracks} />
        </div>
      </div>
    </div>
  );
}
