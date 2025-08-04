import { describe, it, expect } from 'vitest';
import { BrandSchema } from '@viberank/types/brand';

describe('BrandSchema', () => {
  it('validates schema', () => {
    const result = BrandSchema.parse({
      name: 'Acme',
      altSpellings: ['ACME Co'],
      products: ['Widget'],
      competitors: ['Globex'],
    });
    expect(result.name).toBe('Acme');
  });

  it('provides defaults for optional fields', () => {
    const result = BrandSchema.parse({
      name: 'TestBrand',
    });
    expect(result.name).toBe('TestBrand');
    expect(result.altSpellings).toEqual([]);
    expect(result.products).toEqual([]);
    expect(result.competitors).toEqual([]);
  });

  it('throws on missing name', () => {
    expect(() => {
      BrandSchema.parse({
        altSpellings: ['test'],
      });
    }).toThrow();
  });
});
