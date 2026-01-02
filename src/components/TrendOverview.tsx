import { useStore } from '../store';

export default function TrendOverview() {
  const { trends } = useStore();

  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Trending Topics</h2>
        <p className="text-gray-500">No trends detected yet. Search for keywords to see trending topics.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Trending Topics</h2>
      <div className="space-y-3">
        {trends.slice(0, 10).map((trend, index) => {
          const sentimentColor =
            trend.sentiment.label === 'positive'
              ? 'bg-green-100 text-green-800'
              : trend.sentiment.label === 'negative'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800';

          return (
            <div
              key={trend.keyword}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-gray-400">#{index + 1}</span>
                <span className="font-semibold text-gray-900">{trend.keyword}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${sentimentColor}`}>
                  {trend.sentiment.label}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {trend.volume} posts
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {(trend.sentiment.score * 100).toFixed(0)}% sentiment
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
