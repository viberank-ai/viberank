'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BrandConfig {
  name: string;
  altSpellings: string[];
  products: string[];
  competitors: string[];
}

export default function ProjectSetup() {
  const router = useRouter();
  const [brand, setBrand] = useState<BrandConfig>({
    name: '',
    altSpellings: [],
    products: [],
    competitors: [],
  });

  const [currentInput, setCurrentInput] = useState({
    altSpelling: '',
    product: '',
    competitor: '',
  });

  const [isGeneratingQueries, setIsGeneratingQueries] = useState(false);

  const addToList = (field: keyof typeof currentInput, listField: keyof BrandConfig) => {
    const value = currentInput[field].trim();
    if (!value) return;

    setBrand((prev) => ({
      ...prev,
      [listField]: [...(prev[listField] as string[]), value],
    }));

    setCurrentInput((prev) => ({ ...prev, [field]: '' }));
  };

  const removeFromList = (listField: keyof BrandConfig, index: number) => {
    setBrand((prev) => ({
      ...prev,
      [listField]: (prev[listField] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleSaveAndContinue = async () => {
    if (!brand.name.trim()) {
      alert('Please enter a brand name');
      return;
    }

    // Create a new project
    const newProject = {
      id: Date.now().toString(),
      name: brand.name,
      brand: brand, // Store the complete brand configuration
      altSpellings: brand.altSpellings,
      products: brand.products,
      competitors: brand.competitors,
      createdAt: new Date().toISOString(),
    };

    // Save to projects list
    const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    existingProjects.push(newProject);
    localStorage.setItem('projects', JSON.stringify(existingProjects));

    // Set as current project
    localStorage.setItem('currentProject', JSON.stringify(newProject));
    localStorage.setItem('brandConfig', JSON.stringify(brand));

    // Generate queries based on brand configuration
    setIsGeneratingQueries(true);

    try {
      const response = await fetch('/api/generate-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand }),
      });

      if (response.ok) {
        const { queries } = await response.json();
        localStorage.setItem('generatedQueries', JSON.stringify(queries));

        // Clear any existing scan results to ensure fresh state
        localStorage.removeItem('latestScanTimestamp');
      }
    } catch (error) {
      console.error('Failed to generate queries:', error);
    }

    setIsGeneratingQueries(false);

    // Force a hard navigation to ensure dashboard re-renders
    window.location.href = '/dashboard';
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Project Setup</h1>
        <p className="text-slate-400">Configure your brand for AI search monitoring</p>
      </div>

      <div className="space-y-6">
        {/* Brand Name */}
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <label className="block text-lg font-medium mb-3">Brand Name *</label>
          <input
            type="text"
            value={brand.name}
            onChange={(e) => setBrand((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:border-blue-500 focus:outline-none"
            placeholder="e.g., VibeRank"
          />
        </div>

        {/* Alternative Spellings */}
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <label className="block text-lg font-medium mb-3">Alternative Spellings</label>
          <p className="text-sm text-slate-400 mb-3">Add variations of your brand name</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentInput.altSpelling}
              onChange={(e) =>
                setCurrentInput((prev) => ({ ...prev, altSpelling: e.target.value }))
              }
              onKeyPress={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addToList('altSpelling', 'altSpellings'))
              }
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:border-blue-500 focus:outline-none"
              placeholder="e.g., Vibe Rank"
            />
            <button
              type="button"
              onClick={() => addToList('altSpelling', 'altSpellings')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {brand.altSpellings.map((spelling, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-900/50 border border-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {spelling}
                <button
                  onClick={() => removeFromList('altSpellings', index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Products/Services */}
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <label className="block text-lg font-medium mb-3">Products & Services</label>
          <p className="text-sm text-slate-400 mb-3">What does your brand offer?</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentInput.product}
              onChange={(e) => setCurrentInput((prev) => ({ ...prev, product: e.target.value }))}
              onKeyPress={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addToList('product', 'products'))
              }
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:border-green-500 focus:outline-none"
              placeholder="e.g., Brand Monitoring Software"
            />
            <button
              type="button"
              onClick={() => addToList('product', 'products')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {brand.products.map((product, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-900/50 border border-green-700 rounded-full text-sm flex items-center gap-2"
              >
                {product}
                <button
                  onClick={() => removeFromList('products', index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Competitors */}
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <label className="block text-lg font-medium mb-3">Competitors</label>
          <p className="text-sm text-slate-400 mb-3">Track how you compare to competitors</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={currentInput.competitor}
              onChange={(e) => setCurrentInput((prev) => ({ ...prev, competitor: e.target.value }))}
              onKeyPress={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addToList('competitor', 'competitors'))
              }
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:border-orange-500 focus:outline-none"
              placeholder="e.g., Salesforce"
            />
            <button
              type="button"
              onClick={() => addToList('competitor', 'competitors')}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-md font-medium"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {brand.competitors.map((competitor, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-900/50 border border-orange-700 rounded-full text-sm flex items-center gap-2"
              >
                {competitor}
                <button
                  onClick={() => removeFromList('competitors', index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 border border-slate-700 rounded-md hover:bg-slate-800"
          >
            Back to Projects
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={!brand.name.trim() || isGeneratingQueries}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingQueries ? 'Generating Queries...' : 'Create Project & Continue'}
          </button>
        </div>
      </div>
    </main>
  );
}
