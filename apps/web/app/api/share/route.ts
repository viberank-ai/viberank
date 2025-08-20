import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

function getKey() {
  const secret = process.env.SHARE_JWT_SECRET || 'dev-only-insecure-secret';
  return new TextEncoder().encode(secret);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as { days?: number });
  const days = Math.max(1, Math.min(30, Number(body.days ?? 7)));
  const now = Math.floor(Date.now() / 1000);
  const exp = now + days * 24 * 60 * 60;

  const token = await new SignJWT({ t: 'report-ro' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getKey());

  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  return NextResponse.json({ url: `${base}/share/${token}`, expires: exp });
}
