import { useStore } from '../store';
import TrendOverview from './TrendOverview';
import TrendCharts from './TrendCharts';
import PostFeed from './PostFeed';
import StatsCards from './StatsCards';
import SearchBar from './SearchBar';
import LoadingSpinner from './LoadingSpinner';

export default function Dashboard() {
  const { error, isLoading, posts } = useStore();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">X Trend Analyzer</h1>
          <p className="text-gray-600">Monitor trends, analyze sentiment, and track engagement on X (Twitter)</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <SearchBar />
        
        {isLoading && <LoadingSpinner />}
        
        {!isLoading && posts.length > 0 && (
          <>
            <StatsCards />
            <TrendOverview />
            <TrendCharts />
            <PostFeed />
          </>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Analyze Trends</h2>
            <p className="text-gray-600 mb-4">
              Enter a keyword above and click Search to start analyzing X posts
            </p>
            <p className="text-sm text-gray-500">
              Make sure to configure your X API key in Settings (⚙️ button)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
