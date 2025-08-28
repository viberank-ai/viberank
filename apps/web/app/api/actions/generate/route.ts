import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type GeneratedAction = {
  id: string;
  type: string;
  title: string;
  description: string;
  steps: string[];
  related: string[];
  effort: number;
  impact: number;
  confidence: number;
  ice: number;
  source: {
    query: string;
    surface: string;
    score: number;
    present: boolean;
  };
};

function generateActionsForProblem(query: string, surface: string, score: number, present: boolean): GeneratedAction[] {
  const actions: GeneratedAction[] = [];
  const baseId = `${query}-${surface}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  
  if (!present) {
    // Brand not mentioned at all
    actions.push({
      id: `content-${baseId}-${Date.now()}`,
      type: 'Content',
      title: `Create "${query}" content targeting ${surface}`,
      description: `Brand completely missing from "${query}" results on ${surface}. Create targeted content.`,
      steps: [
        `Research current ${surface} results for "${query}"`,
        `Create comprehensive content answering "${query}"`,
        `Optimize for ${surface} with relevant schema markup`,
        `Build internal/external links to boost authority`
      ],
      related: [`NO_BRAND_MENTION-${baseId}`],
      effort: 3,
      impact: 4,
      confidence: 4,
      ice: 53,
      source: { query, surface, score, present }
    });
  } else if (score < 30) {
    // Present but very low score
    actions.push({
      id: `authority-${baseId}-${Date.now()}`,
      type: 'Authority',
      title: `Boost authority for "${query}" on ${surface}`,
      description: `Low visibility score (${score}) despite brand presence. Focus on authority building.`,
      steps: [
        `Audit current content for "${query}"`,
        `Add authoritative citations and data`,
        `Build high-quality backlinks to the content`,
        `Optimize technical SEO signals`
      ],
      related: [`LOW_AUTHORITY-${baseId}`],
      effort: 2,
      impact: 3,
      confidence: 3,
      ice: 45,
      source: { query, surface, score, present }
    });
  } else {
    // Moderate score - optimization opportunity
    actions.push({
      id: `optimize-${baseId}-${Date.now()}`,
      type: 'Optimization',
      title: `Optimize "${query}" performance on ${surface}`,
      description: `Moderate score (${score}) - opportunity to reach top position.`,
      steps: [
        `Analyze top-performing content for "${query}"`,
        `Enhance content depth and user experience`,
        `Add FAQ section addressing related queries`,
        `Implement structured data markup`
      ],
      related: [`OPTIMIZATION-${baseId}`],
      effort: 2,
      impact: 2,
      confidence: 4,
      ice: 40,
      source: { query, surface, score, present }
    });
  }

  return actions;
}

export async function POST(request: Request) {
  try {
    const { query, surface, score, present, projectId } = await request.json();
    
    if (!query || !surface || score === undefined || present === undefined || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate actions for this specific problem
    const newActions = generateActionsForProblem(query, surface, score, present);
    
    // Load existing recommendations for this project
    const recommendationsFile = path.join(process.cwd(), 'data', `recommendations-${projectId}.json`);
    let existingActions: GeneratedAction[] = [];
    
    try {
      const raw = await fs.readFile(recommendationsFile, 'utf-8');
      existingActions = JSON.parse(raw);
    } catch {
      // File doesn't exist yet - that's fine
    }
    
    // Add new actions (avoid duplicates by checking source)
    const existingSourceIds = new Set(
      existingActions
        .filter(a => a.source)
        .map(a => `${a.source.query}:${a.source.surface}`)
    );
    
    const sourceId = `${query}:${surface}`;
    if (!existingSourceIds.has(sourceId)) {
      existingActions.push(...newActions);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(recommendationsFile), { recursive: true });
      
      // Save updated recommendations for this project
      await fs.writeFile(recommendationsFile, JSON.stringify(existingActions, null, 2));
    }
    
    return NextResponse.json({ 
      success: true, 
      actionsGenerated: newActions.length,
      actions: newActions 
    });
    
  } catch (error) {
    console.error('Error generating actions:', error);
    return NextResponse.json({ error: 'Failed to generate actions' }, { status: 500 });
  }
}