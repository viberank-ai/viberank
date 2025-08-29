import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  
  if (!projectId) {
    return NextResponse.json({ error: 'No project ID provided' }, { status: 400 });
  }

  // Use project-specific recommendations file
  const file = path.join(process.cwd(), 'data', `recommendations-${projectId}.json`);
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    // Try loading default recommendations as fallback
    const defaultFile = path.join(process.cwd(), 'data', 'recommendations.json');
    try {
      const raw = await fs.readFile(defaultFile, 'utf-8');
      return NextResponse.json(JSON.parse(raw));
    } catch {
      return NextResponse.json([]); // No recommendations yet
    }
  }
}
