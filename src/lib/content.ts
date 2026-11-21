// 前台读数据的唯一入口。页面只调用这里的函数，不直接碰 prisma。
// 所有列表按日期倒序、草稿过滤，和旧站点的口径保持一致。

import { prisma } from './prisma';

export const fmtDate = (d: Date) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
};

export const fmtDateCN = (d: Date) => `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;

export const listPosts = (take?: number) =>
  prisma.post.findMany({
    where: { draft: false },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    ...(take ? { take } : {}),
  });

export const getPost = (slug: string) =>
  prisma.post.findFirst({ where: { slug, draft: false } });

export async function getPostWithNeighbors(slug: string) {
  const post = await getPost(slug);
  if (!post) return null;
  const all = await listPosts();
  const i = all.findIndex((p) => p.slug === slug);
  return {
    post,
    newer: i > 0 ? all[i - 1] : null,
    older: i >= 0 && i < all.length - 1 ? all[i + 1] : null,
  };
}

export const listNotes = (take?: number) =>
  prisma.note.findMany({
    where: { draft: false },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    ...(take ? { take } : {}),
  });

export const listNovels = () =>
  prisma.novel.findMany({
    where: { draft: false },
    orderBy: [{ updated: 'desc' }, { id: 'desc' }],
    include: { _count: { select: { chapters: { where: { draft: false } } } } },
  });

export const getNovel = (slug: string) =>
  prisma.novel.findFirst({
    where: { slug, draft: false },
    include: {
      chapters: { where: { draft: false }, orderBy: [{ order: 'asc' }, { date: 'asc' }] },
    },
  });

export async function getChapter(work: string, chapterSlug: string) {
  const novel = await getNovel(work);
  if (!novel) return null;
  const index = novel.chapters.findIndex((c) => c.slug === chapterSlug);
  if (index < 0) return null;
  return {
    novel,
    chapter: novel.chapters[index],
    prev: index > 0 ? novel.chapters[index - 1] : null,
    next: index < novel.chapters.length - 1 ? novel.chapters[index + 1] : null,
  };
}

export const listAlbums = () =>
  prisma.album.findMany({
    orderBy: { sort: 'asc' },
    include: { photos: { orderBy: [{ sort: 'asc' }, { date: 'desc' }] } },
  });

export const countPhotos = () => prisma.photo.count();

export const listTracks = () => prisma.track.findMany({ orderBy: { sort: 'asc' } });

export const listDoings = () => prisma.doing.findMany({ orderBy: { sort: 'asc' } });

/** 归档用：文章 + 随记 + 小说章节，按年月分组 */
export async function getArchive() {
  const [posts, notes, chapters] = await Promise.all([
    listPosts(),
    listNotes(),
    prisma.chapter.findMany({
      where: { draft: false },
      include: { novel: true },
      orderBy: [{ date: 'desc' }],
    }),
  ]);

  const rows = [
    ...posts.map((p) => ({
      kind: '文章' as const,
      date: p.date,
      title: p.title,
      href: `/writing/${p.slug}`,
      meta: p.tag,
    })),
    ...notes.map((n) => ({
      kind: '随记' as const,
      date: n.date,
      title: (n.body || '').replace(/[#>*`\n]/g, ' ').slice(0, 60),
      href: `/notes#note-${n.id}`,
      meta: n.tag ?? '',
    })),
    ...chapters.map((c) => ({
      kind: '章节' as const,
      date: c.date,
      title: `${c.novel.title} · ${c.title}`,
      href: `/novels/${c.novel.slug}/${c.slug}`,
      meta: `第 ${c.order} 章`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const groups: { year: number; items: typeof rows }[] = [];
  for (const row of rows) {
    const y = row.date.getUTCFullYear();
    const last = groups[groups.length - 1];
    if (last && last.year === y) last.items.push(row);
    else groups.push({ year: y, items: [row] });
  }
  return groups;
}

/** 首页统计：三个数字 + 最新几篇 */
export async function getHomeData() {
  const [posts, notes, photos] = await Promise.all([
    listPosts(),
    listNotes(),
    countPhotos(),
  ]);
  return {
    posts,
    notes,
    photos,
    newest: posts.slice(0, 3),
    latestNotes: notes.slice(0, 3),
  };
}

/** 后台仪表盘用的计数 */
export async function getDashboard() {
  const [posts, notes, novels, photos, tracks, visits, drafts] = await Promise.all([
    prisma.post.count(),
    prisma.note.count(),
    prisma.novel.count(),
    prisma.photo.count(),
    prisma.track.count(),
    prisma.visit.count(),
    prisma.post.count({ where: { draft: true } }),
  ]);
  return { posts, notes, novels, photos, tracks, visits, drafts };
}
