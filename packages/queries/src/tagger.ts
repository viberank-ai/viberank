/**
 * Query Tagger Module - Classifies search queries by intent and customer journey stage
 *
 * This module analyzes search queries to understand user intent and where they are
 * in the customer journey. This classification helps prioritize which queries are
 * most important for brand monitoring and business impact.
 *
 * Classification dimensions:
 * 1. Intent: What the user wants to do (transactional, comparative, informational, navigational)
 * 2. Stage: Where they are in the funnel (awareness, consideration, purchase, support)
 *
 * Used for:
 * - Prioritizing high-value queries (transactional + purchase stage)
 * - Understanding search behavior patterns across brand queries
 * - Segmenting analysis results by business impact
 * - A/B testing query performance by category
 *
 * The tagger combines rule-based keyword matching (fast) with AI classification (accurate)
 * to provide comprehensive query analysis at scale.
 */

import fs from 'fs/promises';
import glob from 'fast-glob';
import OpenAI from 'openai';

/**
 * Label - Complete classification for a search query
 *
 * Contains the original query plus its intent and funnel stage classifications
 * Used for analysis, filtering, and reporting on query performance
 */
export type Label = {
  /** Original search query text */
  q: string;
  /** Intent classification (transactional, comparative, etc.) */
  intent: string;
  /** Customer journey stage (awareness, consideration, etc.) */
  stage: string;
};

// Initialize OpenAI client for stage classification
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Intent classification keyword mappings
 *
 * These keywords are used for fast, rule-based intent detection.
 * Based on common search patterns and SEO research.
 */
const intentKeywords = {
  // Transactional: User ready to buy or take action
  transactional: [
    'buy',
    'price',
    'deal',
    'cost',
    'purchase',
    'affordable',
    'budget',
    'cheap',
    'expensive',
  ],

  // Comparative: User comparing options
  comparative: [
    'vs',
    'compare',
    'alternative',
    'better',
    'versus',
    'against',
    'difference',
    'than',
  ],

  // Navigational: User looking for specific site/page
  navigational: ['login', 'official', 'website', 'site', 'portal', 'dashboard'],

  // Informational: User seeking information (default fallback)
  informational: [],
};

/**
 * heuristicIntent - Fast keyword-based intent classification
 *
 * Uses predefined keyword lists to quickly classify query intent without
 * API calls. This provides immediate classification for most common patterns.
 *
 * Algorithm:
 * 1. Convert query to lowercase for case-insensitive matching
 * 2. Check each intent category for keyword matches
 * 3. Return first matching intent or default to 'informational'
 *
 * @param q - Search query to classify
 * @returns Intent category string
 *
 * Examples:
 * - "buy CRM software" → transactional
 * - "Salesforce vs HubSpot" → comparative
 * - "Gmail login" → navigational
 * - "what is a CRM" → informational
 */
export function heuristicIntent(q: string): string {
  const query = q.toLowerCase();

  // Check each intent category for keyword matches
  for (const [intent, kws] of Object.entries(intentKeywords)) {
    if (kws.some((k) => query.includes(k))) return intent;
  }

  // Default to informational if no keywords match
  return 'informational';
}

/**
 * llmStage - AI-powered customer journey stage classification
 *
 * Uses GPT-4-mini to classify where the user is in their customer journey.
 * This requires more sophisticated understanding than keyword matching can provide.
 *
 * Customer journey stages:
 * - awareness: Learning about problem/category
 * - consideration: Evaluating specific solutions
 * - purchase: Ready to buy/decide
 * - support: Existing customer needing help
 *
 * @param q - Search query to classify
 * @returns Customer journey stage
 * @throws Error if OpenAI API call fails
 *
 * Examples:
 * - "what is brand monitoring" → awareness
 * - "VibeRank pricing plans" → consideration
 * - "buy VibeRank subscription" → purchase
 * - "VibeRank setup help" → support
 */
export async function llmStage(q: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Classify funnel stage: awareness, consideration, purchase, support.',
      },
      { role: 'user', content: q },
    ],
  });

  const stage = response.choices[0].message?.content?.trim().toLowerCase() || 'awareness';

  // Validate and normalize the response
  const validStages = ['awareness', 'consideration', 'purchase', 'support'];
  return validStages.includes(stage) ? stage : 'awareness';
}

/**
 * tagQueries - Batch classification of multiple queries
 *
 * Processes an array of queries to add intent and stage classifications.
 * Uses both heuristic (fast) and AI (accurate) methods for complete analysis.
 *
 * Process:
 * 1. For each query, classify intent using keyword matching
 * 2. Classify stage using GPT-4 API call
 * 3. Combine into labeled result
 * 4. Show progress for long-running operations
 *
 * @param queries - Array of search query strings
 * @returns Array of labeled queries with intent and stage
 *
 * Performance: ~500ms per query due to AI classification calls
 * Recommended batch size: 100-500 queries for reasonable processing time
 *
 * Used by:
 * - CLI script for batch processing query files
 * - Analysis pipeline for query understanding
 * - Reporting for query performance segmentation
 */
export async function tagQueries(queries: string[]): Promise<Label[]> {
  const labels: Label[] = [];

  console.log(`🏷️  Tagging ${queries.length} queries...`);
  let processed = 0;

  // Process each query sequentially to avoid rate limiting
  for (const q of queries) {
    // Fast keyword-based intent classification
    const intent = heuristicIntent(q);

    // AI-powered stage classification
    const stage = await llmStage(q);

    labels.push({ q, intent, stage });

    processed++;
    // Show progress every 10 queries to track long operations
    if (processed % 10 === 0) {
      console.log(`   Progress: ${processed}/${queries.length}`);
    }
  }

  return labels;
}

// CLI interface for batch query tagging
// Processes multilingual query files and outputs tagged results with statistics
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    // Look for multilingual query files to process
    const files = await glob('data/queries-multilingual.json');
    if (files.length === 0) {
      console.error('❌ No multilingual queries file found');
      process.exit(1);
    }

    const file = files[0];
    console.log(`📥 Loading queries from ${file}`);

    // Load query list from JSON file
    const list: string[] = JSON.parse(await fs.readFile(file, 'utf-8'));
    console.log(`📊 Found ${list.length} queries to tag`);

    // Perform batch tagging with progress tracking
    const labels = await tagQueries(list);

    // Save tagged results
    await fs.writeFile('data/queries-tagged.json', JSON.stringify(labels, null, 2));

    // Generate summary statistics for analysis
    const intentCounts = labels.reduce(
      (acc, label) => {
        acc[label.intent] = (acc[label.intent] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const stageCounts = labels.reduce(
      (acc, label) => {
        acc[label.stage] = (acc[label.stage] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Display results and statistics
    console.log(`✅ Tagged ${labels.length} queries saved to data/queries-tagged.json`);
    console.log(`📈 Intent breakdown:`, intentCounts);
    console.log(`🎯 Stage breakdown:`, stageCounts);
  })();
}
