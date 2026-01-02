export interface XPost {
  id: string;
  text: string;
  author: {
    username: string;
    name: string;
    followersCount?: number;
  };
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    quoteTweets: number;
  };
  timestamp: string;
  media_urls?: string[];
  sentiment?: SentimentData;
}

export interface SentimentData {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  reasoning?: string;
  confidence?: number;
}

export interface TrendTopic {
  keyword: string;
  volume: number;
  sentiment: SentimentData;
  posts: XPost[];
  growthRate: number;
  lastUpdated: string;
}

export interface ApiKeys {
  xApiKey: string;
  grokApiKey: string;
}

export interface SearchFilters {
  keyword: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minEngagement?: number;
  maxResults?: number;
}

export interface DashboardStats {
  totalPosts: number;
  averageSentiment: number;
  totalEngagement: number;
  trendingTopics: number;
  topInfluencer?: {
    username: string;
    followers: number;
  };
}
