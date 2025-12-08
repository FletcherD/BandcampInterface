import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AlbumPage from './pages/AlbumPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Test album data from API_ENDPOINTS.md
const TEST_ALBUM = {
  bandId: 2197988008,
  tralbumType: 'a',
  tralbumId: 3616265308,
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AlbumPage
        bandId={TEST_ALBUM.bandId}
        tralbumType={TEST_ALBUM.tralbumType}
        tralbumId={TEST_ALBUM.tralbumId}
      />
    </QueryClientProvider>
  );
}

export default App;
