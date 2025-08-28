export interface BrandLock {
  // Core identifiers
  primaryDomain?: string;
  wikipediaUrl?: string;
  
  // Social/Professional
  linkedinUrl?: string;
  twitterHandle?: string;
  
  // Business identifiers  
  stockTicker?: string;
  employerID?: string;
  
  // Knowledge bases
  wikidataId?: string;
  googleKgId?: string;
  crunchbaseUrl?: string;
  
  // Context for disambiguation
  foundedYear?: string;
  headquarters?: string;
  industry?: string;
  parentCompany?: string;
  
  // Unique attributes
  ceoName?: string;
  mainProducts?: string[];
  revenue?: string;
  employeeCount?: string;
}

export interface VerificationResult {
  confidence: number;
  uniqueIdentifiers: string[];
  disambiguationStrength: 'weak' | 'moderate' | 'strong';
  verifiedDomain?: string;
  suggestedQueries: string[]; // Queries to help LLMs understand this brand
}

// Simulated domain verification - in production would use WHOIS/DNS
async function verifyDomainOwnership(domain: string, brandName: string): Promise<boolean> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check if domain reasonably matches brand name
  const normalizedDomain = domain.toLowerCase().replace(/\.(com|org|net|io|co|ai)$/, '');
  const normalizedBrand = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return normalizedDomain.includes(normalizedBrand.slice(0, 4)) || 
         normalizedBrand.includes(normalizedDomain.slice(0, 4));
}

// Wikipedia verification 
async function verifyWikipediaPage(brandName: string, industry?: string): Promise<string | null> {
  try {
    // Try real Wikipedia API first
    const searchQuery = industry ? `${brandName} ${industry} company` : `${brandName} company`;
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchQuery)}&limit=3&format=json&origin=*`;
    
    const response = await fetch(url).catch(() => null);
    
    if (response && response.ok) {
      const data = await response.json();
      // data[1] = titles, data[3] = URLs
      if (data && data[3] && data[3].length > 0) {
        // Return the first Wikipedia URL that looks like a company page
        for (let i = 0; i < data[3].length; i++) {
          const pageUrl = data[3][i];
          const title = data[1][i];
          // Check if it's likely a company page
          if (title && (title.includes(brandName) || brandName.includes(title))) {
            console.log(`Found Wikipedia page for ${brandName}: ${pageUrl}`);
            return pageUrl;
          }
        }
      }
    }
  } catch (error) {
    console.log('Wikipedia API error, falling back to mock data:', error);
  }
  
  // Mock data for known brands
  const mockWikipedia: Record<string, string> = {
    'tesla': 'https://en.wikipedia.org/wiki/Tesla,_Inc.',
    'apple': 'https://en.wikipedia.org/wiki/Apple_Inc.',
    'google': 'https://en.wikipedia.org/wiki/Google',
    'microsoft': 'https://en.wikipedia.org/wiki/Microsoft',
    'amazon': 'https://en.wikipedia.org/wiki/Amazon_(company)',
    'louis vuitton': 'https://en.wikipedia.org/wiki/Louis_Vuitton',
    'louisvuitton': 'https://en.wikipedia.org/wiki/Louis_Vuitton',
  };
  
  const normalized = brandName.toLowerCase();
  return mockWikipedia[normalized] || null;
}

// Wikidata lookup for structured data
async function getWikidataId(brandName: string): Promise<string | null> {
  // In production, would query Wikidata SPARQL endpoint
  const mockWikidata: Record<string, string> = {
    'tesla': 'Q478214',
    'apple': 'Q312',
    'google': 'Q95',
    'microsoft': 'Q2283',
    'amazon': 'Q3884',
    'stripe': 'Q2329335',
    'openai': 'Q21680268',
    'louis vuitton': 'Q191485',
    'louisvuitton': 'Q191485',
  };
  
  return mockWikidata[brandName.toLowerCase()] || null;
}

// Google Knowledge Graph lookup
async function getGoogleKgId(brandName: string): Promise<string | null> {
  // In production, would use Google Knowledge Graph Search API
  const mockKgIds: Record<string, string> = {
    'tesla': '/m/0dr90d',
    'apple': '/m/0k8z',
    'google': '/m/045c7b',
    'microsoft': '/m/04sv4',
    'amazon': '/m/0mgkg',
  };
  
  return mockKgIds[brandName.toLowerCase()] || null;
}

// LinkedIn company verification
async function verifyLinkedIn(brandName: string): Promise<string | null> {
  // In production, would check LinkedIn API or scrape
  const mockLinkedIn: Record<string, string> = {
    'tesla': 'https://linkedin.com/company/tesla-motors',
    'apple': 'https://linkedin.com/company/apple',
    'google': 'https://linkedin.com/company/google',
    'microsoft': 'https://linkedin.com/company/microsoft',
    'stripe': 'https://linkedin.com/company/stripe',
    'airbnb': 'https://linkedin.com/company/airbnb',
  };
  
  return mockLinkedIn[brandName.toLowerCase()] || null;
}

// Stock ticker lookup
async function getStockTicker(brandName: string): Promise<string | null> {
  const mockTickers: Record<string, string> = {
    'tesla': 'TSLA',
    'apple': 'AAPL',
    'google': 'GOOGL',
    'microsoft': 'MSFT',
    'amazon': 'AMZN',
    'meta': 'META',
    'netflix': 'NFLX',
  };
  
  return mockTickers[brandName.toLowerCase()] || null;
}

// Main verification function
export async function verifyBrandLock(
  brandName: string,
  providedInfo?: Partial<BrandLock>
): Promise<VerificationResult> {
  const identifiers: string[] = [];
  let score = 0;
  const suggestedQueries: string[] = [];
  
  // 1. Domain verification (40 points)
  let verifiedDomain: string | undefined;
  if (providedInfo?.primaryDomain) {
    const domainValid = await verifyDomainOwnership(providedInfo.primaryDomain, brandName);
    if (domainValid) {
      score += 40;
      verifiedDomain = providedInfo.primaryDomain;
      identifiers.push(`domain:${providedInfo.primaryDomain}`);
      suggestedQueries.push(`site:${providedInfo.primaryDomain}`);
    }
  }
  
  // 2. Wikipedia verification (25 points)
  const wikipediaUrl = providedInfo?.wikipediaUrl || 
                       await verifyWikipediaPage(brandName, providedInfo?.industry);
  if (wikipediaUrl) {
    score += 25;
    identifiers.push(`wikipedia:${wikipediaUrl}`);
    suggestedQueries.push(`${brandName} wikipedia`);
  }
  
  // 3. Wikidata ID (15 points)
  const wikidataId = providedInfo?.wikidataId || await getWikidataId(brandName);
  if (wikidataId) {
    score += 15;
    identifiers.push(`wikidata:${wikidataId}`);
  }
  
  // 4. Google Knowledge Graph (10 points)
  const googleKgId = providedInfo?.googleKgId || await getGoogleKgId(brandName);
  if (googleKgId) {
    score += 10;
    identifiers.push(`gkg:${googleKgId}`);
  }
  
  // 5. LinkedIn verification (5 points)
  const linkedinUrl = providedInfo?.linkedinUrl || await verifyLinkedIn(brandName);
  if (linkedinUrl) {
    score += 5;
    identifiers.push(`linkedin:${linkedinUrl}`);
  }
  
  // 6. Stock ticker (5 points for public companies)
  const stockTicker = providedInfo?.stockTicker || await getStockTicker(brandName);
  if (stockTicker) {
    score += 5;
    identifiers.push(`stock:${stockTicker}`);
    suggestedQueries.push(`${stockTicker} stock`);
  }
  
  // 7. Context bonus (up to 10 points)
  if (providedInfo?.headquarters) {
    score += 3;
    identifiers.push(`hq:${providedInfo.headquarters}`);
    suggestedQueries.push(`${brandName} ${providedInfo.headquarters}`);
  }
  
  if (providedInfo?.industry) {
    score += 3;
    identifiers.push(`industry:${providedInfo.industry}`);
    suggestedQueries.push(`${brandName} ${providedInfo.industry}`);
  }
  
  if (providedInfo?.foundedYear) {
    score += 2;
    identifiers.push(`founded:${providedInfo.foundedYear}`);
  }
  
  if (providedInfo?.ceoName) {
    score += 2;
    identifiers.push(`ceo:${providedInfo.ceoName}`);
    suggestedQueries.push(`${providedInfo.ceoName} ${brandName}`);
  }
  
  // Add product-based queries
  if (providedInfo?.mainProducts && providedInfo.mainProducts.length > 0) {
    suggestedQueries.push(`${brandName} ${providedInfo.mainProducts[0]}`);
  }
  
  // Determine disambiguation strength
  let disambiguationStrength: 'weak' | 'moderate' | 'strong';
  if (score >= 70) {
    disambiguationStrength = 'strong';
  } else if (score >= 40) {
    disambiguationStrength = 'moderate';
  } else {
    disambiguationStrength = 'weak';
  }
  
  return {
    confidence: Math.min(score / 100, 1),
    uniqueIdentifiers: identifiers,
    disambiguationStrength,
    verifiedDomain,
    suggestedQueries,
  };
}

// Generate LLM-friendly brand description
export function generateBrandContext(
  brandName: string,
  lock: BrandLock
  // verificationResult: VerificationResult // Reserved for future use
): string {
  const parts: string[] = [brandName];
  
  if (lock.primaryDomain) {
    parts.push(`(${lock.primaryDomain})`);
  }
  
  if (lock.industry) {
    parts.push(`- ${lock.industry} company`);
  }
  
  if (lock.headquarters) {
    parts.push(`based in ${lock.headquarters}`);
  }
  
  if (lock.foundedYear) {
    parts.push(`founded ${lock.foundedYear}`);
  }
  
  if (lock.ceoName) {
    parts.push(`led by ${lock.ceoName}`);
  }
  
  if (lock.mainProducts && lock.mainProducts.length > 0) {
    parts.push(`known for ${lock.mainProducts.slice(0, 2).join(', ')}`);
  }
  
  if (lock.stockTicker) {
    parts.push(`(${lock.stockTicker})`);
  }
  
  return parts.join(' ');
}

// Check if we have enough info to disambiguate
export function hasStrongDisambiguation(result: VerificationResult): boolean {
  return result.disambiguationStrength === 'strong' || 
         (result.disambiguationStrength === 'moderate' && result.verifiedDomain !== undefined);
}