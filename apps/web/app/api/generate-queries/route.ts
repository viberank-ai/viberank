import { NextResponse } from 'next/server';
import { generateQueries } from '../../../../../packages/queries/src/generator';

export async function POST(req: Request) {
  try {
    const { brand } = await req.json();

    if (!brand || !brand.name) {
      return NextResponse.json({ error: 'Brand configuration is required' }, { status: 400 });
    }

    // Generate queries using the existing generator
    const queries = await generateQueries(brand);

    // Return generated queries
    return NextResponse.json({
      queries,
      count: queries.length,
    });
  } catch (error) {
    console.error('Query generation failed:', error);

    // Fallback to default queries if generation fails
    const defaultQueries = [
      `What is ${brand.name}?`,
      `${brand.name} reviews`,
      `${brand.name} pricing`,
      `${brand.name} alternatives`,
      `How does ${brand.name} work?`,
      `${brand.name} vs competitors`,
      `Is ${brand.name} worth it?`,
      `${brand.name} features`,
      `${brand.name} pros and cons`,
      `Best ${brand.products?.[0] || 'solution'} for businesses`,
    ];

    return NextResponse.json({
      queries: defaultQueries,
      count: defaultQueries.length,
      fallback: true,
    });
  }
}
