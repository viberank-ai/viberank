import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  
  if (!projectId) {
    return NextResponse.json({ error: 'No project ID provided' }, { status: 400 });
  }

  const file = path.join(process.cwd(), 'data', `actions-${projectId}.state.json`);
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({}); // empty map
  }
}

export async function POST(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  
  if (!projectId) {
    return NextResponse.json({ error: 'No project ID provided' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const file = path.join(process.cwd(), 'data', `actions-${projectId}.state.json`);
  
  // Expect shape: { [actionId]: { status: 'Backlog'|'Doing'|'Done', note?: string } }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(body, null, 2));
  return NextResponse.json({ ok: true });
}
