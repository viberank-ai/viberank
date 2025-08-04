import { describe, it, expect } from 'vitest';
import { BrandSchema } from './brand';

describe('BrandSchema', () => {
  it('validates a complete brand', () => {
    const brand = {
      name: 'TestBrand',
      altSpellings: ['Test Brand'],
      products: ['Product1'],
      competitors: ['Competitor1'],
    };

    const result = BrandSchema.parse(brand);
    expect(result).toEqual(brand);
  });

  it('applies defaults for optional fields', () => {
    const brand = {
      name: 'TestBrand',
    };

    const result = BrandSchema.parse(brand);
    expect(result.altSpellings).toEqual([]);
    expect(result.products).toEqual([]);
    expect(result.competitors).toEqual([]);
  });
});
