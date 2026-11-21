import { NextRequest } from 'next/server';
import { search } from '@/lib/search';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 20), 40);
  try {
    const result = await search(q, limit);
    return Response.json(result);
  } catch {
    return Response.json({ source: 'pg', hits: [] }, { status: 200 });
  }
}
