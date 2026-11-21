// 备份导出：所有内容一次性导成 JSON，内容只在库里，至少留一条出口。
// 管理员 Cookie 鉴权，不认 query 参数。

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: '未登录' }, { status: 401 });

  const [posts, notes, novels, chapters, albums, photos, tracks, doing, site, messages] = await Promise.all([
    prisma.post.findMany({ orderBy: { date: 'asc' } }),
    prisma.note.findMany({ orderBy: { date: 'asc' } }),
    prisma.novel.findMany({ orderBy: { updated: 'asc' } }),
    prisma.chapter.findMany({ orderBy: [{ novelId: 'asc' }, { order: 'asc' }] }),
    prisma.album.findMany({ orderBy: { sort: 'asc' } }),
    prisma.photo.findMany({ orderBy: [{ albumId: 'asc' }, { sort: 'asc' }] }),
    prisma.track.findMany({ orderBy: { sort: 'asc' } }),
    prisma.doing.findMany({ orderBy: { sort: 'asc' } }),
    prisma.siteSetting.findUnique({ where: { key: 'site' } }),
    prisma.message.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    schema: 1,
    counts: {
      posts: posts.length,
      notes: notes.length,
      novels: novels.length,
      chapters: chapters.length,
      albums: albums.length,
      photos: photos.length,
      tracks: tracks.length,
      doing: doing.length,
      messages: messages.length,
    },
    posts,
    notes,
    novels,
    chapters,
    albums,
    photos,
    tracks,
    doing,
    site: site?.value ?? null,
    messages,
  };

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="nepenthe-backup-${stamp}.json"`,
      'cache-control': 'no-store',
    },
  });
}
