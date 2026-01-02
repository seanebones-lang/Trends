import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from '../store';
import { format } from 'date-fns';

export default function TrendCharts() {
  const { posts } = useStore();

  const engagementData = useMemo(() => {
    if (posts.length === 0) return [];

    // Group posts by hour
    const hourlyData: Record<string, { time: string; likes: number; retweets: number; replies: number }> = {};

    posts.forEach((post) => {
      if (!post.timestamp) return;
      
      try {
        const date = new Date(post.timestamp);
        if (isNaN(date.getTime())) return;
        
        const hourKey = format(date, 'MMM dd HH:mm');

        if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          time: hourKey,
          likes: 0,
          retweets: 0,
          replies: 0,
        };
      }

        const metrics = post.metrics || { likes: 0, retweets: 0, replies: 0 };
        hourlyData[hourKey].likes += metrics.likes || 0;
        hourlyData[hourKey].retweets += metrics.retweets || 0;
        hourlyData[hourKey].replies += metrics.replies || 0;
      } catch {
        // Skip invalid dates
      }
    });

    return Object.values(hourlyData).slice(-20); // Last 20 data points
  }, [posts]);

  const sentimentData = useMemo(() => {
    if (posts.length === 0) return [];

    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    posts.forEach((post) => {
      if (post.sentiment) {
        sentimentCounts[post.sentiment.label]++;
      }
    });

    return [
      { label: 'Positive', value: sentimentCounts.positive, color: '#10b981' },
      { label: 'Negative', value: sentimentCounts.negative, color: '#ef4444' },
      { label: 'Neutral', value: sentimentCounts.neutral, color: '#6b7280' },
    ];
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Trend Charts</h2>
        <p className="text-gray-500">No data available. Search for keywords to see charts.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Engagement Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="likes" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="retweets" stroke="#82ca9d" strokeWidth={2} />
            <Line type="monotone" dataKey="replies" stroke="#ffc658" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Sentiment Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sentimentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
