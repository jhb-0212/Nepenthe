import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  return Response.json(
    { ok: db, db, ms: Date.now() - started, at: new Date().toISOString() },
    { status: db ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
