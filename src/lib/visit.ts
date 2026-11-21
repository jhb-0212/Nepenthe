// 访问埋点：站点每次打开打一条，这里只做三件事——过滤、脱敏、入库
// 过滤：bot / 无头 / 后台路径 / 静态资源
// 脱敏：不存 IP，只存 sha256(IP + UA + 当日盐) 前 16 位，盐每天换
// 入库：day + path + ref(主机名) + ua(家族)

import { createHash } from 'node:crypto';
import { prisma } from './prisma';

const BOT = /bot|spider|crawl|scraper|curl|wget|python-requests|headless|monitor|preview|lighthouse/i;
const IGNORE_PREFIX = ['/admin', '/api', '/gallery', '/pagefind', '/_next', '/favicon', '/avatar', '/hero-bg', '/bg-', '/og-image'];

export function isBot(ua: string) {
  return BOT.test(ua || '');
}

export function isIgnoredPath(path: string) {
  return IGNORE_PREFIX.some((p) => path.startsWith(p));
}

export function uaFamily(ua: string) {
  const s = ua.toLowerCase();
  if (s.includes('edg/')) return 'Edge';
  if (s.includes('chrome')) return 'Chrome';
  if (s.includes('safari')) return 'Safari';
  if (s.includes('firefox')) return 'Firefox';
  if (s.includes('micromessenger')) return 'WeChat';
  return 'Other';
}

function dailySalt(day: string) {
  const secret = process.env.SECRET_KEY || 'nepenthe';
  return createHash('sha256').update(`${secret}:${day}`).digest('hex');
}

export function visitorHash(ip: string, ua: string, day: string) {
  return createHash('sha256')
    .update(`${ip}|${ua}|${dailySalt(day)}`)
    .digest('hex')
    .slice(0, 16);
}

export function refHost(referer: string) {
  try {
    return new URL(referer).host.slice(0, 120);
  } catch {
    return '';
  }
}

export function todayKey(d = new Date()) {
  const tz = 8 * 60 * 60 * 1000; // 按北京时间切天
  return new Date(d.getTime() + tz).toISOString().slice(0, 10);
}

export type HitInput = { path: string; ref?: string; ua?: string; ip?: string };

export async function recordHit(input: HitInput) {
  const path = (input.path || '').split('?')[0].slice(0, 200);
  const ua = (input.ua || '').slice(0, 300);
  if (!path.startsWith('/') || isIgnoredPath(path) || isBot(ua)) return false;

  const day = todayKey();
  await prisma.visit.create({
    data: {
      day: new Date(`${day}T00:00:00.000Z`),
      path,
      ref: refHost(input.ref || ''),
      ua: uaFamily(ua),
      visitor: visitorHash(input.ip || 'unknown', ua, day),
    },
  });
  return true;
}

/** 最近 5 分钟有人在看的页面——SSE 推给前台做「最近在读」，只给聚合，不给身份 */
export async function recentReaders(limit = 8) {
  const since = new Date(Date.now() - 5 * 60 * 1000);
  const rows = await prisma.visit.groupBy({
    by: ['path'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { path: 'desc' } },
    take: limit,
  });
  const total = await prisma.visit.count({ where: { createdAt: { gte: since } } });
  return {
    at: Date.now(),
    total,
    paths: rows.map((r) => ({ path: r.path, n: r._count._all })),
  };
}
