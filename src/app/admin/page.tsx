import Link from 'next/link';
import { guard } from '@/lib/admin';
import { logoutAction } from '@/actions/auth';
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
          <h1>忘忧居 · 后台</h1>
          <small>
            已登录：{session.name} · Prisma + PostgreSQL 实时读写
          </small>
        </div>
        <div className="admin-actions">
          <PublishButton />
          <Link className="admin-btn" href="/">
            看站点
          </Link>
          <form action={logoutAction}>
            <button className="admin-btn" type="submit">
              退出
            </button>
          </form>
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

      <div className="admin-actions" style={{ marginBottom: 18 }}>
        <Link className="admin-btn primary" href="/admin/posts/new">
          写一篇
        </Link>
        <Link className="admin-btn" href="/admin/posts">
          文章
        </Link>
        <Link className="admin-btn" href="/admin/notes">
          随记
        </Link>
        <Link className="admin-btn" href="/admin/novels">
          小说
        </Link>
        <Link className="admin-btn" href="/admin/gallery">
          相册
        </Link>
        <Link className="admin-btn" href="/admin/music">
          曲目
        </Link>
        <Link className="admin-btn" href="/admin/site">
          站点设置
        </Link>
        <Link className="admin-btn" href="/admin/about">
          关于页
        </Link>
        <Link className="admin-btn" href="/admin/pages">
          页面文案
        </Link>
        <Link className="admin-btn" href="/admin/stats">
          访问统计
        </Link>
        <Link className="admin-btn" href="/admin/wall">
          留言审核{wallPending ? `（${wallPending}）` : ''}
        </Link>
        <a className="admin-btn" href="/api/admin/export" download>
          导出 JSON
        </a>
        <a className="admin-btn" href="/api/admin/export/md" download>
          导出 Markdown
        </a>
      </div>

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>最近更新</h2>
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
          <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>发布记录</h2>
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
