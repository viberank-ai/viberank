/**
 * Sentiment Analysis Module - Hybrid sentiment classification system
 *
 * This module uses a two-tier approach for sentiment analysis:
 * 1. VADER sentiment analyzer for quick, deterministic scoring
 * 2. OpenAI GPT-4 for nuanced analysis when VADER is uncertain
 *
 * Used by:
 * - pipeline/src/runScan.ts: Line 81 - Analyzes sentiment of scraped content
 * - web/app/api/report/route.ts: Line 31 - Processes golden samples
 * - analysis/src/score.ts: Uses polarity to adjust brand visibility scores
 */

const vader = require('vader-sentiment');
import OpenAI from 'openai';

// Singleton OpenAI client instance
let openai: OpenAI | null = null;

/**
 * getOpenAI - Lazy initialization of OpenAI client
 *
 * Creates a singleton OpenAI client on first use to avoid multiple connections.
 * Requires OPENAI_API_KEY environment variable to be set.
 *
 * @returns OpenAI client instance
 */
function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * SentimentResult - Output of sentiment classification
 *
 * Contains both numerical polarity and categorical stance
 */
export interface SentimentResult {
  /** Numerical sentiment score from -1 (negative) to 1 (positive)
   * This is VADER's compound score used in score calculations */
  polarity: number;

  /** Categorical sentiment classification
   * Used for human-readable reporting and thresholding */
  stance: 'positive' | 'neutral' | 'negative' | 'mixed';
}

/**
 * classify - Hybrid sentiment classifier combining VADER and GPT-4
 *
 * Classification logic:
 * 1. Always runs VADER sentiment analysis first (fast, deterministic)
 * 2. If VADER confidence is high (|compound| >= 0.25), returns immediately
 * 3. For ambiguous cases (|compound| < 0.25), optionally calls GPT-4
 * 4. Can be forced to skip GPT-4 via ANALYSIS_DISABLE_LLM=1 for testing
 *
 * VADER thresholds:
 * - Positive: compound >= 0.2
 * - Negative: compound <= -0.2
 * - Neutral: -0.2 < compound < 0.2
 *
 * @param text - Plain text content to analyze (from html-to-text conversion)
 * @returns SentimentResult with polarity score and stance classification
 *
 * Called by:
 * - pipeline/src/runScan.ts: analyzeOne() function
 * - web/app/api/report/route.ts: POST handler for golden samples
 */
export async function classify(text: string): Promise<SentimentResult> {
  // Run VADER sentiment analysis - this is always our baseline
  // VADER is rule-based and works well for social media style text
  const vaderRes = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  const { compound } = vaderRes;

  // Map VADER compound score to categorical stance
  // These thresholds are tuned for AI-generated content
  const quickStance = compound >= 0.2 ? 'positive' : compound <= -0.2 ? 'negative' : 'neutral';

  // If VADER is confident (strong positive/negative), trust it
  // This saves API calls and ensures consistency
  if (Math.abs(compound) >= 0.25) {
    return { polarity: compound, stance: quickStance as SentimentResult['stance'] };
  }

  // For CI/testing, skip LLM calls to ensure deterministic results
  // This is set by pipeline/src/runScan.ts line 80
  if (process.env.ANALYSIS_DISABLE_LLM === '1') {
    return { polarity: compound, stance: quickStance as SentimentResult['stance'] };
  }

  // For ambiguous cases, use GPT-4 for more nuanced analysis
  // This catches subtle sentiment that rule-based VADER might miss
  const prompt = `
    Classify the overall sentiment toward the subject in one word: positive, negative, neutral, or mixed.
    Text: """${text.replace(/\n/g, ' ')}"""
  `;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0, // Deterministic output
  });

  // Extract and validate the stance from GPT response
  const stance = (response.choices[0].message?.content || 'neutral')
    .trim()
    .toLowerCase()
    .replace('.', '') as SentimentResult['stance'];

  // Return VADER's polarity with GPT's stance classification
  return { polarity: compound, stance };
}
