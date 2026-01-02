import { useStore } from '../store';

export default function StatsCards() {
  const { stats } = useStore();

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const sentimentEmoji = stats.averageSentiment > 0.2 ? '😊' : stats.averageSentiment < -0.2 ? '😞' : '😐';
  const sentimentColor = stats.averageSentiment > 0.2 ? 'text-green-600' : stats.averageSentiment < -0.2 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500">Total Posts</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPosts.toLocaleString()}</div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500">Average Sentiment</div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-3xl">{sentimentEmoji}</span>
          <span className={`text-3xl font-bold ${sentimentColor}`}>
            {stats.averageSentiment.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500">Total Engagement</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">
          {stats.totalEngagement.toLocaleString()}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500">Trending Topics</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">
          {stats.trendingTopics}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500">Top Influencer</div>
        <div className="text-lg font-semibold text-gray-900 mt-2">
          {stats.topInfluencer ? `@${stats.topInfluencer.username}` : 'N/A'}
        </div>
        {stats.topInfluencer && (
          <div className="text-sm text-gray-500 mt-1">
            {stats.topInfluencer.followers.toLocaleString()} followers
          </div>
        )}
      </div>
    </div>
  );
}
