import { useParams } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useAlbumDetails, useBandcampPageStyle } from '../api/queries';
import { formatReleaseDate } from '../api/bandcamp';
import AlbumArt from '../components/AlbumArt';
import TrackList from '../components/TrackList';
import BandInfo from '../components/BandInfo';
import TagList from '../components/TagList';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

function AlbumPageContent() {
  const { bandId, tralbumType, tralbumId } = useParams<{
    bandId: string;
    tralbumType: string;
    tralbumId: string;
  }>();

  const { theme, bandcampStyle, setBandcampStyle } = useTheme();

  const { data: album, isLoading, error } = useAlbumDetails({
    band_id: Number(bandId),
    tralbum_type: tralbumType!,
    tralbum_id: Number(tralbumId),
  });

  // Fetch and cache Bandcamp styling
  const { data: pageStyle, isError: styleError, isLoading: styleLoading } = useBandcampPageStyle(album?.bandcamp_url);

  // Update theme context when style is fetched
  useEffect(() => {
    if (pageStyle) {
      console.log('Successfully extracted Bandcamp style:', pageStyle);
      setBandcampStyle(pageStyle);
    } else if (styleError) {
      console.warn('Could not extract Bandcamp style (custom domain or CORS issue)');
      console.info('The Bandcamp theme will not be available for this album. Using default theme.');
      setBandcampStyle(null);
    }
  }, [pageStyle, styleError, setBandcampStyle]);

  // Generate CSS variables from extracted style
  const cssVariables = useMemo(() => {
    if (!bandcampStyle || theme !== 'bandcamp') return {};

    const vars: Record<string, string> = {};

    if (bandcampStyle.backgroundColor) {
      vars['--bc-bg-color'] = bandcampStyle.backgroundColor;
    }
    if (bandcampStyle.backgroundImage) {
      vars['--bc-bg-image'] = `url(${bandcampStyle.backgroundImage})`;
    }
    if (bandcampStyle.textColor) {
      vars['--bc-text-color'] = bandcampStyle.textColor;
      vars['--bc-text-secondary'] = `${bandcampStyle.textColor}B3`; // Add alpha for secondary text
    }
    if (bandcampStyle.linkColor) {
      vars['--bc-link-color'] = bandcampStyle.linkColor;
      vars['--bc-accent-color'] = bandcampStyle.linkColor; // Use link color as accent
    }
    if (bandcampStyle.accentColor) {
      vars['--bc-accent-color'] = bandcampStyle.accentColor;
    }
    if (bandcampStyle.secondaryBackgroundColor) {
      vars['--bc-secondary-bg'] = bandcampStyle.secondaryBackgroundColor;
      vars['--bc-secondary-bg-hover'] = bandcampStyle.secondaryBackgroundColor + 'E6'; // Slightly more opaque on hover
    }
    if (bandcampStyle.contentBackgroundColor) {
      vars['--bc-content-bg'] = bandcampStyle.contentBackgroundColor;
    }
    if (bandcampStyle.buttonBackgroundColor) {
      vars['--bc-button-bg'] = bandcampStyle.buttonBackgroundColor;
    }
    if (bandcampStyle.buttonTextColor) {
      vars['--bc-button-text'] = bandcampStyle.buttonTextColor;
    }

    // Set border color from text color with low opacity
    if (bandcampStyle.textColor) {
      vars['--bc-border-color'] = `${bandcampStyle.textColor}33`; // 20% opacity
    }

    return vars;
  }, [bandcampStyle, theme]);

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

  // Only apply bandcamp theme if the style is actually loaded
  // This prevents ugly intermediate state while style is loading
  const effectiveTheme = theme === 'bandcamp' && bandcampStyle ? 'bandcamp' : 'default';

  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      data-theme={effectiveTheme}
      data-has-bg-image={effectiveTheme === 'bandcamp' && !!bandcampStyle?.backgroundImage}
      style={cssVariables}
    >
      <ThemeToggle styleLoading={styleLoading} styleError={styleError} />
      <div className="max-w-6xl mx-auto p-6 album-page-content">
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

            {album.about && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">
                  About
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap about-text">
                  {album.about}
                </p>
              </div>
            )}

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
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap credits-text">
                  {album.credits}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <div className="text-3xl font-bold price-display">${album.price}</div>
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
          <TrackList tracks={album.tracks} albumUrl={album.bandcamp_url} />
        </div>
      </div>
    </div>
  );
}

// Wrap with ThemeProvider
export default function AlbumPage() {
  return (
    <ThemeProvider>
      <AlbumPageContent />
    </ThemeProvider>
  );
}
