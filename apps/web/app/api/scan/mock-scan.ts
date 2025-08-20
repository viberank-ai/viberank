import { AnalysisRow, Snapshot, Surface } from '../../../../../packages/types/src/snapshot';

interface MockScanOptions {
  limit: number;
  surfaces: Surface[];
  onProgress: (done: number, total: number) => void;
  brand?: {
    name: string;
    altSpellings?: string[];
    products?: string[];
    competitors?: string[];
  };
  queries?: string[];
}

// Generate brand-specific queries for GEO analysis
function generateBrandQueries(
  brand?: { name: string; products?: string[]; competitors?: string[] },
  limit: number = 20
): string[] {
  if (!brand) {
    return [
      'best headphones 2024',
      'wireless earbuds review',
      'noise cancelling headphones',
      'gaming headset recommendation',
      'audiophile headphones under $200',
    ].slice(0, limit);
  }

  const queries: string[] = [];
  const brandName = brand.name;
  const products = brand.products || [];
  const competitors = brand.competitors || [];

  // 1. Direct brand queries
  queries.push(`what is ${brandName}`);
  queries.push(`${brandName} review`);
  queries.push(`${brandName} vs competitors`);
  queries.push(`is ${brandName} good`);

  // 2. Product-specific queries
  for (const product of products.slice(0, 3)) {
    queries.push(`best ${product} 2024`);
    queries.push(`${product} recommendations`);
    queries.push(`top ${product} companies`);
    queries.push(`${product} software comparison`);
  }

  // 3. Competitive queries
  for (const competitor of competitors.slice(0, 2)) {
    queries.push(`${brandName} vs ${competitor}`);
    queries.push(`${competitor} alternative`);
    if (products[0]) {
      queries.push(`${competitor} vs ${brandName} ${products[0]}`);
    }
  }

  // 4. Industry/category queries if we have products
  if (products.length > 0) {
    const mainProduct = products[0];
    queries.push(`leading ${mainProduct} providers`);
    queries.push(`${mainProduct} market leaders`);
    queries.push(`enterprise ${mainProduct} solutions`);
  }

  // Return requested number of queries
  return queries.slice(0, limit);
}

// Mock implementation for development when scrapers can't load
export async function mockRunScan(
  opts: MockScanOptions
): Promise<{ rows: AnalysisRow[]; snapshots: Snapshot[] }> {
  const { limit, surfaces, onProgress, brand, queries: customQueries } = opts;

  // Use custom queries, or generate brand-specific queries, or fall back to defaults
  const mockQueries =
    customQueries && customQueries.length > 0
      ? customQueries.slice(0, limit)
      : generateBrandQueries(brand, limit);

  const snapshots: Snapshot[] = [];
  const rows: AnalysisRow[] = [];

  const total = mockQueries.length * surfaces.length;
  let done = 0;

  for (const query of mockQueries) {
    for (const surface of surfaces) {
      // Simulate some delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate more realistic mock data based on brand and query context
      const brandName = brand?.name || 'TestBrand';
      const brandDomain = brandName.toLowerCase().replace(/\s+/g, '') + '.com';

      // Different mention patterns based on query type
      const isDirectBrandQuery = query.toLowerCase().includes(brandName.toLowerCase());
      const isCompetitorQuery =
        brand?.competitors?.some((comp) => query.toLowerCase().includes(comp.toLowerCase())) ||
        false;
      const isProductQuery =
        brand?.products?.some((prod) => query.toLowerCase().includes(prod.toLowerCase())) || false;

      // Adjust mention probability based on query relevance
      let mentionChance = Math.random();
      if (isDirectBrandQuery) {
        mentionChance = Math.random() * 0.2 + 0.8; // 80-100% for direct brand queries
      } else if (isProductQuery) {
        mentionChance = Math.random() * 0.4 + 0.4; // 40-80% for product queries
      } else if (isCompetitorQuery) {
        mentionChance = Math.random() * 0.3 + 0.2; // 20-50% for competitor queries
      }

      const isMentioned = mentionChance > 0.3;
      const isAuthoritative = mentionChance > 0.7;

      // Generate contextual HTML based on query and brand
      let html = `<div class="ai-response">`;

      if (isDirectBrandQuery && isMentioned) {
        html += `<p>${brandName} is a company that specializes in ${brand?.products?.[0] || 'technology solutions'}. `;
        if (brand?.products && brand.products.length > 0) {
          html += `They offer ${brand.products.join(', ')} services. `;
        }
        if (brand?.competitors && brand.competitors.length > 0 && Math.random() > 0.5) {
          html += `Key competitors include ${brand.competitors.slice(0, 2).join(' and ')}. `;
        }
      } else if (isProductQuery && isMentioned) {
        const relevantProduct =
          brand?.products?.find((p) => query.toLowerCase().includes(p.toLowerCase())) ||
          brand?.products?.[0];
        html += `<p>When looking for ${relevantProduct || 'solutions'}, ${brandName} stands out as a strong option. `;
        if (brand?.competitors?.[0] && Math.random() > 0.6) {
          html += `While ${brand.competitors[0]} is also popular, ${brandName} offers unique advantages. `;
        }
      } else if (isCompetitorQuery && isMentioned) {
        const mentionedComp = brand?.competitors?.find((c) =>
          query.toLowerCase().includes(c.toLowerCase())
        );
        html += `<p>In addition to ${mentionedComp || 'the mentioned solution'}, ${brandName} is another option worth considering. `;
      } else if (isMentioned) {
        html += `<p>${brandName} provides relevant solutions in this area. `;
        if (brand?.products?.[0]) {
          html += `Their ${brand.products[0]} offering addresses these needs. `;
        }
      } else {
        html += `<p>There are several options available for this query. `;
        if (brand?.competitors && brand.competitors.length > 0) {
          const randomComp =
            brand.competitors[Math.floor(Math.random() * brand.competitors.length)];
          html += `${randomComp} is one popular choice. `;
        } else {
          html += `Industry leaders provide various solutions. `;
        }
      }

      html += `</p></div>`;

      // Add citations if authoritative
      const citations = isAuthoritative
        ? [`https://${brandDomain}`, `https://reviews.com/${brandName.toLowerCase()}`]
        : [`https://example.com/generic-info`];

      const mockSnapshot: Snapshot = {
        id: `mock-${Date.now()}-${Math.random()}`,
        surface,
        query,
        answeredAt: new Date().toISOString(),
        answerHtml: html,
        citations,
        followUps: [`More about ${query}?`, `${brandName} alternatives?`],
      };

      // Calculate realistic score based on presence and authority
      let score = 0;
      if (isMentioned) {
        score = 30 + Math.floor(Math.random() * 40); // 30-70 if mentioned
        if (isAuthoritative) {
          score += 20 + Math.floor(Math.random() * 10); // +20-30 if cited
        }
      } else {
        score = Math.floor(Math.random() * 20); // 0-20 if not mentioned
      }

      const mockRow: AnalysisRow = {
        query,
        surface,
        score,
        present: isMentioned,
        authority: isAuthoritative,
      };

      snapshots.push(mockSnapshot);
      rows.push(mockRow);

      done++;
      onProgress(done, total);
    }
  }

  return { rows, snapshots };
}
