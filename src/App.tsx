import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createPerQueryPersister } from './lib/persister';
import CollectionPage from './pages/CollectionPage';
import BandPage from './pages/BandPage';
import AlbumPage from './pages/AlbumPage';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CollectionPage />} />
          <Route path="/band/:bandId" element={<BandPage />} />
          <Route path="/album/:bandId/:tralbumType/:tralbumId" element={<AlbumPage />} />
        </Routes>
      </BrowserRouter>
    </PersistQueryClientProvider>
  );
}

export default App;
