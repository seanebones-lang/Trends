import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { fetchAndAnalyzePosts } from '../services/dataService';

export default function SearchBar() {
  const { filters, apiKeys, setFilters, isLoading, setError } = useStore();
  const [localKeyword, setLocalKeyword] = useState(filters.keyword || '');

  useEffect(() => {
    setLocalKeyword(filters.keyword);
  }, [filters.keyword]);

  const handleSearch = async () => {
    if (!localKeyword.trim()) {
      setError('Please enter a keyword to search');
      return;
    }

    if (!apiKeys.xApiKey) {
      setError('X API key is required. Please configure it in Settings.');
      return;
    }

    setFilters({ keyword: localKeyword.trim() });
    setError(null);

    try {
      await fetchAndAnalyzePosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter keyword or topic to analyze (e.g., 'artificial intelligence', 'crypto', etc.)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading || !localKeyword.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {!apiKeys.xApiKey && (
        <p className="mt-2 text-sm text-amber-600">
          ⚠️ X API key required. Click Settings to configure.
        </p>
      )}
    </div>
  );
}
