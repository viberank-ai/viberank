#!/usr/bin/env node
/**
 * Brand Configuration CLI Tool - Creates brand.json from command line arguments
 *
 * This CLI tool allows users to quickly set up brand configuration for monitoring
 * across AI search engines. It validates input using Zod schema and writes the
 * configuration to data/brand.json for use by the analysis pipeline.
 *
 * Usage:
 *   pnpm cli -- --name="VibeRank" --alt="Vibe Rank" --product="Brand Monitoring"
 *
 * Generated brand.json is used by:
 * - packages/analysis/src/presence.ts: Brand detection logic
 * - packages/pipeline/src/runScan.ts: Brand configuration for analysis
 * - apps/web/app/api/report/route.ts: Loading brand config for golden samples
 *
 * The tool creates a standardized Brand object that includes:
 * - Primary brand name (required)
 * - Alternative spellings for detection
 * - Product names to search for
 * - Competitor names for comparison
 */

import { Command } from 'commander';
import { BrandSchema } from '../../../packages/types/src/brand.js';
import fs from 'fs/promises';

// Configure CLI command with required and optional parameters
const program = new Command();
program
  .requiredOption('-n, --name <string>', 'Primary brand name (required)')
  .option('-a, --alt <values...>', 'Alternative spellings and variations')
  .option('-p, --product <values...>', 'Product names to monitor')
  .option('-c, --competitor <values...>', 'Known competitor names')
  .parse();

// Extract command line options
const opts = program.opts();

// Create and validate brand configuration using Zod schema
// This ensures the data structure matches what analysis expects
const brand = BrandSchema.parse({
  name: opts.name,
  altSpellings: opts.alt,
  products: opts.product,
  competitors: opts.competitor,
});

// Create data directory if it doesn't exist (for fresh setups)
await fs.mkdir('data', { recursive: true });

// Write brand configuration to JSON file with pretty formatting
// This file becomes the single source of truth for brand detection
await fs.writeFile('data/brand.json', JSON.stringify(brand, null, 2));

console.log('✅  data/brand.json written');
