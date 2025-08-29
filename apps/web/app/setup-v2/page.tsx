'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SetupStep = 'name' | 'verification' | 'details' | 'complete';

interface BrandInfo {
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  headquarters?: string;
  founded?: string;
  size?: string;
  products?: string[];
  competitors?: string[];
}

interface BrandVerification {
  confidence: number;
  uniqueIdentifiers: string[];
  disambiguationStrength: 'weak' | 'moderate' | 'strong';
  verifiedDomain?: string;
  suggestedQueries: string[];
}

interface VerificationResult {
  found: boolean;
  confidence: number;
  brandInfo: BrandInfo;
  sources: string[];
  verification?: BrandVerification;
  brandContext?: string;
}

export default function SetupV2() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>('name');
  const [brandName, setBrandName] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [finalBrandInfo, setFinalBrandInfo] = useState<BrandInfo | null>(null);

  const searchForBrand = async (name: string, extraInfo?: string) => {
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/brand-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandName: name, 
          additionalInfo: extraInfo,
          attempt: attempts 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setVerificationResult(result);
        setStep('verification');
      }
    } catch (error) {
      console.error('Failed to search for brand:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInitialSearch = () => {
    if (!brandName.trim()) {
      alert('Please enter a brand name');
      return;
    }
    searchForBrand(brandName);
  };

  const handleVerificationResponse = (isCorrect: boolean) => {
    if (isCorrect && verificationResult) {
      setFinalBrandInfo(verificationResult.brandInfo);
      setStep('details');
    } else {
      // Reset for retry
      setAttempts(attempts + 1);
      setAdditionalInfo('');
      setStep('name');
    }
  };

  const handleRetryWithMoreInfo = () => {
    searchForBrand(brandName, additionalInfo);
  };

  const handleSaveProject = async () => {
    if (!finalBrandInfo || !verificationResult) return;

    const newProject = {
      id: Date.now().toString(),
      name: finalBrandInfo.name,
      brand: finalBrandInfo,
      altSpellings: [],
      products: finalBrandInfo.products || [],
      competitors: finalBrandInfo.competitors || [],
      createdAt: new Date().toISOString(),
      verified: true,
      verification: verificationResult.verification,
      brandContext: verificationResult.brandContext,
      disambiguationStrength: verificationResult.verification?.disambiguationStrength,
    };

    // Save to projects list
    const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    existingProjects.push(newProject);
    localStorage.setItem('projects', JSON.stringify(existingProjects));
    localStorage.setItem('currentProject', JSON.stringify(newProject));

    // Navigate to dashboard
    router.push('/dashboard');
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Brand Setup</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className={step === 'name' ? 'text-blue-400' : ''}>1. Enter Name</span>
          <span>→</span>
          <span className={step === 'verification' ? 'text-blue-400' : ''}>2. Verify</span>
          <span>→</span>
          <span className={step === 'details' ? 'text-blue-400' : ''}>3. Confirm</span>
        </div>
      </div>

      {/* Step 1: Brand Name Input */}
      {step === 'name' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
            <label className="block text-lg font-medium mb-3">
              What's the name of your brand?
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-md focus:border-blue-500 focus:outline-none text-lg"
              placeholder="e.g., Tesla, Airbnb, VibeRank"
              onKeyPress={(e) => e.key === 'Enter' && handleInitialSearch()}
            />
            
            {attempts > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-yellow-400">
                  Let's try again. Can you provide more details about your brand?
                </p>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-md focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="e.g., We make electric vehicles and energy storage systems. Our website is tesla.com"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-slate-700 rounded-md hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={attempts > 0 ? handleRetryWithMoreInfo : handleInitialSearch}
              disabled={!brandName.trim() || isSearching}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : attempts > 0 ? 'Search Again' : 'Find My Brand'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Verification */}
      {step === 'verification' && verificationResult && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
            <h2 className="text-xl font-semibold mb-4">Is this your brand?</h2>
            
            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-400 mb-2">
                  {verificationResult.brandInfo.name}
                </h3>
                
                {verificationResult.brandInfo.website && (
                  <div className="text-sm mb-2">
                    <span className="text-slate-400">Website:</span>{' '}
                    <a href={`https://${verificationResult.brandInfo.website}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-blue-400 hover:underline">
                      {verificationResult.brandInfo.website}
                    </a>
                  </div>
                )}
                
                {verificationResult.brandInfo.description && (
                  <p className="text-sm mb-3">{verificationResult.brandInfo.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {verificationResult.brandInfo.industry && (
                    <div>
                      <span className="text-slate-400">Industry:</span>{' '}
                      {verificationResult.brandInfo.industry}
                    </div>
                  )}
                  {verificationResult.brandInfo.headquarters && (
                    <div>
                      <span className="text-slate-400">HQ:</span>{' '}
                      {verificationResult.brandInfo.headquarters}
                    </div>
                  )}
                  {verificationResult.brandInfo.founded && (
                    <div>
                      <span className="text-slate-400">Founded:</span>{' '}
                      {verificationResult.brandInfo.founded}
                    </div>
                  )}
                  {verificationResult.brandInfo.size && (
                    <div>
                      <span className="text-slate-400">Size:</span>{' '}
                      {verificationResult.brandInfo.size}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {/* Verification Strength Indicator */}
                {verificationResult.verification && (
                  <div className="p-3 bg-slate-800/50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Verification Strength</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        verificationResult.verification.disambiguationStrength === 'strong' 
                          ? 'bg-green-900/50 text-green-400 border border-green-700'
                          : verificationResult.verification.disambiguationStrength === 'moderate'
                          ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                          : 'bg-red-900/50 text-red-400 border border-red-700'
                      }`}>
                        {verificationResult.verification.disambiguationStrength.toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Confidence Bar */}
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          verificationResult.verification.confidence >= 0.7 ? 'bg-green-500' :
                          verificationResult.verification.confidence >= 0.4 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${verificationResult.verification.confidence * 100}%` }}
                      />
                    </div>
                    
                    <div className="text-xs text-slate-400">
                      Confidence: {Math.round(verificationResult.verification.confidence * 100)}%
                    </div>
                  </div>
                )}
                
                {/* Unique Identifiers */}
                {verificationResult.verification?.uniqueIdentifiers && verificationResult.verification.uniqueIdentifiers.length > 0 && (
                  <div className="p-3 bg-slate-800/50 rounded">
                    <div className="text-xs font-medium text-slate-400 mb-2">Verified Identifiers:</div>
                    <div className="flex flex-wrap gap-1">
                      {verificationResult.verification.uniqueIdentifiers.slice(0, 5).map((id, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-xs">
                          {id.split(':')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Brand Context */}
                {verificationResult.brandContext && (
                  <div className="p-3 bg-blue-900/20 border border-blue-800 rounded">
                    <div className="text-xs font-medium text-blue-400 mb-1">AI Search Context:</div>
                    <div className="text-xs text-slate-300">{verificationResult.brandContext}</div>
                  </div>
                )}
                
                {/* Warning for weak verification */}
                {verificationResult.verification?.disambiguationStrength === 'weak' && (
                  <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded">
                    <div className="text-xs text-yellow-400">
                      ⚠️ Weak verification - We may need more information to uniquely identify this brand for AI search engines.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleVerificationResponse(false)}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-md font-medium"
            >
              No, this isn't right
            </button>
            <button
              onClick={() => handleVerificationResponse(true)}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-md font-medium"
            >
              Yes, that's correct!
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Additional Details */}
      {step === 'details' && finalBrandInfo && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
            <h2 className="text-xl font-semibold mb-4">Great! Let's add some details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Products & Services</label>
                <textarea
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:border-blue-500 focus:outline-none"
                  rows={2}
                  placeholder="What does your brand offer? (comma separated)"
                  defaultValue={finalBrandInfo.products?.join(', ')}
                  onChange={(e) => {
                    const products = e.target.value.split(',').map(p => p.trim()).filter(Boolean);
                    setFinalBrandInfo({ ...finalBrandInfo, products });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Main Competitors</label>
                <textarea
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:border-blue-500 focus:outline-none"
                  rows={2}
                  placeholder="Who are your main competitors? (comma separated)"
                  defaultValue={finalBrandInfo.competitors?.join(', ')}
                  onChange={(e) => {
                    const competitors = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                    setFinalBrandInfo({ ...finalBrandInfo, competitors });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('verification')}
              className="px-6 py-3 border border-slate-700 rounded-md hover:bg-slate-800"
            >
              Back
            </button>
            <button
              onClick={handleSaveProject}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
            >
              Create Project
            </button>
          </div>
        </div>
      )}
    </main>
  );
}