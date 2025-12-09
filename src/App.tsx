import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CollectionPage from './pages/CollectionPage';
import BandPage from './pages/BandPage';
import AlbumPage from './pages/AlbumPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CollectionPage />} />
          <Route path="/band/:bandId" element={<BandPage />} />
          <Route path="/album/:bandId/:tralbumType/:tralbumId" element={<AlbumPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
