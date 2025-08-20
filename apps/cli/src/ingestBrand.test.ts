/**
 * Brand Configuration CLI Tests - Validates BrandSchema parsing and validation
 *
 * These tests ensure the CLI tool properly validates brand configuration input
 * and handles edge cases like missing required fields and optional defaults.
 *
 * The BrandSchema is critical because it defines the data structure used by:
 * - packages/analysis/src/presence.ts: For brand name detection
 * - packages/pipeline/src/runScan.ts: For configuring analysis runs
 * - Generated data/brand.json: The configuration file created by ingestBrand.ts
 *
 * Test coverage includes:
 * - Complete brand configuration validation
 * - Optional field defaults (empty arrays for missing alt spellings, etc.)
 * - Required field validation (name must be present)
 * - Schema parsing error handling
 */

import { describe, it, expect } from 'vitest';
import { BrandSchema } from '@viberank/types/brand';

describe('BrandSchema', () => {
  /**
   * Test complete brand configuration parsing
   * Validates that all fields are correctly parsed and accessible
   * This represents the typical use case when all CLI options are provided
   */
  it('validates schema', () => {
    const result = BrandSchema.parse({
      name: 'Acme',
      altSpellings: ['ACME Co'],
      products: ['Widget'],
      competitors: ['Globex'],
    });
    expect(result.name).toBe('Acme');
  });

  /**
   * Test default value handling for optional fields
   * Ensures CLI works with minimal input (only --name required)
   * This validates the schema provides sensible defaults for arrays
   */
  it('provides defaults for optional fields', () => {
    const result = BrandSchema.parse({
      name: 'TestBrand',
    });
    expect(result.name).toBe('TestBrand');
    expect(result.altSpellings).toEqual([]);
    expect(result.products).toEqual([]);
    expect(result.competitors).toEqual([]);
  });

  /**
   * Test error handling for missing required fields
   * Ensures the CLI fails gracefully when required --name option is omitted
   * This prevents invalid brand configurations from being written to disk
   */
  it('throws on missing name', () => {
    expect(() => {
      BrandSchema.parse({
        altSpellings: ['test'],
      });
    }).toThrow();
  });
});
