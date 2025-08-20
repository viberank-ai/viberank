/**
 * Evaluation Judge Module - AI-powered quality assessment for brand monitoring results
 *
 * This module provides automated evaluation of AI search responses to determine their
 * suitability for users researching a brand. It's used to validate golden samples and
 * assess the quality of brand monitoring results across different AI platforms.
 *
 * The judge evaluates responses based on:
 * - Relevance to brand research queries
 * - Quality and completeness of information
 * - Usefulness for potential customers
 * - Accuracy of brand representation
 *
 * Used for:
 * - Golden sample validation in packages/eval/golden/
 * - Quality control for scraping results
 * - A/B testing different analysis approaches
 * - Automated evaluation of pipeline improvements
 *
 * The scoring helps prioritize high-quality results and identify platform-specific
 * strengths in brand representation.
 */

import OpenAI from 'openai';

/**
 * suitabilityScore - Evaluates how suitable an AI response is for brand research
 *
 * This function uses GPT-4 as a judge to evaluate the quality of AI search responses
 * from a user's perspective. It considers whether the response would be helpful for
 * someone researching the brand for potential purchase or partnership decisions.
 *
 * Evaluation criteria (implicit in the prompt):
 * - Relevance: Does the response answer the user's brand-related query?
 * - Completeness: Is sufficient information provided?
 * - Accuracy: Does the response correctly represent the brand?
 * - Usefulness: Would this help a potential customer make decisions?
 * - Clarity: Is the information presented in a useful way?
 *
 * The function can be disabled by not setting EVAL_USE_LLM=1, which returns NaN
 * to indicate no evaluation was performed. This is useful for:
 * - Cost control during development
 * - Deterministic testing environments
 * - When LLM evaluation is not needed
 *
 * @param answerText - The AI-generated response to evaluate (plain text)
 * @returns Score from 0.0 (unsuitable) to 1.0 (highly suitable), or NaN if disabled
 * @throws Error if OpenAI API call fails
 *
 * Score interpretation:
 * - 0.0-0.3: Poor quality, misleading, or irrelevant
 * - 0.3-0.6: Somewhat helpful but lacking key information
 * - 0.6-0.8: Good quality, reasonably complete and accurate
 * - 0.8-1.0: Excellent response, highly suitable for brand research
 *
 * Examples:
 * - High score: Detailed, accurate brand overview with key features and benefits
 * - Low score: Generic response mentioning brand but no useful specifics
 * - Zero score: Completely irrelevant or factually incorrect information
 *
 * Used by:
 * - packages/eval/run.ts: Evaluating golden samples
 * - Quality assurance workflows for validating pipeline results
 * - Comparative analysis of AI platform response quality
 */
export async function suitabilityScore(answerText: string): Promise<number> {
  // Skip LLM evaluation if not explicitly enabled
  // This saves costs and enables deterministic testing
  if (process.env.EVAL_USE_LLM !== '1') return NaN;

  // Initialize OpenAI client for evaluation
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Call GPT-4-mini to evaluate response suitability
  // Using temperature=0 for consistent evaluation results
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: `Rate 0..1 how suitable this answer is for a user researching the brand. Reply with a single number.\n\n${answerText}`,
      },
    ],
  });

  // Extract numerical score from response
  // Look for decimal numbers between 0 and 1
  const n = Number(
    (response.choices[0].message?.content || '').match(/[0-1]?(\.\d+)?/g)?.[0] ?? '0'
  );

  // Clamp score to valid range [0, 1] for safety
  return Math.max(0, Math.min(1, n));
}
