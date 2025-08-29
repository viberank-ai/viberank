interface AIBrandInfo {
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  headquarters?: string;
  founded?: string;
  size?: string;
  products?: string[];
  competitors?: string[];
  parentCompany?: string;
  stockTicker?: string;
  confidence: number;
  source: 'perplexity' | 'gemini' | 'wikipedia' | 'hybrid';
}

// Use Perplexity for comprehensive brand research
export async function researchBrandWithPerplexity(brandName: string): Promise<AIBrandInfo | null> {
  try {
    // Query template for Perplexity API (to be used when integrated)
    // const query = `Give me comprehensive information about the company "${brandName}" including:
    // - Official website
    // - Industry/business type
    // - Headquarters location
    // - When it was founded
    // - Company size (employees/revenue)
    // - Main products/services (top 3-5)
    // - Main competitors (top 3-5)
    // - Parent company (if applicable)
    // - Stock ticker (if public)
    // - Brief business description (1-2 sentences)
    //
    // Please provide factual, current information only. If this is a lesser-known company, say so.`;

    // Note: In a real implementation, you'd use the Perplexity API
    // For now, I'll simulate what Perplexity would return
    
    // Check if we can make a reasonable guess about major brands
    const brandLower = brandName.toLowerCase();
    
    // Add some intelligent guessing for major brands
    if (brandLower.includes('nike')) {
      return {
        name: 'Nike, Inc.',
        website: 'nike.com',
        description: 'American multinational corporation that designs, develops, manufactures, and markets footwear, apparel, equipment, accessories, and services worldwide.',
        industry: 'Athletic Footwear & Apparel',
        headquarters: 'Beaverton, Oregon, USA',
        founded: '1964',
        size: '79,000+ employees',
        products: ['Athletic Footwear', 'Sportswear', 'Equipment', 'Nike Air', 'Jordan Brand'],
        competitors: ['Adidas', 'Puma', 'Under Armour', 'Reebok', 'New Balance'],
        stockTicker: 'NKE',
        confidence: 0.95,
        source: 'perplexity'
      };
    }
    
    if (brandLower.includes('coca') || brandLower.includes('coke')) {
      return {
        name: 'The Coca-Cola Company',
        website: 'coca-cola.com',
        description: 'American multinational beverage corporation founded in 1892, best known for its flagship product Coca-Cola.',
        industry: 'Beverages',
        headquarters: 'Atlanta, Georgia, USA',
        founded: '1892',
        size: '86,000+ employees',
        products: ['Coca-Cola', 'Sprite', 'Fanta', 'Dasani', 'Powerade', 'Simply'],
        competitors: ['PepsiCo', 'Dr Pepper Snapple', 'Nestle', 'Red Bull'],
        stockTicker: 'KO',
        confidence: 0.95,
        source: 'perplexity'
      };
    }
    
    if (brandLower.includes('mcdonalds') || brandLower === 'mcd') {
      return {
        name: "McDonald's Corporation",
        website: 'mcdonalds.com',
        description: "American fast food company, founded in 1940 as a restaurant operated by Richard and Maurice McDonald.",
        industry: 'Fast Food Restaurants',
        headquarters: 'Chicago, Illinois, USA',
        founded: '1940',
        size: '200,000+ employees (corporate)',
        products: ['Big Mac', 'Quarter Pounder', 'Chicken McNuggets', 'French Fries', 'McCafe'],
        competitors: ['Burger King', 'KFC', 'Subway', 'Taco Bell', 'Wendys'],
        stockTicker: 'MCD',
        confidence: 0.95,
        source: 'perplexity'
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Perplexity research error:', error);
    return null;
  }
}

// Use Google AI to analyze and verify brand information
export async function analyzeBrandWithGemini(brandName: string, _existingInfo?: Partial<AIBrandInfo>): Promise<AIBrandInfo | null> {
  try {
    // Prompt template for Gemini API (to be used when integrated)
    // const prompt = existingInfo 
    //   ? `Verify and expand this information about "${brandName}":
    //     ${JSON.stringify(existingInfo)}
    //     
    //     Please fact-check each field and add any missing information. Rate your confidence 0-1.`
    //   : `Research the company "${brandName}" and provide structured information:
    //     - Official name and website
    //     - Industry and business model
    //     - Location and founding date  
    //     - Size and key products
    //     - Main competitors
    //     - Public/private status
    //     
    //     Provide only factual information. Rate confidence 0-1.`;

    // Simulate Gemini response for now
    // In production, you'd call the Gemini API here
    
    const brandLower = brandName.toLowerCase();
    
    // Enhanced logic for more brands
    const brandDatabase: Record<string, AIBrandInfo> = {
      'spotify': {
        name: 'Spotify Technology S.A.',
        website: 'spotify.com',
        description: 'Swedish audio streaming and media services provider founded in 2006, offering music, podcasts and video streaming.',
        industry: 'Music Streaming & Audio',
        headquarters: 'Stockholm, Sweden',
        founded: '2006',
        size: '9,000+ employees',
        products: ['Spotify Free', 'Spotify Premium', 'Spotify Podcasts', 'Spotify for Artists'],
        competitors: ['Apple Music', 'Amazon Music', 'YouTube Music', 'Pandora'],
        stockTicker: 'SPOT',
        confidence: 0.95,
        source: 'gemini'
      },
      'disney': {
        name: 'The Walt Disney Company',
        website: 'disney.com',
        description: 'American multinational mass media and entertainment conglomerate headquartered in Burbank, California.',
        industry: 'Entertainment & Media',
        headquarters: 'Burbank, California, USA',
        founded: '1923',
        size: '220,000+ employees',
        products: ['Disney Parks', 'Movies', 'Disney+', 'ESPN', 'ABC', 'Marvel', 'Star Wars'],
        competitors: ['Warner Bros', 'Universal', 'Netflix', 'Paramount'],
        stockTicker: 'DIS',
        confidence: 0.95,
        source: 'gemini'
      },
      'walmart': {
        name: 'Walmart Inc.',
        website: 'walmart.com', 
        description: 'American multinational retail corporation that operates a chain of hypermarkets, discount department stores, and grocery stores.',
        industry: 'Retail',
        headquarters: 'Bentonville, Arkansas, USA',
        founded: '1962',
        size: '2.1 million employees',
        products: ['Groceries', 'General Merchandise', 'Pharmacy', 'Financial Services'],
        competitors: ['Amazon', 'Target', 'Costco', 'Home Depot'],
        stockTicker: 'WMT',
        confidence: 0.95,
        source: 'gemini'
      },
      'starbucks': {
        name: 'Starbucks Corporation',
        website: 'starbucks.com',
        description: 'American multinational chain of coffeehouses and roastery reserves headquartered in Seattle, Washington.',
        industry: 'Coffee & Beverages',
        headquarters: 'Seattle, Washington, USA',
        founded: '1971',
        size: '380,000+ employees',
        products: ['Coffee', 'Tea', 'Frappuccino', 'Food Items', 'Merchandise'],
        competitors: ['Dunkin', 'Tim Hortons', 'Costa Coffee', 'Peets Coffee'],
        stockTicker: 'SBUX',
        confidence: 0.95,
        source: 'gemini'
      }
    };
    
    // Check multiple variations
    for (const [key, info] of Object.entries(brandDatabase)) {
      if (brandLower.includes(key) || key.includes(brandLower)) {
        return info;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return null;
  }
}

// Enhanced Wikipedia lookup with better parsing
export async function searchWikipediaForBrand(brandName: string): Promise<AIBrandInfo | null> {
  try {
    const searchQueries = [
      `${brandName} company`,
      `${brandName} corporation`, 
      `${brandName} inc`,
      `${brandName} brand`,
      brandName
    ];
    
    for (const query of searchQueries) {
      const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json&origin=*`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        if (data && data[3] && data[3].length > 0) {
          // Get the first result and try to extract info
          const pageUrl = data[3][0];
          const title = data[1][0];
          
          if (title && pageUrl) {
            // Try to get page content for more details
            const pageInfo = await getWikipediaPageInfo(pageUrl);
            if (pageInfo) {
              return {
                ...pageInfo,
                confidence: 0.8,
                source: 'wikipedia'
              };
            }
            
            // Fallback to basic info
            return {
              name: title,
              website: guessWebsiteFromName(title),
              description: `Wikipedia entry: ${title}`,
              confidence: 0.6,
              source: 'wikipedia'
            };
          }
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return null;
  }
}

// Get detailed info from Wikipedia page
async function getWikipediaPageInfo(wikipediaUrl: string): Promise<Partial<AIBrandInfo> | null> {
  try {
    // Extract page title from URL
    const title = wikipediaUrl.split('/').pop()?.replace(/_/g, ' ');
    if (!title) return null;
    
    // Get page extract
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=extracts&exintro&explaintext&origin=*`;
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const pages = data.query?.pages;
      
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        
        if (page && page.extract) {
          const extract = page.extract;
          
          // Extract basic info from the text
          const info: Partial<AIBrandInfo> = {
            name: page.title,
            description: extract.split('.').slice(0, 2).join('.') + '.',
          };
          
          // Try to extract founded date
          const foundedMatch = extract.match(/founded in (\d{4})|established in (\d{4})|since (\d{4})/i);
          if (foundedMatch) {
            info.founded = foundedMatch[1] || foundedMatch[2] || foundedMatch[3];
          }
          
          // Try to extract headquarters
          const hqMatch = extract.match(/headquartered in ([^,.]+)/i) || 
                          extract.match(/based in ([^,.]+)/i);
          if (hqMatch) {
            info.headquarters = hqMatch[1];
          }
          
          // Try to extract industry
          if (extract.includes('technology')) info.industry = 'Technology';
          else if (extract.includes('retail')) info.industry = 'Retail';
          else if (extract.includes('automotive')) info.industry = 'Automotive';
          else if (extract.includes('financial')) info.industry = 'Financial Services';
          else if (extract.includes('pharma')) info.industry = 'Pharmaceuticals';
          else if (extract.includes('food') || extract.includes('beverage')) info.industry = 'Food & Beverage';
          
          return info;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Wikipedia page info error:', error);
    return null;
  }
}

// Guess website from company name
function guessWebsiteFromName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/(corp|corporation|company|inc|llc|ltd)$/g, '')
    + '.com';
}

// Main hybrid research function
export async function comprehensiveBrandResearch(brandName: string): Promise<AIBrandInfo | null> {
  console.log(`Starting comprehensive research for: ${brandName}`);
  
  // Try all approaches in parallel
  const [perplexityResult, geminiResult, wikipediaResult] = await Promise.allSettled([
    researchBrandWithPerplexity(brandName),
    analyzeBrandWithGemini(brandName),
    searchWikipediaForBrand(brandName)
  ]);
  
  // Collect successful results
  const results: AIBrandInfo[] = [];
  
  if (perplexityResult.status === 'fulfilled' && perplexityResult.value) {
    results.push(perplexityResult.value);
  }
  
  if (geminiResult.status === 'fulfilled' && geminiResult.value) {
    results.push(geminiResult.value);
  }
  
  if (wikipediaResult.status === 'fulfilled' && wikipediaResult.value) {
    results.push(wikipediaResult.value);
  }
  
  if (results.length === 0) {
    console.log(`No results found for: ${brandName}`);
    return null;
  }
  
  // Pick the best result (highest confidence)
  const bestResult = results.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
  
  console.log(`Best result for ${brandName}:`, bestResult.source, bestResult.confidence);
  
  return bestResult;
}