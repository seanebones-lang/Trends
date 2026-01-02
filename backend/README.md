# X Trend Analyzer - Backend Proxy Server

Backend proxy server for X (Twitter) API integration. This server handles X API calls server-side to avoid exposing API keys on the client.

## Features

- **Secure API Key Handling**: API keys stay on the server, never exposed to clients
- **Error Handling**: Proper error handling for X API responses (429 rate limits, 401 auth errors, etc.)
- **Retry Logic**: Handles rate limits and temporary failures gracefully
- **CORS Enabled**: Configured to work with frontend from any origin (adjust for production)

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on port 3001 (or the port specified in the `PORT` environment variable).

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3001)

### Frontend Configuration

Update your frontend `.env` file (or environment variables) to point to this backend:

```env
VITE_BACKEND_URL=https://your-backend-url.com/fetch-x-posts
```

For local development:
```env
VITE_BACKEND_URL=http://localhost:3001/fetch-x-posts
```

## API Endpoints

### POST /fetch-x-posts

Fetches posts from X (Twitter) API v2.

**Request Body:**
```json
{
  "query": "artificial intelligence",
  "apiKey": "your-x-api-bearer-token",
  "maxResults": 10
}
```

**Response:**
```json
{
  "posts": [
    {
      "id": "tweet_id",
      "text": "Tweet text",
      "timestamp": "2025-12-01T12:00:00Z",
      "likes": 100,
      "retweets": 50,
      "replies": 20,
      "author": {
        "username": "username",
        "name": "Display Name",
        "followersCount": 1000
      }
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid request (missing query or API key)
- `401` - Invalid X API key
- `429` - Rate limit exceeded
- `403` - API access forbidden (check API permissions)
- `500` - Server error

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-01T12:00:00Z"
}
```

## Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the backend directory
3. Set environment variables in Vercel dashboard
4. Update frontend `VITE_BACKEND_URL` to point to your Vercel URL

### Railway

1. Connect your repository to Railway
2. Set root directory to `backend`
3. Railway will auto-detect Node.js and deploy
4. Update frontend `VITE_BACKEND_URL` to point to your Railway URL

### Other Platforms

Any Node.js hosting platform should work. Make sure to:
- Set the `PORT` environment variable if required
- Enable CORS for your frontend domain (update CORS settings in `server.js` for production)

## X API Requirements

**Important:** X API v2 requires:
- X API Premium access for real-time search (~$100/month for basic tier)
- Valid Bearer Token (get from [Twitter Developer Portal](https://developer.twitter.com))

The free tier has very limited access. For development, you can use mock data in the frontend by not setting `VITE_BACKEND_URL`.

## Security Notes

- **Production:** Restrict CORS to your frontend domain only
- **Rate Limiting:** Consider adding rate limiting middleware for production
- **API Key Storage:** For production, consider using environment variables or a secrets manager instead of passing keys in requests
- **HTTPS:** Always use HTTPS in production

## License

MIT
