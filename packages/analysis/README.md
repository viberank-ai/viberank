# Analysis Package

## Overview

The analysis package provides core algorithms for analyzing brand visibility in AI-generated content. It combines rule-based detection with machine learning to assess how brands appear in AI search results.

## Modules

### 1. Presence Detection (`src/presence.ts`)

Detects whether a brand is mentioned and if it's cited as an authoritative source.

**Key Functions:**
- `detectPresence(html, brand)`: Analyzes HTML for brand mentions
  - Checks text content for brand name and alternatives
  - Searches for brand website in href links
  - Returns `{ present: boolean, authority: boolean }`

**Detection Logic:**
- **Present**: Brand name or alternative spellings found in text
- **Authority**: Brand website appears in citations (href links)

### 2. Sentiment Analysis (`src/sentiment.ts`)

Hybrid sentiment classifier combining VADER and GPT-4.

**Key Functions:**
- `classify(text)`: Analyzes sentiment of text
  - Primary: VADER sentiment analyzer (fast, deterministic)
  - Fallback: GPT-4 for ambiguous cases (|compound| < 0.25)
  - Returns `{ polarity: number, stance: string }`

**Sentiment Thresholds:**
- Positive: compound >= 0.2
- Negative: compound <= -0.2
- Neutral: -0.2 < compound < 0.2

### 3. Score Calculation (`src/score.ts`)

Converts analysis results into a 0-100 visibility score.

**Scoring Formula:**
```
Score = 100 × PresenceFactor × SentimentFactor × AuthorityFactor
```

**Factors:**
- **PresenceFactor**: 1 if mentioned, 0 if not
- **SentimentFactor**: (polarity + 1) / 2 (normalizes -1 to 1 → 0 to 1)
- **AuthorityFactor**: 1 if cited, 0.6 if not (configurable via SCORE_AUTH_MISS_WEIGHT)

### 4. Competitor Extraction (`src/competitors.ts`)

Identifies competing brands mentioned alongside the target brand.

**Key Functions:**
- `extractCompetitors(html, brand)`: Finds competitor mentions
  - Searches for known competitors from brand config
  - Uses GPT-4 to identify unknown competitors
  - Returns list of mentioned competitor names

## Usage Example

```typescript
import { detectPresence } from '@viberank/analysis/presence';
import { classify } from '@viberank/analysis/sentiment';
import { calcScore } from '@viberank/analysis/score';

// Analyze AI response
const html = '<p>VibeRank is a leading tool...</p>';
const brand = { 
  name: 'VibeRank', 
  altSpellings: ['Vibe Rank'],
  competitors: ['Globex']
};

// Detect brand presence
const { present, authority } = detectPresence(html, brand);

// Analyze sentiment
const text = htmlToText(html);
const { polarity } = await classify(text);

// Calculate score
const { score } = calcScore({ present, authority, polarity });
console.log(`Visibility score: ${score}/100`);
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Required for GPT-4 sentiment analysis
- `ANALYSIS_DISABLE_LLM`: Set to '1' for deterministic mode (no LLM calls)
- `SCORE_AUTH_MISS_WEIGHT`: Authority factor when not cited (default: 0.6)

### Deterministic Mode

For testing and CI, set `ANALYSIS_DISABLE_LLM=1` to:
- Skip GPT-4 calls in sentiment analysis
- Use only VADER for sentiment classification
- Ensure reproducible results

## Dependencies

- `vader-sentiment`: Rule-based sentiment analysis
- `openai`: GPT-4 API for nuanced sentiment
- `html-to-text`: HTML parsing and text extraction
- `zod`: Schema validation for brand data

## Testing

The package includes golden samples in `packages/eval` for validation:

```bash
# Run analysis on golden samples
node packages/pipeline/src/runScan.js
```

## Integration Points

Used by:
- `pipeline/src/runScan.ts`: Main orchestration
- `web/app/api/report/route.ts`: Golden sample analysis
- `web/app/api/scan/route.ts`: Live scan analysis

## Performance Considerations

- VADER analysis: ~1ms per text
- GPT-4 analysis: ~500ms per text (when needed)
- Presence detection: ~5ms per HTML document
- Score calculation: <1ms

## Future Improvements

- [ ] Custom sentiment training for brand-specific language
- [ ] Multi-language support for global brands
- [ ] Historical trend analysis
- [ ] Competitive positioning metrics
- [ ] Citation quality scoring