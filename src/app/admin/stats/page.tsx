import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const metadata = { title: '访问统计' };

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export default async function AdminStatsPage() {
  await guard();

  const today = new Date();
  const days = 14;
  const from = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  from.setUTCHours(0, 0, 0, 0);

  const [byDay, byPath, byUa, byRef, total, last] = await Promise.all([
    prisma.visit.groupBy({ by: ['day'], where: { day: { gte: from } }, _count: { _all: true }, orderBy: { day: 'asc' } }),
    prisma.visit.groupBy({ by: ['path'], where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } }, _count: { _all: true }, orderBy: { _count: { path: 'desc' } }, take: 12 }),
    prisma.visit.groupBy({ by: ['ua'], where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } }, _count: { _all: true }, orderBy: { _count: { ua: 'desc' } }, take: 6 }),
    prisma.visit.groupBy({ by: ['ref'], where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) }, ref: { not: '' } }, _count: { _all: true }, orderBy: { _count: { ref: 'desc' } }, take: 8 }),
    prisma.visit.count(),
    prisma.visit.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ]);

  // 补齐没有访问的日期，柱状图才连续
  const series: { day: string; n: number }[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from.getTime() + i * 864e5);
    series.push({ day: dayKey(d), n: 0 });
  }
  for (const row of byDay) {
    const key = dayKey(row.day);
    const slot = series.find((s) => s.day === key);
    if (slot) slot.n = row._count._all;
  }

  const max = Math.max(1, ...series.map((s) => s.n));
  const weekTotal = series.slice(-7).reduce((s, x) => s + x.n, 0);
  const pathMax = Math.max(1, ...byPath.map((p) => p._count._all));

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>访问统计</h1>
          <small>
            累计 {total} 次 · 最近 7 天 {weekTotal} 次
            {last ? ` · 最后一次 ${last.createdAt.toISOString().slice(0, 16).replace('T', ' ')}` : ''}
          </small>
        </div>
        <div className="admin-actions">
          </div>
      </div>

      <p style={{ color: 'var(--faint)', fontSize: 12.5, marginTop: 14 }}>
        只统计前台页面（过滤 bot、后台、静态资源）。访客以「IP + UA + 当日盐」的哈希去重，原始 IP 不入库，跨天不可关联。
      </p>

      <section className="version-box">
        <h2>
          近 14 天 <small>每日页面访问</small>
        </h2>
        {series.some((s) => s.n > 0) ? (
          <div className="stats-bars">
            {series.map((s) => (
              <div className="stats-bar" key={s.day} title={`${s.day} · ${s.n}`}>
                <span className="stats-bar-n">{s.n || ''}</span>
                <div className="stats-bar-col" style={{ height: `${Math.round((s.n / max) * 100)}%` }} />
                <span className="stats-bar-day">{s.day.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--faint)', fontSize: 13, padding: '18px 0' }}>
            近 14 天还没有访问记录。前台打开几次（要不要被当作 bot 过滤掉），这里就会长出柱子。
          </p>
        )}
      </section>

      <section className="version-box">
        <h2>
          热门页面 <small>近 7 天</small>
        </h2>
        <ul className="stats-list">
          {byPath.map((p) => (
            <li key={p.path}>
              <span className="stats-path">{p.path}</span>
              <span className="stats-track">
                <i style={{ width: `${Math.round((p._count._all / pathMax) * 100)}%` }} />
              </span>
              <em>{p._count._all}</em>
            </li>
          ))}
        </ul>
        {byPath.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>近 7 天还没有访问记录。</p> : null}
      </section>

      <section className="version-box">
        <h2>
          浏览器与来源 <small>近 7 天</small>
        </h2>
        <div className="stats-cols">
          <div>
            <h3>浏览器</h3>
            <ul className="stats-pairs">
              {byUa.map((u) => (
                <li key={u.ua || 'unknown'}>
                  <span>{u.ua || '未知'}</span>
                  <em>{u._count._all}</em>
                </li>
              ))}
              {byUa.length === 0 ? <li><span>暂无</span></li> : null}
            </ul>
          </div>
          <div>
            <h3>来源站点</h3>
            <ul className="stats-pairs">
              {byRef.map((r) => (
                <li key={r.ref}>
                  <span>{r.ref}</span>
                  <em>{r._count._all}</em>
                </li>
              ))}
              {byRef.length === 0 ? <li><span>暂无外链来源</span></li> : null}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
