/**
 * Translation and Deduplication Module - Creates multilingual query sets for global brand monitoring
 *
 * This module expands English search queries into multiple languages to provide
 * comprehensive brand visibility coverage across global markets. It's essential for
 * brands operating internationally or targeting multilingual audiences.
 *
 * Process:
 * 1. Takes English queries as input
 * 2. Translates to Spanish and French using GPT-4
 * 3. Combines all languages and removes duplicates
 * 4. Preserves brand names and keywords during translation
 *
 * Used for:
 * - Global brand monitoring across language markets
 * - International SEO analysis
 * - Multilingual competitive intelligence
 * - Comprehensive query coverage for diverse markets
 *
 * The module ensures brand names and product terms are preserved during translation
 * while adapting search patterns to each language's conventions.
 */

import OpenAI from 'openai';
import fs from 'fs/promises';

// Initialize OpenAI client for translation services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * translate - Translates query list to specified language
 *
 * Uses GPT-4-mini to translate search queries while preserving brand names,
 * product terms, and search intent. The AI is specifically instructed to
 * maintain keyword effectiveness for search engine queries.
 *
 * Translation considerations:
 * - Brand names should remain unchanged
 * - Product terms may need localization (e.g., "software" vs "logiciel")
 * - Search patterns vary by language ("best X" vs "meilleur X")
 * - Cultural context affects query phrasing
 *
 * @param list - Array of English search queries
 * @param lang - Target language code ('es' for Spanish, 'fr' for French)
 * @returns Array of translated queries
 * @throws Error if OpenAI API call fails
 *
 * Examples:
 * - EN: "best CRM software for small business"
 * - ES: "mejor software CRM para pequeñas empresas"
 * - FR: "meilleur logiciel CRM pour petites entreprises"
 */
async function translate(list: string[], lang: 'es' | 'fr'): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Translate each line to ${lang} preserving meaning and keywords.`,
      },
      { role: 'user', content: list.join('\n') },
    ],
  });

  // Extract and clean translated queries
  const content = completion.choices[0].message?.content;
  return (
    content
      ?.split('\n')
      .map((s) => s.trim())
      .filter(Boolean) ?? []
  );
}

/**
 * translateAndDedupe - Creates multilingual query set with deduplication
 *
 * Main function that combines English queries with Spanish and French translations,
 * then removes duplicates to create a comprehensive multilingual query set.
 *
 * Process:
 * 1. Load English queries from input file
 * 2. Generate Spanish translations
 * 3. Generate French translations
 * 4. Combine all three language sets
 * 5. Remove exact duplicates (some queries may be identical across languages)
 * 6. Return deduplicated multilingual query list
 *
 * Deduplication is important because:
 * - Some queries may be identical (brand names, technical terms)
 * - Reduces redundant scraping operations
 * - Optimizes API usage and processing time
 * - Maintains query quality by removing near-duplicates
 *
 * @param inputFilePath - Path to JSON file containing English queries
 * @returns Array of unique multilingual queries
 * @throws Error if file read fails or translation errors occur
 *
 * Input format: JSON array of English query strings
 * Output: Deduplicated array containing English + Spanish + French queries
 *
 * Used by:
 * - CLI script for query file processing
 * - Pipeline for dynamic multilingual query generation
 * - International brand monitoring workflows
 */
export async function translateAndDedupe(inputFilePath: string): Promise<string[]> {
  // Load English queries from input file
  const en: string[] = JSON.parse(await fs.readFile(inputFilePath, 'utf-8'));

  // Generate translations for Spanish and French markets
  const es = await translate(en, 'es');
  const fr = await translate(en, 'fr');

  // Combine all languages and remove exact duplicates
  // Using Set for O(1) deduplication performance
  const deduped = Array.from(new Set([...en, ...es, ...fr]));

  return deduped;
}

// CLI interface for processing query files
// Usage: ts-node translateDedup.ts data/queries-en-[id].json
if (require.main === module) {
  (async () => {
    const inputFile = process.argv[2];
    if (!inputFile) {
      console.error('Usage: ts-node translateDedup.ts <input-file>');
      process.exit(1);
    }

    // Process input file and generate multilingual queries
    const deduped = await translateAndDedupe(inputFile);

    // Ensure output directory exists
    await fs.mkdir('data', { recursive: true });

    // Save multilingual query set for use by tagger and pipeline
    await fs.writeFile('data/queries-multilingual.json', JSON.stringify(deduped, null, 2));

    console.log(`✅ Total unique queries: ${deduped.length}`);
  })();
}
