/**
 * Query Generator Module - AI-powered search query generation for brand monitoring
 *
 * This module uses GPT-4 to generate realistic search queries that potential customers
 * might use when researching brands, products, or making comparisons. The queries are
 * designed to trigger AI search responses that can reveal brand visibility patterns.
 *
 * Query types generated:
 * - Questions: "What is the best CRM software?"
 * - Comparisons: "VibeRank vs Salesforce"
 * - Best-for-X: "Best analytics tool for startups"
 * - Product-specific: "CRM with advanced reporting"
 *
 * Generated queries are used by:
 * - packages/pipeline/src/runScan.ts: As search terms for scrapers
 * - Golden sample creation for testing and evaluation
 * - A/B testing different query strategies for brand visibility
 *
 * The generator produces 200 unique queries per brand, providing comprehensive
 * coverage of potential search scenarios that could affect brand visibility.
 */

import type { Brand } from '../../types/src/brand';
import OpenAI from 'openai';
import crypto from 'node:crypto';
import fs from 'fs/promises';

// Initialize OpenAI client for query generation
// Requires OPENAI_API_KEY environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * generateQueries - Uses AI to generate diverse search queries for brand monitoring
 *
 * This function leverages GPT-4's understanding of search patterns to generate
 * realistic queries that potential customers might use. The queries are designed
 * to trigger AI responses where brand mentions and comparisons are likely to appear.
 *
 * The AI is prompted to consider:
 * - Brand name and alternative spellings
 * - Competitor landscape for comparison queries
 * - Product categories for targeted searches
 * - Common search patterns (questions, comparisons, best-of lists)
 *
 * Generated query types include:
 * - Direct questions: "What is VibeRank used for?"
 * - Comparison queries: "VibeRank vs Salesforce which is better"
 * - Category searches: "best brand monitoring tools 2024"
 * - Product-specific: "AI brand analysis software"
 * - Problem-solving: "how to track brand visibility online"
 *
 * @param brand - Brand configuration with name, competitors, and products
 * @returns Array of up to 200 unique search queries
 * @throws Error if OpenAI API call fails
 *
 * Output format: Plain text queries, one per line, no numbering
 * Deduplication: Removes duplicate queries and limits to 200 items
 *
 * Used by:
 * - CLI script: Run directly to generate query files
 * - Pipeline: Import generateQueries for dynamic query creation
 * - Testing: Generate queries for golden sample evaluation
 */
export async function generateQueries(brand: Brand): Promise<string[]> {
  // System prompt establishes the AI's role and expertise
  const system = 'You are an SEO expert generating search queries.';

  // User prompt provides brand context and generation requirements
  const user = `
    Brand: ${brand.name}
    Competitors: ${brand.competitors.join(', ')}
    Products: ${brand.products.join(', ')}
    Generate question, comparison, and best-for-X queries.
    Return as newline list, no numbering, 200 items.
  `;

  // Call GPT-4-mini for cost-effective query generation
  // Using mini model since query generation doesn't require advanced reasoning
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  // Extract and clean the generated queries
  const raw = completion.choices[0].message?.content || '';
  const list = raw
    .split('\n') // Split on newlines
    .map((q) => q.trim()) // Remove whitespace
    .filter(Boolean); // Remove empty lines

  // Deduplicate and limit to 200 queries for performance
  // Deduplication prevents wasted scraping on identical queries
  return Array.from(new Set(list)).slice(0, 200);
}

// CLI interface for standalone query generation
// Run with: node generator.js (requires data/brand.json)
if (require.main === module) {
  (async () => {
    // Load brand configuration from CLI-generated brand.json
    const brand: Brand = JSON.parse(await fs.readFile('data/brand.json', 'utf-8'));

    // Generate queries using the brand configuration
    const queries = await generateQueries(brand);

    // Ensure data directory exists
    await fs.mkdir('data', { recursive: true });

    // Write queries to file with unique identifier
    // Format: queries-en-[8-char-uuid].json
    await fs.writeFile(
      `data/queries-en-${crypto.randomUUID().slice(0, 8)}.json`,
      JSON.stringify(queries, null, 2)
    );

    console.log(`✅ Generated ${queries.length} queries`);
  })();
}
