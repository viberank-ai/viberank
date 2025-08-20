import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const file = path.join(process.cwd(), 'data', 'actions.state.json');

export async function GET() {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({}); // empty map
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Expect shape: { [actionId]: { status: 'Backlog'|'Doing'|'Done', note?: string } }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(body, null, 2));
  return NextResponse.json({ ok: true });
}
