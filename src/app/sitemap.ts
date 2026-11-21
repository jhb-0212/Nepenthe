import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { siteUrl } from '@/lib/site';

// 内容随时会变，sitemap 不能按构建时的快照走
export const dynamic = 'force-dynamic';

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/writing', priority: 0.9 },
  { path: '/notes', priority: 0.8 },
  { path: '/novels', priority: 0.8 },
  { path: '/gallery', priority: 0.6 },
  { path: '/music', priority: 0.6 },
  { path: '/doing', priority: 0.6 },
  { path: '/wall', priority: 0.5 },
  { path: '/archive', priority: 0.5 },
  { path: '/about', priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${base}${p.path === '/' ? '/' : p.path}`,
    changeFrequency: 'weekly',
    priority: p.priority,
  }));

  try {
    const [posts, notes, novels, chapters] = await Promise.all([
      prisma.post.findMany({ where: { draft: false }, select: { slug: true, updatedAt: true } }),
      prisma.note.findMany({ where: { draft: false }, select: { updatedAt: true } }),
      prisma.novel.findMany({ where: { draft: false }, select: { slug: true, updated: true } }),
      prisma.chapter.findMany({
        where: { draft: false },
        select: { slug: true, updatedAt: true, novel: { select: { slug: true, draft: true } } },
      }),
    ]);

    for (const p of posts) {
      entries.push({ url: `${base}/writing/${p.slug}`, lastModified: p.updatedAt, priority: 0.9 });
    }
    // 随记没有独立页，锚点不算独立 URL，只取最新的时间给 /notes
    const noteUpdated = notes.reduce<Date | null>((acc, n) => (acc && acc > n.updatedAt ? acc : n.updatedAt), null);
    if (noteUpdated) {
      const idx = entries.findIndex((e) => e.url === `${base}/notes`);
      if (idx >= 0) entries[idx].lastModified = noteUpdated;
    }
    for (const n of novels) {
      entries.push({ url: `${base}/novels/${n.slug}`, lastModified: n.updated, priority: 0.7 });
    }
    for (const c of chapters) {
      if (c.novel.draft) continue;
      entries.push({ url: `${base}/novels/${c.novel.slug}/${c.slug}`, lastModified: c.updatedAt, priority: 0.6 });
    }
  } catch {
    // 数据库暂时不可用也要能出 sitemap，至少静态页不丢
  }

  return entries;
}
