# AI Overview Worker

A Cloudflare Worker that fetches Google AI Overviews and generates consolidated, human-friendly answers using OpenAI's GPT when overviews aren't available.

## 🚀 Live Demo

**URL:** [ai-overview-worker.chrisaltman.workers.dev](https://ai-overview-worker.chrisaltman.workers.dev)

> **Note:** This deployment is protected with HTTP Basic Authentication.

## ✨ Features

- **Multi-run AI Overview Detection**: Performs multiple attempts to capture Google AI Overviews for better reliability
- **Smart Consolidation**: Uses OpenAI GPT-4o-mini to rewrite and consolidate multiple AI overview snapshots
- **Fallback Generation**: When no AI overviews are found, generates comprehensive answers using GPT
- **Real-time Logging**: Live feedback showing the search process and results
- **Geographic Targeting**: Supports different Google regions (US, UK, etc.)
- **HTTP Basic Auth**: Protected endpoint to prevent unauthorized access

## 🏗️ Architecture

```
User Query → Cloudflare Worker → SerpAPI (Google Search) → OpenAI API → Consolidated Response
```

### How It Works

1. **Search Phase**: Makes multiple calls to SerpAPI to fetch Google AI Overviews
2. **Consensus Building**: Selects the longest/most complete overview from multiple attempts
3. **AI Processing**: 
   - If overviews found → Consolidates them using GPT
   - If no overviews → Generates ideal answer using GPT
4. **Response**: Returns structured JSON with original data, logs, and final answer

## 🛠️ Tech Stack

- **Runtime**: Cloudflare Workers
- **APIs**: 
  - [SerpAPI](https://serpapi.com) for Google search results
  - [OpenAI API](https://openai.com/api) for text generation
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Wrangler CLI

## 📋 Prerequisites

- Cloudflare account with Workers enabled
- SerpAPI account and API key
- OpenAI account and API key
- Node.js and npm installed

## ⚙️ Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-overview-worker.git
cd ai-overview-worker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
# Set your API keys as Cloudflare Worker secrets
wrangler secret put SERPAPI_KEY
wrangler secret put OPENAI_API_KEY

# Set authentication credentials
wrangler secret put AUTH_USERNAME
wrangler secret put AUTH_PASSWORD
```

### 4. Update Configuration
Edit `wrangler.toml` if needed:
```toml
name = "your-worker-name"
compatibility_date = "2024-01-01"
```

### 5. Deploy
```bash
wrangler deploy
```

## 🧪 Local Development

```bash
# Start local development server
wrangler dev

# Test with live APIs (requires secrets to be set)
wrangler dev --remote
```

## 📡 API Usage

### Request Format
```javascript
POST /
Content-Type: application/json

{
  "keyword": "your search query",
  "iterations": 3,  // optional, default: 3
  "gl": "us"        // optional, default: "us"
}
```

### Response Format
```javascript
{
  "keyword": "search query",
  "snapshots": [
    {
      "run": 1,
      "length": 1250,
      "text": "AI overview content..."
    }
  ],
  "consensus": "consolidated overview text",
  "openai_rewrite": "final GPT-generated answer",
  "logs": ["array of process logs"]
}
```

## 🌍 Supported Regions

Use the `gl` parameter to target different Google regions:
- `us` - United States (default)
- `uk` - United Kingdom  
- `ca` - Canada
- `au` - Australia
- And more...

## 🔧 Configuration Options

### SerpAPI Parameters
- **Engine**: `google` for standard search, `google_ai_overview` for streaming
- **Language**: `en` (English)
- **Cache**: Disabled with `no_cache: true` for fresh results

### OpenAI Parameters
- **Model**: `gpt-4o-mini` (cost-efficient and fast)
- **Max Tokens**: 1000
- **Temperature**: 0.7 (balanced creativity/accuracy)

## 🌿 Branch Structure

- **`main`** - Stable production version
- **`logging-frontend`** - Core webapp functionality 
- **`add-basic-auth`** - Enhanced version with HTTP authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Important Notes

- **Rate Limits**: Be mindful of SerpAPI and OpenAI rate limits
- **Costs**: Both SerpAPI and OpenAI charge per request
- **Authentication**: The deployed version requires basic auth credentials
- **Legal**: Ensure compliance with Google's Terms of Service when using search data

## 🐛 Troubleshooting

### Common Issues

**401 Errors from SerpAPI**
- Check that `SERPAPI_KEY` secret is properly set
- Verify your SerpAPI account has sufficient credits

**Empty OpenAI Responses**
- Ensure `OPENAI_API_KEY` secret is configured
- Check OpenAI account billing and rate limits

**Authentication Prompts**
- Set `AUTH_USERNAME` and `AUTH_PASSWORD` secrets for basic auth

### Debug Logs
Use `wrangler tail` to view real-time logs during development:
```bash
wrangler tail
```

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the logs using `wrangler tail`
- Review the API documentation for [SerpAPI](https://serpapi.com/search-api) and [OpenAI](https://platform.openai.com/docs)

---

Built with ❤️ using Cloudflare Workers
