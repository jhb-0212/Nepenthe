// Markdown 备份：把文章 / 随记 / 章节拼成一份可直接存档的 .md
// 用途是「万一哪天不想用这套系统了，内容还能拿走」。

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const d = (x: Date) => x.toISOString().slice(0, 10);

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: '未登录' }, { status: 401 });

  const [posts, notes, novels] = await Promise.all([
    prisma.post.findMany({ orderBy: { date: 'asc' } }),
    prisma.note.findMany({ orderBy: { date: 'asc' } }),
    prisma.novel.findMany({
      orderBy: { updated: 'asc' },
      include: { chapters: { orderBy: [{ order: 'asc' }, { date: 'asc' }] } },
    }),
  ]);

  const out: string[] = ['# 忘忧居 · 内容备份', '', `导出时间：${new Date().toISOString().slice(0, 19).replace('T', ' ')}`, ''];

  out.push('# 文章', '');
  for (const p of posts) {
    out.push(`## ${p.title}`, '', `- slug: \`${p.slug}\``, `- 日期: ${d(p.date)}`, `- 标签: ${p.tag || '—'}`, `- 草稿: ${p.draft ? '是' : '否'}`, '', p.body, '', '---', '');
  }

  out.push('# 随记', '');
  for (const n of notes) {
    out.push(`## ${d(n.date)}${n.tag ? ` · ${n.tag}` : ''}`, '', n.body, '', '---', '');
  }

  out.push('# 小说', '');
  for (const v of novels) {
    out.push(`## ${v.title}${v.subtitle ? ` —— ${v.subtitle}` : ''}`, '', `- slug: \`${v.slug}\``, `- 状态: ${v.status}`, `- 标签: ${v.tags.join('，') || '—'}`, '');
    if (v.summary) out.push(`> ${v.summary}`, '');
    if (v.body) out.push(v.body, '');
    for (const c of v.chapters) {
      out.push(`### 第 ${c.order} 章 · ${c.title}`, '', `- slug: \`${c.slug}\``, `- 日期: ${d(c.date)}`, '', c.body, '');
    }
    out.push('---', '');
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return new Response(out.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition': `attachment; filename="nepenthe-content-${stamp}.md"`,
      'cache-control': 'no-store',
    },
  });
}
