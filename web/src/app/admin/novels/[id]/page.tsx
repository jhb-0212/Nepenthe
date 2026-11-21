import Link from 'next/link';
import { notFound } from 'next/navigation';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { fmtDate } from '@/lib/content';
import NovelEditor from '@/components/NovelEditor';
import { deleteChapter } from '@/actions/novels';

export const metadata = { title: '编辑作品' };

type Props = { params: Promise<{ id: string }> };

export default async function EditNovelPage({ params }: Props) {
  await guard();
  const { id } = await params;

  if (id === 'new') {
    return (
      <div className="admin-shell">
        <div className="admin-top">
          <h1>新作品</h1>
          <small>保存之后才能加章节</small>
        </div>
        <NovelEditor novel={null} />
      </div>
    );
  }

  const novel = await prisma.novel.findUnique({
    where: { id: Number(id) },
    include: { chapters: { orderBy: [{ order: 'asc' }, { date: 'asc' }] } },
  });
  if (!novel) notFound();

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <h1>编辑作品</h1>
        <small>{novel.slug}</small>
      </div>

      <NovelEditor
        novel={{
          id: novel.id,
          slug: novel.slug,
          title: novel.title,
          subtitle: novel.subtitle,
          summary: novel.summary,
          status: novel.status,
          tags: novel.tags,
          body: novel.body,
          updated: novel.updated.toISOString().slice(0, 10),
          draft: novel.draft,
        }}
      />

      <section className="version-box">
        <h2>
          章节 <small>{novel.chapters.length} 章</small>
        </h2>
        <p className="version-hint">章节顺序按「序号」排，序号相同的按日期。</p>
        <div className="admin-actions" style={{ marginBottom: 14 }}>
          <Link className="admin-btn primary" href={`/admin/novels/${novel.id}/chapters/new`}>
            加一章
          </Link>
        </div>
        <ul className="admin-list">
          {novel.chapters.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/novels/${novel.id}/chapters/${c.id}`}>
                <span>
                  第 {c.order} 章 · {c.title}
                  {c.draft ? <em>（草稿）</em> : null}
                </span>
                <em>
                  {c.slug} · {fmtDate(c.date)} · {c.body.length} 字
                </em>
              </Link>
              <form action={deleteChapter} style={{ marginTop: 6 }}>
                <input type="hidden" name="id" value={c.id} />
                <button className="admin-btn danger" type="submit">
                  删除这章
                </button>
              </form>
            </li>
          ))}
        </ul>
        {novel.chapters.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>还没有章节。</p> : null}
      </section>
    </div>
  );
}
