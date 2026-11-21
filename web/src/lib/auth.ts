// 后台鉴权：bcrypt 口令 + JWT（HttpOnly Cookie）
// 另外两件事一并放在这里：
//   - 登录限流：失败记录落库（login_failures），进程重启后依然生效
//   - CSRF：Server Actions 自带 Origin 校验 + 加密 action id，这里额外提供
//     一个 Origin 白名单函数，给 Route Handler（埋点、上传）用
//
// 注意：Next 16 里 cookies() / headers() 都是异步的，全部 await。

import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const COOKIE_NAME = 'nepenthe_session';
const TTL_SECONDS = 60 * 60 * 12; // 12 小时
const WINDOW_SECONDS = 600; // 10 分钟窗口
const MAX_FAILURES = 6;
const LOCK_SECONDS = 900; // 锁 15 分钟

function secretKey(): Uint8Array {
  const raw = process.env.SECRET_KEY || 'dev-only-insecure-secret-key-change-me';
  // jose 要求 ≥ 32 字节，短了就补到 32
  return new TextEncoder().encode(raw.padEnd(32, '0').slice(0, 64));
}

export async function clientIp(): Promise<string> {
  const trustProxy = process.env.TRUST_PROXY === '1';
  const h = await headers();
  if (trustProxy) {
    const xff = h.get('x-forwarded-for') || '';
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
    const real = h.get('x-real-ip')?.trim();
    if (real) return real;
  }
  return 'local';
}

export async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || '';
  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) return existing;

  if (!password || password === 'nepenthe-admin') {
    // 开发环境允许默认口令，生产环境明确拒绝启动
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_PASSWORD 未设置或仍为默认值，拒绝创建管理员');
    }
  }
  const hash = await bcrypt.hash(password.padEnd(8, 'x').slice(0, 72), 10);
  return prisma.adminUser.create({ data: { username, passwordHash: hash } });
}

export type LoginResult = { ok: true; token: string } | { ok: false; reason: string };

export async function login(username: string, password: string, ip: string): Promise<LoginResult> {
  const now = Date.now() / 1000;
  const rec = await prisma.loginFailure.findUnique({ where: { ip } });
  if (rec && rec.lockUntil > now) {
    return { ok: false, reason: `尝试过于频繁，${Math.ceil((rec.lockUntil - now) / 60)} 分钟后再试` };
  }

  await ensureAdmin();
  const user = await prisma.adminUser.findUnique({ where: { username } });

  // 口令错与用户不存在给同一句，不泄露账号是否存在
  const ok = user
    ? await bcrypt.compare(password.slice(0, 72), user.passwordHash)
    : await bcrypt.compare(password.slice(0, 72), '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');

  if (!ok) {
    const prev = (rec?.failures ?? []).filter((t) => now - t < WINDOW_SECONDS);
    prev.push(now);
    const lockUntil = prev.length >= MAX_FAILURES ? now + LOCK_SECONDS : 0;
    await prisma.loginFailure.upsert({
      where: { ip },
      create: { ip, failures: prev, lockUntil },
      update: { failures: lockUntil ? [] : prev, lockUntil },
    });
    return { ok: false, reason: '账号或口令不对' };
  }

  await prisma.loginFailure.deleteMany({ where: { ip } });

  const token = await new SignJWT({ uid: user!.id, name: user!.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secretKey());

  return { ok: true, token };
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.PUBLIC_SITE_URL || '').startsWith('https://'),
    path: '/',
    maxAge: TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export type Session = { uid: number; name: string } | null;

export async function getSession(): Promise<Session> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { uid: Number(payload.uid), name: String(payload.name) };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

/** Route Handler 用的 Origin 校验：来源必须是自己 */
export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get('origin') || h.get('referer') || '';
  if (!origin) return true; // sendBeacon 在部分浏览器不带 Origin，靠路径与 UA 过滤兜底
  const allowed = new Set<string>();
  const site = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (site) allowed.add(site);
  const host = h.get('host');
  if (host) {
    allowed.add(`http://${host}`);
    allowed.add(`https://${host}`);
  }
  return [...allowed].some((a) => origin.startsWith(a));
}
