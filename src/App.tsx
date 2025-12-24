import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { createPerQueryPersister } from './lib/persister';
import CollectionPage from './pages/CollectionPage';
import WishlistPage from './pages/WishlistPage';
import BandPage from './pages/BandPage';
import AlbumPage from './pages/AlbumPage';
import StreamingTest from './pages/StreamingTest';

// Create a client with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache
      staleTime: Infinity, // Never refetch (album data rarely changes)
    },
  },
});

// Create IndexedDB persister that stores each query individually
// This allows caching 50MB+ of data efficiently (vs 5-10MB localStorage limit)
const persister = createPerQueryPersister({
  throttleTime: 1000, // Batch writes every 1 second
});

function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<CollectionPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/band/:bandId" element={<BandPage />} />
          <Route path="/album/:bandId/:tralbumType/:tralbumId" element={<AlbumPage />} />
          <Route path="/streaming-test" element={<StreamingTest />} />
        </Routes>
      </HashRouter>
    </PersistQueryClientProvider>
  );
}

export default App;
