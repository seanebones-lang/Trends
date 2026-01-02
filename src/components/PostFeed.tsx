import { useStore } from '../store';
import { format } from 'date-fns';
import { exportToCSV, exportToJSON } from '../utils/stats';

export default function PostFeed() {
  const { posts } = useStore();

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Post Feed</h2>
        <p className="text-gray-500">No posts available. Search for keywords to see posts.</p>
      </div>
    );
  }

  const getSentimentColor = (label?: string) => {
    if (label === 'positive') return 'bg-green-100 text-green-800 border-green-200';
    if (label === 'negative') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Post Feed</h2>
        <div className="flex gap-2">
          <ExportButton format="csv" />
          <ExportButton format="json" />
        </div>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {(post.author.name || post.author.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{post.author.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">@{post.author.username || 'unknown'}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {post.timestamp ? (() => {
                  try {
                    return format(new Date(post.timestamp), 'MMM dd, HH:mm');
                  } catch {
                    return 'Invalid date';
                  }
                })() : 'No date'}
              </div>
            </div>

            <p className="text-gray-800 mb-3">{post.text}</p>

            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mb-3 space-y-2">
                {post.media_urls.slice(0, 3).map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Post media ${idx + 1}`}
                    className="max-w-xs rounded-lg border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-semibold">❤️</span>
                  {post.metrics.likes}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold">🔄</span>
                  {post.metrics.retweets}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold">💬</span>
                  {post.metrics.replies}
                </span>
              </div>

              {post.sentiment && (
                <div
                  className={`px-3 py-1 rounded-full border text-xs font-medium ${getSentimentColor(
                    post.sentiment.label
                  )}`}
                >
                  {post.sentiment.label} ({post.sentiment.score.toFixed(2)})
                </div>
              )}
            </div>

            {post.sentiment?.reasoning && (
              <div className="mt-2 text-xs text-gray-500 italic">
                {post.sentiment.reasoning}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportButton({ format }: { format: 'csv' | 'json' }) {
  const { posts } = useStore();

  const handleExport = () => {
    if (!posts || posts.length === 0) return;
    
    const data = format === 'csv' ? exportToCSV(posts) : exportToJSON(posts);
    const blob = new Blob([data], {
      type: format === 'csv' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trends_export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
    >
      Export {format.toUpperCase()}
    </button>
  );
}
