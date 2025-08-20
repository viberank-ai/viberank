/**
 * Google AI Overview Scraper - Extracts AI-generated responses from Google Search
 *
 * This module scrapes Google's AI Overview feature, which appears at the top of
 * search results pages. Google AI Overviews are AI-generated summaries that often
 * influence user decisions, making them critical for brand monitoring.
 *
 * The scraper uses multiple extraction strategies because Google frequently changes
 * the HTML structure of AI Overviews, requiring robust fallback mechanisms.
 *
 * Key features:
 * - Multi-method content extraction to handle UI changes
 * - Citation link parsing from Google's redirect URLs
 * - Follow-up question extraction for related searches
 * - Content filtering to avoid navigation elements
 *
 * Used by:
 * - packages/pipeline/src/runScan.ts: As the primary Google AI surface
 * - Brand visibility analysis for Google's AI responses
 * - Competitive analysis comparing Google AI vs other platforms
 *
 * Note: Google frequently updates their AI Overview structure, so this scraper
 * includes multiple fallback methods to ensure reliable content extraction.
 */

import { openPage } from './browser';
import * as cheerio from 'cheerio';

/**
 * GoogleAIResult - Structured data extracted from Google AI Overview
 *
 * Contains the AI-generated answer, citation sources, and follow-up questions.
 * This structure matches the typical Google AI Overview layout.
 */
export interface GoogleAIResult {
  /** AI-generated answer text (limited to 1000 characters) */
  answer: string;

  /** URLs that Google's AI cited as sources (max 10)
   * These are extracted from Google's redirect URLs */
  citations: string[];

  /** Related questions suggested by Google (max 5)
   * Often appear as "People also ask" or follow-up queries */
  followUps: string[];
}

/**
 * googleAIOverview - Scrapes Google AI Overview for a search query
 *
 * This function performs a Google search and extracts the AI Overview content
 * using multiple fallback strategies to handle Google's changing HTML structure.
 *
 * Extraction strategy:
 * 1. Method 1: Look for content near "AI Overview" text
 * 2. Method 2: Find substantial paragraphs in main content area
 * 3. Extract citations from Google's /url? redirect links
 * 4. Find follow-up questions ending with "?"
 *
 * The multi-method approach ensures reliability even when Google updates
 * their AI Overview HTML structure or CSS classes.
 *
 * @param query - Search query to submit to Google (e.g., "best project management tools")
 * @returns GoogleAIResult with extracted AI content, citations, and follow-ups
 * @throws Error if browser navigation fails
 *
 * Content filtering:
 * - Removes copyright notices and Wikipedia references
 * - Limits content length to avoid extracting full articles
 * - Filters out navigation elements and ads
 * - Deduplicates citations and follow-ups
 *
 * Used by:
 * - pipeline/src/runScan.ts: scrapeOne() for google_ai surface
 * - Manual testing for Google AI analysis
 * - Golden sample collection for evaluation
 */
export async function googleAIOverview(query: string): Promise<GoogleAIResult> {
  // Construct Google search URL with English locale
  const url = `https://www.google.com/search?hl=en&q=${encodeURIComponent(query)}`;

  // Fetch HTML using browser automation with stealth measures
  const html = await openPage(url);
  const $ = cheerio.load(html);

  // Initialize answer extraction with multiple fallback methods
  let answer = '';

  // Method 1: Look for content near "AI Overview" label
  // This targets the most obvious AI Overview sections
  $('*').each((_, el) => {
    const text = $(el).text();
    if (text.includes('AI Overview') && !answer) {
      // Get the parent element and search siblings for substantial content
      const parent = $(el).parent();
      const siblings = parent.siblings();
      siblings.each((_, sibling) => {
        const siblingText = $(sibling).text().trim();
        // Look for content longer than 50 chars that's not the label itself
        if (siblingText.length > 50 && !siblingText.includes('AI Overview')) {
          answer = siblingText;
          return false; // break out of loop
        }
      });
    }
  });

  // Method 2: Fallback to substantial paragraphs in main content
  // This catches AI content when the "AI Overview" label isn't found
  if (!answer) {
    $('div p, div div').each((_, el) => {
      const text = $(el).text().trim();
      // Look for medium-length content that appears to be AI-generated
      if (
        text.length > 100 &&
        text.length < 2000 &&
        !text.includes('©') && // Skip copyright notices
        !text.includes('Wikipedia') // Skip Wikipedia snippets
      ) {
        answer = text;
        return false; // break out of loop
      }
    });
  }

  // Extract citations from Google's redirect URLs
  // Google wraps external links in /url? redirects for tracking
  const citations: string[] = [];
  $('a[href*="/url?"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href?.includes('/url?')) {
      try {
        // Parse Google's redirect URL to get the actual citation
        const u = new URL('https://google.com' + href);
        const actualUrl = u.searchParams.get('q');
        if (actualUrl && actualUrl.startsWith('http')) {
          citations.push(actualUrl);
        }
      } catch {
        // Ignore malformed URLs - common with dynamic content
      }
    }
  });

  // Extract follow-up questions from the page
  // These are often "People also ask" or related queries
  const followUps: string[] = [];
  $('span, div').each((_, el) => {
    const text = $(el).text().trim();
    // Look for question-like text that could be follow-ups
    if (
      text.length > 10 &&
      text.length < 100 &&
      text.endsWith('?') &&
      !text.includes('OpenAI') && // Filter out unrelated questions
      !text.includes('Wikipedia') // Skip Wikipedia-related questions
    ) {
      followUps.push(text);
    }
  });

  return {
    // Limit answer length to prevent extracting full articles
    answer: answer.substring(0, 1000),
    // Deduplicate and limit citations to most relevant ones
    citations: Array.from(new Set(citations)).slice(0, 10),
    // Deduplicate and limit follow-ups for relevance
    followUps: Array.from(new Set(followUps)).slice(0, 5),
  };
}

// CLI interface for manual testing and debugging
// Allows running: node googleAI.js "search query"
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const query = process.argv[2] || 'test query';
    const result = await googleAIOverview(query);
    console.log(JSON.stringify(result, null, 2));
  })();
}
