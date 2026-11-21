import Link from 'next/link';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { fmtDate } from '@/lib/content';
import { deleteNovel } from '@/actions/novels';

export const metadata = { title: '作品管理' };

export default async function AdminNovelsPage() {
  await guard();
  const novels = await prisma.novel.findMany({
    orderBy: [{ updated: 'desc' }],
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>小说 / 作品</h1>
          <small>共 {novels.length} 部 · 章节合计 {novels.reduce((s, n) => s + n._count.chapters, 0)} 章</small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn primary" href="/admin/novels/new">
            新建作品
          </Link>
          </div>
      </div>

      <ul className="admin-list">
        {novels.map((n) => (
          <li key={n.id}>
            <Link href={`/admin/novels/${n.id}`}>
              <span>
                {n.title}
                {n.draft ? <em>（草稿）</em> : null}
              </span>
              <em>
                {n.status} · {n._count.chapters} 章 · {fmtDate(n.updated)}
              </em>
            </Link>
            <form action={deleteNovel} style={{ marginTop: 6 }}>
              <input type="hidden" name="id" value={n.id} />
              <button className="admin-btn danger" type="submit">
                删除（含章节）
              </button>
            </form>
          </li>
        ))}
      </ul>
      {novels.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>还没有作品。</p> : null}
    </div>
  );
}
