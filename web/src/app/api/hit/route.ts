// 访问埋点：text/plain 的 JSON 走 sendBeacon，不触发跨域预检
// 口径：bot 丢、后台路径丢、非本站来源丢、同 IP 每分钟 > 120 条丢

import { NextRequest } from 'next/server';
import { assertSameOrigin, clientIp } from '@/lib/auth';
import { recordHit } from '@/lib/visit';

const RATE = 120;
const hits = new Map<string, number[]>();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sameOrigin = await assertSameOrigin();
  if (!sameOrigin) return new Response(null, { status: 403 });

  const ip = await clientIp();
  const now = Date.now();
  const bucket = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (bucket.length >= RATE) {
    hits.set(ip, bucket);
    return new Response(null, { status: 429 });
  }
  bucket.push(now);
  hits.set(ip, bucket);

  let body: { path?: string; ref?: string } = {};
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 204 });
  }

  try {
    await recordHit({
      path: String(body.path ?? ''),
      ref: String(body.ref ?? ''),
      ua: req.headers.get('user-agent') ?? '',
      ip,
    });
  } catch {
    /* 统计失败不影响页面 */
  }
  return new Response(null, { status: 204 });
}
