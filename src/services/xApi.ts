import { XPost, SearchFilters } from '../types';
import { retryFetch } from '../utils/retry';

// Backend proxy endpoint URL - update this to match your backend deployment
const BACKEND_PROXY_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/fetch-x-posts';

/**
 * Fetch X posts via backend proxy (required due to auth requirements)
 * Uses X API v2 search endpoint for real-time posts
 */
export async function searchXPosts(
  filters: SearchFilters,
  apiKey: string
): Promise<XPost[]> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('X API key is required');
  }

  const query = (filters.keyword || '').trim();
  if (!query) {
    throw new Error('Search query is required');
  }

  try {
    const useBackend = BACKEND_PROXY_URL && !BACKEND_PROXY_URL.includes('localhost:3001');
    
    if (!useBackend) {
      console.warn('Backend proxy not configured, using mock data. Set VITE_BACKEND_URL.');
      return generateMockPosts(filters.keyword, filters.maxResults || 10);
    }

    const response = await retryFetch(() =>
      fetch(BACKEND_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          apiKey,
          maxResults: filters.maxResults || 10,
        }),
      })
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`X API proxy error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.posts || !Array.isArray(data.posts)) {
      throw new Error('Invalid response format from X API proxy');
    }

    // Transform backend response to XPost format
    return transformApiResponse(data.posts);
  } catch (error) {
    console.error('X API error:', error);
    
    // Fallback to mock data if backend fails (for development)
    if (error instanceof Error && error.message.includes('fetch')) {
      console.warn('Backend unreachable, falling back to mock data');
      return generateMockPosts(filters.keyword, filters.maxResults || 10);
    }
    
    throw error;
  }
}

function generateMockPosts(keyword: string, count: number): XPost[] {
  const mockUsernames = ['tech_enthusiast', 'ai_researcher', 'dev_master', 'tech_trends', 'innovation_hub'];
  const mockNames = ['Tech Enthusiast', 'AI Researcher', 'Dev Master', 'Tech Trends', 'Innovation Hub'];
  
  const sampleTexts = [
    `Just discovered amazing new ${keyword} features! Loving it!`,
    `Concerned about ${keyword} privacy implications. Need better regulations.`,
    `${keyword} is revolutionizing the industry. Exciting times ahead!`,
    `Not sure about ${keyword}. Seems overhyped to me.`,
    `Great discussion on ${keyword} today. Very insightful!`,
  ];

  return Array.from({ length: count }, (_, i) => {
    const authorIdx = i % mockUsernames.length;
    const text = sampleTexts[i % sampleTexts.length];
    const timestamp = new Date(Date.now() - i * 3600000).toISOString();
    
    return {
      id: `post_${i + 1}`,
      text,
      author: {
        username: mockUsernames[authorIdx],
        name: mockNames[authorIdx],
        followersCount: Math.floor(Math.random() * 100000) + 1000,
      },
      metrics: {
        likes: Math.floor(Math.random() * 500) + 10,
        retweets: Math.floor(Math.random() * 100) + 5,
        replies: Math.floor(Math.random() * 50) + 2,
        quoteTweets: Math.floor(Math.random() * 30),
      },
      timestamp,
      media_urls: i % 3 === 0 ? [`https://picsum.photos/400/300?random=${i}`] : undefined, // Mock images for some posts
    };
  });
}

function transformApiResponse(posts: any[]): XPost[] {
  return posts.map((post: any) => ({
    id: post.id || `post_${Date.now()}_${Math.random()}`,
    text: post.text || '',
    author: {
      username: post.author?.username || post.username || 'unknown',
      name: post.author?.name || post.name || 'Unknown User',
      followersCount: post.author?.followersCount || post.followers || 0,
    },
    metrics: {
      likes: post.likes || post.metrics?.likes || post.public_metrics?.like_count || 0,
      retweets: post.retweets || post.metrics?.retweets || post.public_metrics?.retweet_count || 0,
      replies: post.replies || post.metrics?.replies || post.public_metrics?.reply_count || 0,
      quoteTweets: post.quoteTweets || post.metrics?.quoteTweets || post.public_metrics?.quote_count || 0,
    },
    timestamp: post.timestamp || post.created_at || new Date().toISOString(),
    media_urls: post.media_urls || [],
  }));
}
