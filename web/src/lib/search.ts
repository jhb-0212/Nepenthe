// 搜索：Meilisearch 为主，PostgreSQL 兜底
// 有 MEILI_HOST 就建索引走 Meili（中文分词 + 即时联想 + 高亮），
// 没配则退回 Postgres 的 ILIKE，保证空环境也能跑起来。

import { MeiliSearch, type Index } from 'meilisearch';
import { prisma } from './prisma';
import { stripMarkdown } from './markdown';

const INDEX = 'nepenthe';
const configured = () => Boolean(process.env.MEILI_HOST);

let client: MeiliSearch | null = null;
function meili() {
  if (!configured()) return null;
  if (!client) {
    client = new MeiliSearch({
      host: process.env.MEILI_HOST!,
      apiKey: process.env.MEILI_KEY || undefined,
    });
  }
  return client;
}

export type SearchHit = {
  kind: 'post' | 'note' | 'novel' | 'chapter';
  title: string;
  href: string;
  snippet: string;
  date: string;
  tag?: string;
};

type Doc = SearchHit & { id: string; body: string };

export async function buildDocs(): Promise<Doc[]> {
  const [posts, notes, novels, chapters] = await Promise.all([
    prisma.post.findMany({ where: { draft: false }, orderBy: { date: 'desc' } }),
    prisma.note.findMany({ where: { draft: false }, orderBy: { date: 'desc' } }),
    prisma.novel.findMany({ where: { draft: false }, include: { chapters: true } }),
    prisma.chapter.findMany({ where: { draft: false }, include: { novel: true } }),
  ]);

  const docs: Doc[] = [];
  for (const p of posts) {
    docs.push({
      id: `post-${p.id}`,
      kind: 'post',
      title: p.title,
      href: `/writing/${p.slug}`,
      snippet: p.summary || stripMarkdown(p.body),
      date: p.date.toISOString().slice(0, 10),
      tag: p.tag,
      body: p.body,
    });
  }
  for (const n of notes) {
    docs.push({
      id: `note-${n.id}`,
      kind: 'note',
      title: stripMarkdown(n.body, 36),
      href: '/notes',
      snippet: stripMarkdown(n.body, 120),
      date: n.date.toISOString().slice(0, 10),
      tag: n.tag ?? undefined,
      body: n.body,
    });
  }
  for (const v of novels) {
    docs.push({
      id: `novel-${v.id}`,
      kind: 'novel',
      title: v.title,
      href: `/novels/${v.slug}`,
      snippet: v.summary || stripMarkdown(v.body),
      date: v.updated.toISOString().slice(0, 10),
      tag: v.tags?.[0],
      body: v.body,
    });
  }
  for (const c of chapters) {
    docs.push({
      id: `chapter-${c.id}`,
      kind: 'chapter',
      title: `${c.novel.title} · ${c.title}`,
      href: `/novels/${c.novel.slug}/${c.slug}`,
      snippet: stripMarkdown(c.body),
      date: c.date.toISOString().slice(0, 10),
      body: c.body,
    });
  }
  return docs;
}

async function ensureIndex(): Promise<Index | null> {
  const m = meili();
  if (!m) return null;
  const idx = m.index(INDEX);
  try {
    await m.createIndex(INDEX, { primaryKey: 'id' });
  } catch {
    /* 已存在 */
  }
  await idx.updateSettings({
    searchableAttributes: ['title', 'snippet', 'tag', 'body'],
    displayedAttributes: ['id', 'kind', 'title', 'href', 'snippet', 'date', 'tag'],
    filterableAttributes: ['kind'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    // 中文（cmn）走专用分词，避免整段被当成一个词
    localizedAttributes: [{ attributePatterns: ['title', 'snippet', 'body'], locales: ['cmn', 'eng'] }],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 } },
  });
  return idx;
}

export async function reindexAll() {
  const docs = await buildDocs();
  const idx = await ensureIndex();
  if (!idx) return { ok: false, reason: '未配置 MEILI_HOST，搜索走 Postgres 兜底', count: docs.length };

  await idx.deleteAllDocuments().catch(() => undefined);
  await idx.addDocuments(docs);
  await idx.updateSearchableAttributes(['title', 'snippet', 'tag', 'body']);
  return { ok: true, count: docs.length };
}

export async function search(q: string, limit = 20): Promise<{ source: 'meili' | 'pg'; hits: SearchHit[] }> {
  const query = (q || '').trim();
  if (!query) return { source: configured() ? 'meili' : 'pg', hits: [] };

  if (configured()) {
    try {
      const idx = await ensureIndex();
      if (idx) {
        const res = await idx.search(query, { limit, attributesToHighlight: ['title', 'snippet'] });
        return {
          source: 'meili',
          hits: res.hits.map((h) => {
            const hit = h as unknown as Doc & { _formatted?: { title?: string; snippet?: string } };
            return {
              kind: hit.kind,
              title: hit._formatted?.title ?? hit.title,
              href: hit.href,
              snippet: hit._formatted?.snippet ?? hit.snippet,
              date: hit.date,
              tag: hit.tag,
            };
          }),
        };
      }
    } catch {
      /* 落到 pg */
    }
  }

  const contains = { contains: query, mode: 'insensitive' as const };
  const docs = await buildDocs();
  const lower = query.toLowerCase();
  const hits = docs
    .filter((d) => `${d.title} ${d.snippet} ${d.body}`.toLowerCase().includes(lower))
    .slice(0, limit)
    .map(({ body, id, ...rest }) => rest);
  return { source: 'pg', hits };
}
