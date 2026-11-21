import Link from 'next/link';
import { guard } from '@/lib/admin';
import { getDashboard } from '@/lib/content';
import { prisma } from '@/lib/prisma';
import PublishButton from '@/components/PublishButton';

export const metadata = { title: '后台' };

export default async function AdminPage() {
  const session = await guard();
  const [stats, recent, jobs, wallPending] = await Promise.all([
    getDashboard(),
    prisma.post.findMany({ orderBy: { updatedAt: 'desc' }, take: 6 }),
    prisma.publishJob.findMany({ orderBy: { startedAt: 'desc' }, take: 3 }),
    prisma.message.count({ where: { approved: false, hidden: false } }),
  ]);

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>控制台</h1>
          <small>
            已登录：{session.name} · Prisma + PostgreSQL 实时读写
          </small>
        </div>
        <div className="admin-actions">
          <PublishButton />
          <Link className="admin-btn primary" href="/admin/posts/new">
            写一篇
          </Link>
        </div>
      </div>

      <div className="admin-grid">
        {[
          ['文章', stats.posts],
          ['随记', stats.notes],
          ['小说', stats.novels],
          ['照片', stats.photos],
          ['曲目', stats.tracks],
          ['访问', stats.visits],
          ['留言待审', wallPending],
        ].map(([label, n]) => (
          <div className="admin-stat" key={String(label)}>
            <b>{n}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {wallPending ? (
        <div className="adm-todo">
          <span>有 {wallPending} 条留言等你过目。</span>
          <Link className="admin-btn" href="/admin/wall">
            去审核
          </Link>
        </div>
      ) : null}

      <h2 className="adm-h2">最近更新</h2>
      <ul className="admin-list">
        {recent.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/posts/${p.id}`}>
              <span>
                {p.title} {p.draft ? <em>（草稿）</em> : null}
              </span>
              <em>{p.updatedAt.toISOString().slice(0, 10)}</em>
            </Link>
          </li>
        ))}
        {recent.length === 0 ? <li style={{ color: 'var(--faint)', fontSize: 13 }}>还没有文章。</li> : null}
      </ul>

      {jobs.length ? (
        <>
          <h2 className="adm-h2">发布记录</h2>
          <ul className="admin-list">
            {jobs.map((j) => (
              <li key={j.id}>
                <span>
                  #{j.id} {j.status} · {j.step}
                  {j.log ? <em> · {j.log}</em> : null}
                </span>
                <em>{j.startedAt.toISOString().slice(0, 19).replace('T', ' ')}</em>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
