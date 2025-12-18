import { get, set, del, keys } from 'idb-keyval';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const QUERY_PREFIX = 'rq:query:';
const MUTATION_PREFIX = 'rq:mutation:';
const METADATA_KEY = 'rq:metadata';

/**
 * Creates a persister that stores each query individually in IndexedDB.
 * This is much more efficient than storing the entire cache as one blob,
 * especially when dealing with hundreds of queries.
 */
export function createPerQueryPersister(options: {
  throttleTime?: number;
} = {}): Persister {
  const throttleTime = options.throttleTime ?? 1000;
  let persistTimeout: ReturnType<typeof setTimeout> | null = null;
  let pendingClient: PersistedClient | null = null;

  // Helper to create a stable key from a query key
  const getQueryStorageKey = (queryKey: unknown[]): string => {
    return QUERY_PREFIX + JSON.stringify(queryKey);
  };

  const getMutationStorageKey = (mutationKey: string): string => {
    return MUTATION_PREFIX + mutationKey;
  };

  // Throttled persist function
  const doPersist = async (client: PersistedClient) => {
    try {
      // Store metadata (timestamps, version info, buster for cache validation)
      await set(METADATA_KEY, {
        timestamp: client.timestamp,
        buster: client.buster || '',
      });

      // Get all existing query keys from IndexedDB
      const allKeys = await keys();
      const existingQueryKeys = new Set(
        allKeys.filter((key) => typeof key === 'string' && key.startsWith(QUERY_PREFIX))
      );

      // Store each query individually
      const currentQueryKeys = new Set<string>();
      for (const query of client.clientState.queries) {
        const storageKey = getQueryStorageKey([...query.queryKey]);
        currentQueryKeys.add(storageKey);

        // Only write if needed (IndexedDB handles this efficiently)
        await set(storageKey, {
          queryKey: query.queryKey,
          queryHash: query.queryHash,
          state: query.state,
        });
      }

      // Clean up queries that no longer exist
      for (const existingKey of existingQueryKeys) {
        if (!currentQueryKeys.has(existingKey as string)) {
          await del(existingKey as string);
        }
      }

      // Store mutations (if any)
      if (client.clientState.mutations && client.clientState.mutations.length > 0) {
        for (const mutation of client.clientState.mutations) {
          const storageKey = getMutationStorageKey(mutation.mutationKey?.toString() || 'default');
          await set(storageKey, {
            mutationKey: mutation.mutationKey,
            state: mutation.state,
          });
        }
      }

      // Successfully persisted queries
    } catch (error) {
      console.error('[Persister] Error saving to IndexedDB:', error);
    }
  };

  return {
    persistClient: (client: PersistedClient) => {
      pendingClient = client;

      if (persistTimeout) {
        clearTimeout(persistTimeout);
      }

      persistTimeout = setTimeout(() => {
        if (pendingClient) {
          doPersist(pendingClient);
          pendingClient = null;
        }
      }, throttleTime);
    },

    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        // Get all keys from IndexedDB
        const allKeys = await keys();

        // Find all query keys
        const queryKeys = allKeys.filter(
          (key) => typeof key === 'string' && key.startsWith(QUERY_PREFIX)
        );

        if (queryKeys.length === 0) {
          return undefined;
        }

        // Load all queries in parallel
        const queries = await Promise.all(
          queryKeys.map(async (key) => {
            try {
              const data = await get(key as string);
              return data || null;
            } catch (err) {
              console.error(`[Persister] Error loading query ${key}:`, err);
              return null;
            }
          })
        );

        const validQueries = queries.filter(Boolean);

        // Load mutations
        const mutationKeys = allKeys.filter(
          (key) => typeof key === 'string' && key.startsWith(MUTATION_PREFIX)
        );
        const mutations = await Promise.all(
          mutationKeys.map(async (key) => {
            const data = await get(key as string);
            return data;
          })
        );

        // Load metadata
        const metadata = await get(METADATA_KEY);

        const restoredClient = {
          timestamp: metadata?.timestamp || Date.now(),
          buster: metadata?.buster || '',  // Must match the buster option passed to PersistQueryClientProvider
          clientState: {
            queries: validQueries,
            mutations: mutations.filter(Boolean),
          },
        };

        return restoredClient;
      } catch (error) {
        console.error('[Persister] Error restoring from IndexedDB:', error);
        return undefined;
      }
    },

    removeClient: async () => {
      try {
        // Get all keys and delete those with our prefixes
        const allKeys = await keys();
        const keysToDelete = allKeys.filter(
          (key) =>
            typeof key === 'string' &&
            (key.startsWith(QUERY_PREFIX) ||
              key.startsWith(MUTATION_PREFIX) ||
              key === METADATA_KEY)
        );

        await Promise.all(keysToDelete.map((key) => del(key as string)));
      } catch (error) {
        console.error('[Persister] Error clearing IndexedDB:', error);
      }
    },
  };
}
