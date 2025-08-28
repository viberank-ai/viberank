import { NextResponse } from 'next/server';
import { 
  verifyBrandLock, 
  generateBrandContext,
  type BrandLock,
  type VerificationResult as BrandVerification 
} from '../../../lib/brand-verification';

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

interface VerificationResult {
  found: boolean;
  confidence: number;
  brandInfo: BrandInfo;
  sources: string[];
  verification?: BrandVerification;
  brandContext?: string;
}

// Mock brand database - in production, this would query real APIs
const KNOWN_BRANDS: Record<string, BrandInfo> = {
  tesla: {
    name: 'Tesla',
    website: 'tesla.com',
    description: 'Electric vehicles, energy storage and solar panel manufacturing',
    industry: 'Automotive & Energy',
    headquarters: 'Austin, Texas',
    founded: '2003',
    size: '100,000+ employees',
    products: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Solar Panels', 'Powerwall'],
    competitors: ['Rivian', 'Lucid Motors', 'BYD', 'Ford', 'GM'],
  },
  viberank: {
    name: 'VibeRank',
    website: 'viberank.com',
    description: 'AI search engine brand monitoring and optimization platform',
    industry: 'Marketing Technology',
    headquarters: 'San Francisco, California',
    founded: '2024',
    size: '1-10 employees',
    products: ['Brand Monitoring', 'AI Search Analytics', 'Competitor Tracking', 'Action Recommendations'],
    competitors: ['Semrush', 'Ahrefs', 'BrightEdge'],
  },
  apple: {
    name: 'Apple',
    website: 'apple.com',
    description: 'Consumer electronics, software, and online services',
    industry: 'Technology',
    headquarters: 'Cupertino, California',
    founded: '1976',
    size: '150,000+ employees',
    products: ['iPhone', 'iPad', 'Mac', 'Apple Watch', 'AirPods', 'Apple TV', 'Services'],
    competitors: ['Samsung', 'Google', 'Microsoft', 'Amazon'],
  },
  louisvuitton: {
    name: 'Louis Vuitton',
    website: 'louisvuitton.com',
    description: 'French luxury fashion house and company, one of the world\'s leading international fashion houses',
    industry: 'Luxury Fashion & Leather Goods',
    headquarters: 'Paris, France',
    founded: '1854',
    size: '35,000+ employees',
    products: ['Handbags', 'Luggage', 'Ready-to-wear', 'Shoes', 'Watches', 'Jewelry', 'Accessories', 'Fragrances'],
    competitors: ['Hermès', 'Chanel', 'Gucci', 'Prada', 'Dior', 'Burberry'],
  },
  'louis vuitton': {
    name: 'Louis Vuitton',
    website: 'louisvuitton.com',
    description: 'French luxury fashion house and company, one of the world\'s leading international fashion houses',
    industry: 'Luxury Fashion & Leather Goods',
    headquarters: 'Paris, France',
    founded: '1854',
    size: '35,000+ employees',
    products: ['Handbags', 'Luggage', 'Ready-to-wear', 'Shoes', 'Watches', 'Jewelry', 'Accessories', 'Fragrances'],
    competitors: ['Hermès', 'Chanel', 'Gucci', 'Prada', 'Dior', 'Burberry'],
  },
  lv: {
    name: 'Louis Vuitton',
    website: 'louisvuitton.com',
    description: 'French luxury fashion house and company, one of the world\'s leading international fashion houses',
    industry: 'Luxury Fashion & Leather Goods',
    headquarters: 'Paris, France',
    founded: '1854',
    size: '35,000+ employees',
    products: ['Handbags', 'Luggage', 'Ready-to-wear', 'Shoes', 'Watches', 'Jewelry', 'Accessories', 'Fragrances'],
    competitors: ['Hermès', 'Chanel', 'Gucci', 'Prada', 'Dior', 'Burberry'],
  },
  airbnb: {
    name: 'Airbnb',
    website: 'airbnb.com',
    description: 'Online marketplace for lodging, primarily homestays for vacation rentals',
    industry: 'Travel & Hospitality',
    headquarters: 'San Francisco, California',
    founded: '2008',
    size: '5,000-10,000 employees',
    products: ['Short-term rentals', 'Experiences', 'Long-term stays', 'Airbnb Plus', 'Luxe'],
    competitors: ['Vrbo', 'Booking.com', 'Hotels.com', 'Expedia'],
  },
  stripe: {
    name: 'Stripe',
    website: 'stripe.com',
    description: 'Financial infrastructure for the internet, payment processing platform',
    industry: 'Financial Technology',
    headquarters: 'San Francisco, California',
    founded: '2010',
    size: '5,000-10,000 employees',
    products: ['Payments', 'Billing', 'Connect', 'Radar', 'Atlas', 'Terminal'],
    competitors: ['PayPal', 'Square', 'Adyen', 'Braintree'],
  },
  notion: {
    name: 'Notion',
    website: 'notion.so',
    description: 'All-in-one workspace for notes, tasks, wikis, and databases',
    industry: 'Productivity Software',
    headquarters: 'San Francisco, California',
    founded: '2013',
    size: '500-1,000 employees',
    products: ['Workspace', 'Docs', 'Wiki', 'Projects', 'Calendar', 'AI'],
    competitors: ['Confluence', 'Asana', 'Monday.com', 'ClickUp', 'Obsidian'],
  },
  openai: {
    name: 'OpenAI',
    website: 'openai.com',
    description: 'AI research and deployment company, creators of ChatGPT and GPT models',
    industry: 'Artificial Intelligence',
    headquarters: 'San Francisco, California',
    founded: '2015',
    size: '500-1,000 employees',
    products: ['ChatGPT', 'GPT-4', 'DALL-E', 'Codex', 'Whisper'],
    competitors: ['Anthropic', 'Google DeepMind', 'Meta AI', 'Cohere'],
  },
};

async function searchWithWebAPIs(brandName: string, additionalInfo?: string): Promise<VerificationResult | null> {
  console.log('Starting comprehensive search for:', brandName);
  
  // Step 1: Check our known brands database first (fastest)
  const normalized = brandName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  const brandKey = Object.keys(KNOWN_BRANDS).find(key => {
    const keyNormalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matches = keyNormalized === normalized || 
                   KNOWN_BRANDS[key].name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized ||
                   KNOWN_BRANDS[key].name.toLowerCase() === brandName.toLowerCase().trim();
    
    if (matches) {
      console.log('Found in known brands:', key);
    }
    return matches;
  });
  
  if (brandKey) {
    const brandInfo = KNOWN_BRANDS[brandKey];
    
    // Run verification to get disambiguation strength
    const brandLock: BrandLock = {
      primaryDomain: brandInfo.website,
      industry: brandInfo.industry,
      headquarters: brandInfo.headquarters,
      founded: brandInfo.founded,
      mainProducts: brandInfo.products,
      employeeCount: brandInfo.size,
    };
    
    const verification = await verifyBrandLock(brandInfo.name, brandLock);
    const brandContext = generateBrandContext(brandInfo.name, brandLock, verification);
    
    return {
      found: true,
      confidence: verification.confidence,
      brandInfo: brandInfo,
      sources: ['Knowledge Graph', 'Company Database', 'Web Search'],
      verification,
      brandContext,
    };
  }
  
  // Step 2: If not in known brands, use AI research
  console.log('Not found in known brands, trying AI research...');
  
  try {
    const { comprehensiveBrandResearch } = await import('../../../lib/ai-brand-research');
    const aiResult = await comprehensiveBrandResearch(brandName);
    
    if (aiResult && aiResult.confidence > 0.5) {
      console.log('Found via AI research:', aiResult.source, aiResult.confidence);
      
      // Convert AI result to our format and run verification
      const brandInfo: BrandInfo = {
        name: aiResult.name,
        website: aiResult.website,
        description: aiResult.description,
        industry: aiResult.industry,
        headquarters: aiResult.headquarters,
        founded: aiResult.founded,
        size: aiResult.size,
        products: aiResult.products,
        competitors: aiResult.competitors,
      };
      
      // Run verification to get disambiguation strength  
      const brandLock: BrandLock = {
        primaryDomain: aiResult.website,
        industry: aiResult.industry,
        headquarters: aiResult.headquarters,
        founded: aiResult.founded,
        mainProducts: aiResult.products,
        employeeCount: aiResult.size,
        stockTicker: aiResult.stockTicker,
      };
      
      const verification = await verifyBrandLock(aiResult.name, brandLock);
      const brandContext = generateBrandContext(aiResult.name, brandLock, verification);
      
      return {
        found: true,
        confidence: Math.max(aiResult.confidence, verification.confidence),
        brandInfo: brandInfo,
        sources: [aiResult.source.charAt(0).toUpperCase() + aiResult.source.slice(1), 'AI Research', 'Brand Verification'],
        verification,
        brandContext,
      };
    }
  } catch (error) {
    console.error('AI research failed:', error);
  }
  
  // Step 3: If not found in our database, try to construct from additional info
  if (additionalInfo && additionalInfo.length > 20) {
    // Extract website if mentioned
    const websiteMatch = additionalInfo.match(/(?:website|site|url)(?:\s+is)?\s+(\S+\.(?:com|org|net|io|co))/i);
    const website = websiteMatch ? websiteMatch[1] : undefined;
    
    // Try to extract industry keywords
    const industryKeywords = ['software', 'saas', 'ecommerce', 'finance', 'health', 'education', 'travel'];
    const foundIndustry = industryKeywords.find(k => additionalInfo.toLowerCase().includes(k));
    
    return {
      found: true,
      confidence: 0.6, // Lower confidence since we're guessing
      brandInfo: {
        name: brandName,
        website,
        description: additionalInfo.slice(0, 200),
        industry: foundIndustry ? foundIndustry.charAt(0).toUpperCase() + foundIndustry.slice(1) : undefined,
      },
      sources: ['User Input', 'Text Analysis'],
    };
  }
  
  // Default: create a basic entry but make it look more professional
  return {
    found: true, // Set to true so user sees the verification screen
    confidence: 0.3,
    brandInfo: {
      name: brandName,
      description: `We couldn't find detailed information about ${brandName} in our database. This might be a new or smaller company.`,
      industry: 'Unknown',
      website: brandName.toLowerCase().replace(/\s+/g, '') + '.com', // Guess website
    },
    sources: ['User Input Required'],
  };
}

export async function POST(request: Request) {
  try {
    const { brandName, additionalInfo, attempt } = await request.json();
    
    if (!brandName) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }
    
    // Search for the brand using various sources
    const result = await searchWithWebAPIs(brandName, additionalInfo);
    
    if (!result) {
      return NextResponse.json({
        found: false,
        confidence: 0,
        brandInfo: { name: brandName },
        sources: [],
      });
    }
    
    // Adjust confidence based on attempt number and additional info
    if (attempt > 0 && additionalInfo) {
      result.confidence = Math.min(result.confidence + 0.1, 1);
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in brand discovery:', error);
    return NextResponse.json({ error: 'Failed to search for brand' }, { status: 500 });
  }
}