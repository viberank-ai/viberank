# VibeRank - AI Search Engine Brand Visibility Monitoring

## Overview

The era of traditional search rankings is over. Large language models don't return lists—they write a running story about every brand. VibeRank captures that narrative across ChatGPT, Google AI Overviews, Bing Copilot, and Perplexity, turning brand mentions into precise, actionable metrics that marketers can track in real time.

VibeRank is a comprehensive monitoring and analysis system that reveals how AI-powered search engines perceive and present your brand. Unlike traditional SEO tools that focus on page rankings, VibeRank analyzes the actual content of AI-generated responses to understand brand visibility, sentiment, competitive positioning, and authority citations. The platform automatically scrapes AI search results, applies advanced sentiment analysis (combining rule-based VADER with GPT-4), detects competitor mentions, and calculates proprietary visibility scores.

Through an intuitive dashboard with heat-map visualizations, marketing teams can monitor their brand's narrative evolution, identify sentiment trends, track competitive share-of-voice, and discover optimization opportunities. Whether you're safeguarding brand reputation, measuring campaign impact, or staying ahead of AI-driven search shifts, VibeRank provides the intelligence needed to own the story that LLMs tell about your brand.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Web Dashboard                        │
│                    (Next.js 14 App Router)                   │
└─────────────────┬───────────────────────────┬───────────────┘
                  │                           │
                  ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │   Report API     │         │    Scan API     │
        │  (Golden Data)   │         │  (Live Scans)   │
        └────────┬─────────┘         └────────┬────────┘
                 │                             │
                 ▼                             ▼
        ┌─────────────────────────────────────────────┐
        │           Pipeline Orchestration            │
        │              (runScan.ts)                   │
        └────────────────────┬────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Scrapers    │  │   Analysis    │  │     Types     │
│               │  │               │  │               │
│ • Google AI   │  │ • Presence    │  │ • Brand       │
│ • ChatGPT     │  │ • Sentiment   │  │ • Snapshot    │
│ • Perplexity  │  │ • Score       │  │ • Surface     │
│               │  │ • Competitors │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Key Components

### 1. Web Application (`apps/web`)
- **Dashboard**: Real-time heat-map visualization of brand coverage
- **API Routes**: 
  - `/api/report`: Analyzes golden samples for testing
  - `/api/scan`: Initiates async scanning jobs
  - `/api/scan/[id]`: Polls job status and results
- **Components**:
  - `Heatmap.tsx`: Color-coded matrix visualization
  - `RunScan.tsx`: Live scan trigger with progress tracking

### 2. Analysis Package (`packages/analysis`)
- **Presence Detection**: Identifies brand mentions and citations
- **Sentiment Analysis**: Hybrid VADER + GPT-4 sentiment classification
- **Score Calculation**: 0-100 visibility score based on multiple factors
- **Competitor Extraction**: Identifies competing brands in responses

### 3. Pipeline Package (`packages/pipeline`)
- **Orchestration**: Coordinates scraping → analysis → storage workflow
- **Parallelization**: Concurrent scraping with configurable limits
- **Progress Tracking**: Real-time updates for UI feedback

### 4. Types Package (`packages/types`)
- **Brand**: Configuration for brand detection
- **Snapshot**: Raw scraped data structure
- **AnalysisRow**: Processed results for dashboard

## Data Flow

1. **Scraping Phase**
   - Queries submitted to AI search engines
   - HTML responses captured as Snapshots
   - Citations and follow-ups extracted

2. **Analysis Phase**
   - Brand presence detection (name, products, website)
   - Sentiment analysis (positive/negative/neutral)
   - Authority assessment (cited as source?)
   - Score calculation (0-100 scale)

3. **Visualization Phase**
   - Results displayed in heat-map
   - Color coding: Red (low) → Yellow (medium) → Green (high)
   - Real-time updates via polling

## Scoring Algorithm

```
Score = 100 × PresenceFactor × SentimentFactor × AuthorityFactor

Where:
- PresenceFactor = 1 if mentioned, 0 if not
- SentimentFactor = (polarity + 1) / 2 (normalizes -1 to 1 → 0 to 1)
- AuthorityFactor = 1 if cited, 0.6 if not (configurable)
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp apps/web/.env.example apps/web/.env.local

# Run development server
cd apps/web
npm run dev

# Visit dashboard
open http://localhost:3000/dashboard
```

## Environment Variables

```env
# Authentication (optional for dev)
USE_MOCK_AUTH=1                    # Bypass auth in development
CLERK_SECRET_KEY=                  # Production auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= # Production auth

# Analysis
OPENAI_API_KEY=                    # For sentiment analysis
ANALYSIS_DISABLE_LLM=1             # Force deterministic mode
SCORE_AUTH_MISS_WEIGHT=0.6         # Penalty for missing citations

# API
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Development Mode

The system includes fallbacks for development:
- **Mock Scrapers**: Returns synthetic data when Puppeteer fails
- **Mock Auth**: Bypasses Clerk authentication
- **Deterministic Analysis**: Skips LLM calls for consistent testing

## Production Considerations

1. **Job Queue**: Replace in-memory storage with Redis/database
2. **Authentication**: Enable Clerk for user management
3. **Scrapers**: Deploy with Puppeteer-compatible environment
4. **Monitoring**: Add error tracking and performance monitoring
5. **Scaling**: Implement distributed job processing

## Project Structure

```
viberank/
├── apps/
│   └── web/                 # Next.js web application
│       ├── app/             # App router pages and API
│       ├── components/      # Shared React components
│       └── lib/            # Utilities (jobs, auth)
├── packages/
│   ├── analysis/           # Brand analysis algorithms
│   ├── pipeline/           # Orchestration logic
│   ├── scraper/           # AI platform scrapers
│   ├── types/             # Shared TypeScript types
│   └── eval/              # Golden samples for testing
└── data/                   # Configuration and outputs
    ├── brand.json         # Brand configuration
    ├── queries.json       # Search queries
    └── report.json        # Analysis results
```

## API Reference

### POST /api/scan
Initiates an asynchronous scan job.

**Request:**
```json
{
  "limit": 20,
  "surfaces": "google_ai,perplexity",
  "concurrency": 2
}
```

**Response:**
```json
{
  "jobId": "uuid-here"
}
```

### GET /api/scan/[id]
Retrieves job status and results.

**Response:**
```json
{
  "id": "uuid-here",
  "state": "done",
  "progress": 1.0,
  "result": {
    "rows": [...],
    "snapshots": [...]
  }
}
```

### GET /api/report
Returns analyzed golden samples for testing.

**Response:**
```json
{
  "rows": [
    {
      "query": "What is VibeRank?",
      "surface": "google_ai",
      "score": 85,
      "present": true,
      "authority": true
    }
  ]
}
```

## Features
- Advanced content analysis for AI-powered search
- SEO optimization for generative search engines
- Real-time ranking metrics and visibility tracking
- Multi-platform support

## Quick start

```bash
git clone <repository-url>
cd viberank
pnpm install
```

Last updated: August 2025
