import Link from 'next/link';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const metadata = { title: '文章管理' };

export default async function AdminPostsPage() {
  await guard();
  const posts = await prisma.post.findMany({ orderBy: [{ date: 'desc' }, { id: 'desc' }] });

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>文章</h1>
          <small>{posts.length} 篇 · 草稿不对外展示</small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn primary" href="/admin/posts/new">
            写一篇
          </Link>
          </div>
      </div>

      <ul className="admin-list">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/posts/${p.id}`}>
              <span>
                {p.title}
                {p.draft ? <em>（草稿）</em> : null}
                <em> · /writing/{p.slug}</em>
              </span>
              <em>{p.date.toISOString().slice(0, 10)}</em>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
