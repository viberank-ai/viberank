import { z } from 'zod';

export const GoldenItem = z.object({
  id: z.string(),
  surface: z.enum(['google_ai', 'bing_copilot', 'chatgpt', 'perplexity', 'other']),
  query: z.string(),
  brand: z.object({
    name: z.string(),
    altSpellings: z.array(z.string()).default([]),
    competitors: z.array(z.string()).default([]),
  }),
  html: z.string(), // minimal snippet of answer HTML
  expected: z.object({
    present: z.boolean(),
    authority: z.boolean(),
    // expected sentiment range for VADER (not LLM)
    polarityRange: z.tuple([z.number(), z.number()]),
    score: z.number(), // 0..100 expected score with current formula
  }),
});

export type TGoldenItem = z.infer<typeof GoldenItem>;
