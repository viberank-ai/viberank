import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const dir = path.join(process.cwd(), 'data', 'jsonld');
  async function read(name: string) {
    try {
      return await fs.readFile(path.join(dir, name), 'utf-8');
    } catch {
      return null;
    }
  }
  const org = await read('organization.jsonld');
  const prods = await read('products.jsonld');
  const faq = await read('faq.jsonld');

  return NextResponse.json({
    organization: org ? JSON.parse(org) : null,
    products: prods ? JSON.parse(prods) : null,
    faq: faq ? JSON.parse(faq) : null,
  });
}
