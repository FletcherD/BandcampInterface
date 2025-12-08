import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BandPage from './pages/BandPage';

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
      <BandPage bandId={TEST_BAND_ID} />
    </QueryClientProvider>
  );
}

export default App;
