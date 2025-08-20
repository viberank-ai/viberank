'use client';

import { useState } from 'react';

interface Brand {
  name: string;
  altSpellings: string[];
  products: string[];
  competitors: string[];
}

interface BrandSetupProps {
  onBrandConfigured: (brand: Brand) => void;
  initialBrand?: Brand;
}

export default function BrandSetup({ onBrandConfigured, initialBrand }: BrandSetupProps) {
  const [brand, setBrand] = useState<Brand>(
    initialBrand || {
      name: '',
      altSpellings: [],
      products: [],
      competitors: [],
    }
  );

  const [altSpelling, setAltSpelling] = useState('');
  const [product, setProduct] = useState('');
  const [competitor, setCompetitor] = useState('');

  const addToArray = (key: keyof Brand, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setBrand((prev) => ({
      ...prev,
      [key]: [...(prev[key] as string[]), value.trim()],
    }));
    setter('');
  };

  const removeFromArray = (key: keyof Brand, index: number) => {
    setBrand((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.name.trim()) {
      alert('Brand name is required');
      return;
    }
    onBrandConfigured(brand);
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h2 className="text-xl font-semibold mb-4">Configure Your Brand</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Brand Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Brand Name *</label>
          <input
            type="text"
            value={brand.name}
            onChange={(e) => setBrand((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., VibeRank"
            required
          />
        </div>

        {/* Alternative Spellings */}
        <div>
          <label className="block text-sm font-medium mb-1">Alternative Spellings</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={altSpelling}
              onChange={(e) => setAltSpelling(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="e.g., Vibe Rank"
              onKeyPress={(e) =>
                e.key === 'Enter' &&
                (e.preventDefault(), addToArray('altSpellings', altSpelling, setAltSpelling))
              }
            />
            <button
              type="button"
              onClick={() => addToArray('altSpellings', altSpelling, setAltSpelling)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {brand.altSpellings.map((spelling, index) => (
              <span key={index} className="bg-blue-100 px-2 py-1 rounded text-sm">
                {spelling}
                <button
                  type="button"
                  onClick={() => removeFromArray('altSpellings', index)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <label className="block text-sm font-medium mb-1">Products/Services</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="e.g., Brand Monitoring"
              onKeyPress={(e) =>
                e.key === 'Enter' &&
                (e.preventDefault(), addToArray('products', product, setProduct))
              }
            />
            <button
              type="button"
              onClick={() => addToArray('products', product, setProduct)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {brand.products.map((prod, index) => (
              <span key={index} className="bg-green-100 px-2 py-1 rounded text-sm">
                {prod}
                <button
                  type="button"
                  onClick={() => removeFromArray('products', index)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Competitors */}
        <div>
          <label className="block text-sm font-medium mb-1">Competitors</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="e.g., Salesforce"
              onKeyPress={(e) =>
                e.key === 'Enter' &&
                (e.preventDefault(), addToArray('competitors', competitor, setCompetitor))
              }
            />
            <button
              type="button"
              onClick={() => addToArray('competitors', competitor, setCompetitor)}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {brand.competitors.map((comp, index) => (
              <span key={index} className="bg-orange-100 px-2 py-1 rounded text-sm">
                {comp}
                <button
                  type="button"
                  onClick={() => removeFromArray('competitors', index)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          Configure Brand
        </button>
      </form>
    </div>
  );
}
