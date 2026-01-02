import { XPost, DashboardStats, TrendTopic } from '../types';

export function calculateStats(posts: XPost[], trends?: TrendTopic[]): DashboardStats {
  if (posts.length === 0) {
    return {
      totalPosts: 0,
      averageSentiment: 0,
      totalEngagement: 0,
      trendingTopics: 0,
    };
  }

  const totalPosts = posts.length;
  
  const postsWithSentiment = posts.filter(p => p.sentiment);
  const averageSentiment = postsWithSentiment.length > 0
    ? postsWithSentiment.reduce((sum, p) => sum + (p.sentiment?.score || 0), 0) / postsWithSentiment.length
    : 0;

  const totalEngagement = posts.reduce((sum, p) => {
    const metrics = p.metrics || { likes: 0, retweets: 0, replies: 0 };
    return sum + (metrics.likes || 0) + (metrics.retweets || 0) + (metrics.replies || 0);
  }, 0);

  // Find top influencer (highest follower count)
  const topInfluencer = posts.reduce((top, post) => {
    const followers = post.author.followersCount || 0;
    return !top || (post.author.followersCount || 0) > (top.followersCount || 0)
      ? { username: post.author.username, followers }
      : top;
  }, null as { username: string; followers: number } | null);

  return {
    totalPosts,
    averageSentiment,
    totalEngagement,
    trendingTopics: trends?.length || 0,
    topInfluencer: topInfluencer || undefined,
  };
}

export function detectTrends(posts: XPost[]): TrendTopic[] {
  const keywordCounts: Record<string, XPost[]> = {};
  const stopWords = new Set([
    'the', 'this', 'that', 'with', 'from', 'have', 'been', 'were', 'will', 'would',
    'could', 'should', 'about', 'into', 'through', 'during', 'after', 'before',
    'above', 'below', 'between', 'among', 'under', 'over', 'near', 'around',
    'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
    'very', 'just', 'also', 'even', 'still', 'than', 'then', 'there', 'these',
    'those', 'they', 'them', 'their', 'these', 'those', 'can', 'may', 'might',
    'must', 'shall', 'should', 'would', 'could', 'cannot', 'cant', 'dont',
    'doesnt', 'isnt', 'arent', 'wasnt', 'werent', 'hasnt', 'havent', 'hadnt'
  ]);

  posts.forEach(post => {
    if (!post.text) return;
    
    const words = post.text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    words.forEach(word => {
      if (!keywordCounts[word]) {
        keywordCounts[word] = [];
      }
      keywordCounts[word].push(post);
    });
  });

  return Object.entries(keywordCounts)
    .filter(([_, posts]) => posts.length >= 2) // At least 2 posts mentioning the keyword
    .map(([keyword, posts]) => {
      const sentimentScores = posts
        .filter(p => p.sentiment)
        .map(p => p.sentiment!.score);
      
      const avgSentiment = sentimentScores.length > 0
        ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
        : 0;

      let sentimentLabel: 'positive' | 'negative' | 'neutral';
      if (avgSentiment > 0.2) sentimentLabel = 'positive';
      else if (avgSentiment < -0.2) sentimentLabel = 'negative';
      else sentimentLabel = 'neutral';

      return {
        keyword,
        volume: posts.length,
        sentiment: {
          score: avgSentiment,
          label: sentimentLabel,
          confidence: Math.abs(avgSentiment),
        },
        posts,
        growthRate: 0,
        lastUpdated: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
}

export function exportToCSV(posts: XPost[]): string {
  const headers = ['ID', 'Text', 'Author', 'Likes', 'Retweets', 'Replies', 'Sentiment', 'Timestamp'];
  const rows = posts.map(post => [
    post.id || '',
    `"${(post.text || '').replace(/"/g, '""')}"`,
    post.author?.username || 'unknown',
    post.metrics?.likes || 0,
    post.metrics?.retweets || 0,
    post.metrics?.replies || 0,
    post.sentiment?.label || 'N/A',
    post.timestamp || '',
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function exportToJSON(posts: XPost[]): string {
  return JSON.stringify(posts, null, 2);
}
