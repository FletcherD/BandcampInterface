import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Test band data - Constellation Tatsu
const TEST_BAND_ID = 2197988008;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={`/band/${TEST_BAND_ID}`} replace />} />
          <Route path="/band/:bandId" element={<BandPage />} />
          <Route path="/album/:bandId/:tralbumType/:tralbumId" element={<AlbumPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
