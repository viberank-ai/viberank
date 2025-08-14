import { Brand } from '@viberank/types';
import { htmlToText } from 'html-to-text';

/**
 * PresenceResult - Output of brand presence detection
 *
 * Used by:
 * - pipeline/src/runScan.ts: analyzeOne() uses this to determine brand visibility
 * - web/app/api/report/route.ts: Processes golden samples for heat-map
 * - analysis/src/score.ts: Uses presence/authority to calculate final score
 */
export interface PresenceResult {
  /** Whether the brand name or any alt spelling was found in the content */
  present: boolean;

  /** Whether the brand's website was cited as a source
   * Indicates higher authority/trust from the AI */
  authority: boolean;
}

/**
 * detectPresence - Analyzes HTML content for brand mentions and citations
 *
 * This is a core analysis function that determines if and how a brand appears
 * in an AI search engine's response. It performs two key checks:
 *
 * 1. Text presence: Searches for brand name and alternative spellings in the text
 * 2. Authority check: Looks for the brand's domain in href links
 *
 * The function assumes the brand's website follows the pattern: brandname.com
 * (spaces removed, lowercase). For example: "Vibe Rank" → "viberank.com"
 *
 * @param html - Raw HTML from AI response (Snapshot.answerHtml)
 * @param brand - Brand configuration with name and alt spellings
 * @returns PresenceResult indicating visibility and authority status
 *
 * Called by:
 * - pipeline/src/runScan.ts: Line 77 in analyzeOne()
 * - web/app/api/report/route.ts: Line 29 in POST handler
 */
export function detectPresence(html: string, brand: Brand): PresenceResult {
  // Convert HTML to plain text for content analysis
  // wordwrap: false preserves original text layout
  const text = htmlToText(html, { wordwrap: false }).toLowerCase();

  // Check if brand name or any alternative spelling appears in the text
  // This catches any mention, even indirect ones
  const present = [brand.name, ...brand.altSpellings].some((n) => text.includes(n.toLowerCase()));

  // Construct the expected brand domain (e.g., "Vibe Rank" → "viberank.com")
  // This assumes a .com domain with spaces removed
  const authorityDomains = brand.name.replace(/\s+/g, '').toLowerCase() + '.com';

  // Check if the brand's website is cited as a source
  // Looking for href links indicates the AI considers it authoritative
  const authority =
    html.includes(`href="https://${authorityDomains}`) ||
    html.includes(`href="http://${authorityDomains}`);

  return { present, authority };
}
