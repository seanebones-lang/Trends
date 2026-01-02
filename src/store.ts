import { create } from 'zustand';
import { XPost, TrendTopic, ApiKeys, SearchFilters, DashboardStats } from './types';

interface AppState {
  // API Keys
  apiKeys: ApiKeys;
  setApiKeys: (keys: Partial<ApiKeys>) => void;

  // Posts
  posts: XPost[];
  setPosts: (posts: XPost[]) => void;
  addPosts: (posts: XPost[]) => void;

  // Trends
  trends: TrendTopic[];
  setTrends: (trends: TrendTopic[]) => void;

  // Filters
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;

  // Stats
  stats: DashboardStats | null;
  setStats: (stats: DashboardStats) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Cache
  apiCache: Map<string, any>;
  setCacheValue: (key: string, value: any) => void;
  getCacheValue: (key: string) => any | null;
}

export const useStore = create<AppState>((set) => ({
  // API Keys
  apiKeys: {
    xApiKey: localStorage.getItem('xApiKey') || '',
    grokApiKey: localStorage.getItem('grokApiKey') || '',
  },
  setApiKeys: (keys) => {
    set((state) => {
      const newKeys = { ...state.apiKeys, ...keys };
      if (keys.xApiKey !== undefined) {
        localStorage.setItem('xApiKey', keys.xApiKey);
      }
      if (keys.grokApiKey !== undefined) {
        localStorage.setItem('grokApiKey', keys.grokApiKey);
      }
      return { apiKeys: newKeys };
    });
  },

  // Posts
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPosts: (posts) => set((state) => ({ posts: [...state.posts, ...posts] })),

  // Trends
  trends: [],
  setTrends: (trends) => set({ trends }),

  // Filters
  filters: {
    keyword: '',
    maxResults: 100,
  },
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  // Stats
  stats: null,
  setStats: (stats) => set({ stats }),

  // Loading
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // Error
  error: null,
  setError: (error) => set({ error }),

  // Cache
  apiCache: new Map(),
  setCacheValue: (key, value) =>
    set((state) => {
      const newCache = new Map(state.apiCache);
      newCache.set(key, value);
      return { apiCache: newCache };
    }),
  getCacheValue: (key) => {
    const state = useStore.getState();
    return state.apiCache.get(key) || null;
  },
}));
