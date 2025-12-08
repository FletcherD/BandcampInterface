import { useBandDetails } from '../api/queries';
import { getBandImageUrl } from '../api/bandcamp';
import Discography from '../components/Discography';

interface BandPageProps {
  bandId: number;
}

export default function BandPage({ bandId }: BandPageProps) {
  const { data: band, isLoading, error } = useBandDetails({ band_id: bandId });

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
          Error loading band: {error.message}
        </div>
      </div>
    );
  }

  if (!band) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Band not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Band Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Band Image */}
          <div className="flex-shrink-0">
            <img
              src={getBandImageUrl(band.bio_image_id)}
              alt={band.name}
              className="w-64 h-64 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Band Info */}
          <div className="flex-1 space-y-4">
            <h1 className="text-5xl font-bold">{band.name}</h1>

            {band.bio && (
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {band.bio}
              </p>
            )}

            {/* Links */}
            {band.sites.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Links
                </h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={band.bandcamp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Bandcamp
                  </a>
                  {band.sites.map((site, index) => (
                    <a
                      key={index}
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      {site.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Discography */}
        {band.discography.length > 0 && (
          <Discography items={band.discography} />
        )}
      </div>
    </div>
  );
}
