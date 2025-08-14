import { NextResponse } from 'next/server';
import { getJob } from '../../../../lib/jobs';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const job = getJob(params.id);
  if (!job) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json(job);
}
