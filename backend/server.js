/**
 * Backend Proxy Server for X API
 * 
 * This server acts as a proxy to avoid exposing X API keys on the client side.
 * Deploy this separately (e.g., on Vercel, Railway, or any Node.js hosting).
 * 
 * Requirements:
 * - Node.js 18+
 * - Express
 * - Axios (or fetch in Node 18+)
 * 
 * Setup:
 * 1. npm install express axios cors
 * 2. Deploy to your hosting platform
 * 3. Set the VITE_BACKEND_URL environment variable in your frontend to point to this server
 * 
 * Note: X API v2 requires Premium API access (~$100/month) for real-time search
 * Basic tier has limited access. Adjust accordingly.
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json());

// X API v2 endpoint
const X_API_BASE = 'https://api.twitter.com/2';

/**
 * POST /fetch-x-posts
 * Fetches posts from X (Twitter) API v2
 * 
 * Request body:
 * {
 *   query: string (search query)
 *   apiKey: string (X API Bearer token)
 *   maxResults?: number (1-100, default: 10)
 * }
 */
app.post('/fetch-x-posts', async (req, res) => {
  try {
    const { query, apiKey, maxResults = 10 } = req.body;

    // Validation
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: 'X API key is required' });
    }

    if (maxResults < 1 || maxResults > 100) {
      return res.status(400).json({ error: 'maxResults must be between 1 and 100' });
    }

    const encodedQuery = encodeURIComponent(`${query.trim()} lang:en -is:retweet`);
    const url = `${X_API_BASE}/tweets/search/recent?query=${encodedQuery}&max_results=${Math.min(maxResults, 100)}&tweet.fields=created_at,public_metrics,author_id,text,attachments&expansions=author_id,attachments.media_keys&media.fields=url,type&user.fields=username,name,public_metrics`;

    // Make request to X API
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000, // 10 second timeout
    });

    const tweets = response.data.data || [];
    const users = (response.data.includes?.users || []).reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
    const mediaMap = (response.data.includes?.media || []).reduce((acc, media) => {
      acc[media.media_key] = media;
      return acc;
    }, {});

    const posts = tweets.map(tweet => {
      const author = users[tweet.author_id] || {
        username: 'unknown',
        name: 'Unknown User',
        public_metrics: { followers_count: 0 },
      };

      // Extract media URLs
      const mediaUrls = tweet.attachments?.media_keys
        ?.map((key: string) => mediaMap[key])
        ?.filter((media: any) => media?.type === 'photo' && media?.url)
        ?.map((media: any) => media.url) || [];

      return {
        id: tweet.id,
        text: tweet.text,
        timestamp: tweet.created_at,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        media_urls: mediaUrls,
        author: {
          username: author.username,
          name: author.name,
          followersCount: author.public_metrics?.followers_count || 0,
        },
      };
    });

    res.json({ posts });
  } catch (error) {
    console.error('X API Proxy Error:', error);

    // Handle specific X API errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.statusText;

      if (status === 401) {
        return res.status(401).json({ error: 'Invalid X API key' });
      }

      if (status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: error.response.headers['retry-after'] || 900,
        });
      }

      if (status === 403) {
        return res.status(403).json({
          error: 'X API access forbidden. Check your API permissions and plan.',
        });
      }

      return res.status(status).json({
        error: `X API error: ${message || status}`,
      });
    }

    // Network or other errors
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`X API Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
