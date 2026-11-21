// 运行时上传的图片由这个路由来发。
// 原因：Next 的 public 目录在构建时就被编进静态清单，运行期新写进去的文件不会自动可访问。
// 只允许「年月目录 + 十六进制文件名 + 白名单后缀」，杜绝路径穿越。

import { NextRequest } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NAME_RE = /^\d{6}\/[a-f0-9]{16,40}\.(webp|jpg|jpeg|png|gif|avif)$/;
const TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  avif: 'image/avif',
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const rel = parts.join('/');
  if (!NAME_RE.test(rel)) return new Response('not found', { status: 404 });

  const file = path.join(process.cwd(), 'public', 'uploads', rel);
  try {
    const buf = await fs.readFile(file);
    const ext = rel.split('.').pop()!;
    return new Response(new Uint8Array(buf), {
      headers: {
        'content-type': TYPES[ext] ?? 'application/octet-stream',
        // 文件名是随机哈希，内容永不变化，可以长缓存
        'cache-control': 'public, max-age=31536000, immutable',
        'content-length': String(buf.length),
      },
    });
  } catch {
    return new Response('not found', { status: 404 });
  }
}
