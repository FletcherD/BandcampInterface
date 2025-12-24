import { useState } from 'react';
import {
  fetchAlbumDetails,
  extractStreamingUrlsFromPage,
  testStreamUrl,
  refreshStreamUrl,
} from '../api/bandcamp';

export default function StreamingTest() {
  const [bandId, setBandId] = useState('2197988008');
  const [tralbumId, setTrablumId] = useState('3616265308');
  const [tralbumType, setTrablumType] = useState<'a' | 't'>('a');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const testMobileAPI = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('Testing mobile API...');
      const albumDetails = await fetchAlbumDetails({
        band_id: parseInt(bandId),
        tralbum_type: tralbumType,
        tralbum_id: parseInt(tralbumId),
      });

      const firstTrack = albumDetails.tracks[0];

      const result = {
        albumTitle: albumDetails.title,
        trackTitle: firstTrack.title,
        trackId: firstTrack.track_id,
        standardUrl: firstTrack.streaming_url['mp3-128'],
        hqUrl: firstTrack.streaming_url['mp3-v0'],
        hasHQ: !!firstTrack.streaming_url['mp3-v0'],
        allTracks: albumDetails.tracks.map((t) => ({
          title: t.title,
          id: t.track_id,
          hasStandard: !!t.streaming_url['mp3-128'],
          hasHQ: !!t.streaming_url['mp3-v0'],
        })),
      };

      console.log('Mobile API Result:', result);
      setResults({ type: 'mobile-api', data: result });
    } catch (error) {
      console.error('Error testing mobile API:', error);
      setResults({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const testPageScraping = async () => {
    setLoading(true);
    setResults(null);

    try {
      console.log('Testing page scraping...');
      const albumDetails = await fetchAlbumDetails({
        band_id: parseInt(bandId),
        tralbum_type: tralbumType,
        tralbum_id: parseInt(tralbumId),
      });

      console.log('Scraping URL:', albumDetails.bandcamp_url);
      const streamingUrls = await extractStreamingUrlsFromPage(
        albumDetails.bandcamp_url
      );

      const urlsArray = Array.from(streamingUrls.entries()).map(
        ([trackId, urls]) => ({
          trackId,
          standard: urls.standard,
          hq: urls.hq,
        })
      );

      console.log('Page Scraping Result:', urlsArray);
      setResults({ type: 'page-scraping', data: urlsArray });
    } catch (error) {
      console.error('Error testing page scraping:', error);
      setResults({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const testUrlValidity = async (url: string) => {
    setLoading(true);

    try {
      console.log('Testing URL:', url);
      const testResult = await testStreamUrl(url);
      console.log('Test Result:', testResult);

      if (!testResult.ok) {
        console.log('URL is invalid, trying to refresh...');
        const refreshed = await refreshStreamUrl(url);
        console.log('Refreshed URL:', refreshed);

        setResults({
          type: 'url-test',
          data: { original: url, valid: false, refreshed },
        });
      } else {
        setResults({
          type: 'url-test',
          data: { original: url, valid: true },
        });
      }
    } catch (error) {
      console.error('Error testing URL:', error);
      setResults({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const playTrack = async (url: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.remove();
    }

    const audio = new Audio(url);
    audio.controls = true;
    audio.autoplay = true;

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      alert('Failed to play audio. URL may be invalid or expired.');
    });

    audio.addEventListener('canplay', () => {
      console.log('Audio ready to play');
    });

    setCurrentAudio(audio);
    document.getElementById('audio-container')?.appendChild(audio);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Streaming URL Test Page
        </h1>

        {/* Input Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Test Album/Track
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Band ID
              </label>
              <input
                type="text"
                value={bandId}
                onChange={(e) => setBandId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="2197988008"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Tralbum ID
              </label>
              <input
                type="text"
                value={tralbumId}
                onChange={(e) => setTrablumId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="3616265308"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                value={tralbumType}
                onChange={(e) => setTrablumType(e.target.value as 'a' | 't')}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="a">Album</option>
                <option value="t">Track</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <strong>Tip:</strong> Use an album/track that you own to test HQ
              streaming URLs. Find IDs by inspecting network requests on
              Bandcamp.
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={testMobileAPI}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Test Mobile API
            </button>

            <button
              onClick={testPageScraping}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              Test Page Scraping
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="animate-pulse">Loading...</div>
          </div>
        )}

        {results && results.type === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-red-900 dark:text-red-200">
              Error
            </h2>
            <pre className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
              {results.error}
            </pre>
          </div>
        )}

        {results && results.type === 'mobile-api' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Mobile API Results
            </h2>

            <div className="space-y-4">
              <div>
                <strong className="text-gray-700 dark:text-gray-300">
                  Album:
                </strong>{' '}
                <span className="text-gray-900 dark:text-white">
                  {results.data.albumTitle}
                </span>
              </div>

              <div>
                <strong className="text-gray-700 dark:text-gray-300">
                  First Track:
                </strong>{' '}
                <span className="text-gray-900 dark:text-white">
                  {results.data.trackTitle}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <div className="mb-2">
                  <strong className="text-gray-700 dark:text-gray-300">
                    Has HQ (mp3-v0):
                  </strong>{' '}
                  <span
                    className={
                      results.data.hasHQ ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {results.data.hasHQ ? '✓ YES' : '✗ NO'}
                  </span>
                </div>

                {results.data.standardUrl && (
                  <div className="mb-3">
                    <strong className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Standard URL (mp3-128):
                    </strong>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={results.data.standardUrl}
                        className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border rounded font-mono"
                      />
                      <button
                        onClick={() => testUrlValidity(results.data.standardUrl)}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => playTrack(results.data.standardUrl)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Play
                      </button>
                    </div>
                  </div>
                )}

                {results.data.hqUrl && (
                  <div>
                    <strong className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      HQ URL (mp3-v0):
                    </strong>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={results.data.hqUrl}
                        className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border rounded font-mono"
                      />
                      <button
                        onClick={() => testUrlValidity(results.data.hqUrl)}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => playTrack(results.data.hqUrl)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Play HQ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                  All Tracks ({results.data.allTracks.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {results.data.allTracks.map((track: any) => (
                    <div
                      key={track.id}
                      className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {track.title}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Standard: {track.hasStandard ? '✓' : '✗'} | HQ:{' '}
                        {track.hasHQ ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        )}

        {results && results.type === 'page-scraping' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Page Scraping Results
            </h2>

            <div className="space-y-3">
              {results.data.map((item: any) => (
                <div
                  key={item.trackId}
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Track ID: {item.trackId}
                  </div>

                  {item.standard && (
                    <div className="mb-2">
                      <strong className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                        Standard:
                      </strong>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={item.standard}
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border rounded font-mono"
                        />
                        <button
                          onClick={() => playTrack(item.standard)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  )}

                  {item.hq && (
                    <div>
                      <strong className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                        HQ:
                      </strong>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={item.hq}
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border rounded font-mono"
                        />
                        <button
                          onClick={() => playTrack(item.hq)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Play HQ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {results && results.type === 'url-test' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              URL Test Results
            </h2>

            <div className="space-y-3">
              <div>
                <strong className="text-gray-700 dark:text-gray-300">
                  Valid:
                </strong>{' '}
                <span
                  className={
                    results.data.valid ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {results.data.valid ? '✓ YES' : '✗ NO'}
                </span>
              </div>

              {results.data.refreshed && (
                <div>
                  <strong className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Refreshed URL:
                  </strong>
                  <input
                    type="text"
                    readOnly
                    value={results.data.refreshed}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border rounded font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio Container */}
        <div id="audio-container" className="space-y-2"></div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-200">
            How to Use This Test Page
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>
              Enter Band ID and Tralbum ID (find these by inspecting network
              requests on Bandcamp)
            </li>
            <li>Click "Test Mobile API" to see what the mobile API returns</li>
            <li>
              Click "Test Page Scraping" to extract URLs from the album page
              HTML
            </li>
            <li>
              Use the "Play" buttons to test if streaming URLs actually work
            </li>
            <li>
              Check browser console for detailed logs and API responses
            </li>
          </ol>

          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded">
            <strong className="text-gray-900 dark:text-white">
              Test with your own album:
            </strong>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              To find IDs for an album you own:
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 ml-4 mt-1">
              <li>Go to the album page on Bandcamp</li>
              <li>Open DevTools → Network tab</li>
              <li>Play a track</li>
              <li>
                Look for requests to{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  /api/mobile/24/tralbum_details
                </code>
              </li>
              <li>
                Check the request payload for{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  band_id
                </code>{' '}
                and{' '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                  tralbum_id
                </code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
