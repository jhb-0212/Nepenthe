import Link from 'next/link';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const metadata = { title: '访问统计' };

const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const UA_CN: Record<string, string> = {
  Edge: 'Edge 浏览器',
  Chrome: 'Chrome 浏览器',
  Safari: 'Safari 浏览器',
  Firefox: 'Firefox 浏览器',
  Opera: 'Opera 浏览器',
  MobileSafari: 'Safari 浏览器',
  WeChat: '微信内置浏览器',
};
const uaName = (u: string) => (u ? UA_CN[u] ?? `${u} 浏览器` : '未知');

function fmtTime(d: Date) {
  return d.toISOString().slice(5, 16).replace('T', ' ');
}

export default async function AdminStatsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  await guard();

  const sp = await searchParams;
  const range: Range = (RANGES.find((r) => String(r) === sp.d) ?? 14) as Range;

  const now = Date.now();
  const from = new Date(now - (range - 1) * 864e5);
  from.setUTCHours(0, 0, 0, 0);
  const todayKey = dayKey(new Date(now));

  const [byDay, rangeVisits, byPath, byUa, byRef, total, recent] = await Promise.all([
    prisma.visit.groupBy({
      by: ['day'],
      where: { day: { gte: from } },
      _count: { _all: true },
      orderBy: { day: 'asc' },
    }),
    prisma.visit.findMany({
      where: { day: { gte: from } },
      select: { day: true, visitor: true },
    }),
    prisma.visit.groupBy({
      by: ['path'],
      where: { day: { gte: from } },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: 8,
    }),
    prisma.visit.groupBy({
      by: ['ua'],
      where: { day: { gte: from } },
      _count: { _all: true },
      orderBy: { _count: { ua: 'desc' } },
      take: 4,
    }),
    prisma.visit.groupBy({
      by: ['ref'],
      where: { day: { gte: from }, ref: { not: '' } },
      _count: { _all: true },
      orderBy: { _count: { ref: 'desc' } },
      take: 6,
    }),
    prisma.visit.count(),
    prisma.visit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, path: true, ref: true, ua: true, createdAt: true },
    }),
  ]);

  // 补齐空日期，柱状图才连续
  const series: { day: string; n: number; uniq: number; weekday: string }[] = [];
  const uniqByDay = new Map<string, Set<string>>();
  for (const v of rangeVisits) {
    const k = dayKey(v.day);
    if (!uniqByDay.has(k)) uniqByDay.set(k, new Set());
    uniqByDay.get(k)!.add(v.visitor);
  }
  for (let i = 0; i < range; i += 1) {
    const d = new Date(from.getTime() + i * 864e5);
    const k = dayKey(d);
    series.push({ day: k, n: 0, uniq: uniqByDay.get(k)?.size ?? 0, weekday: WEEK[d.getUTCDay()] });
  }
  for (const row of byDay) {
    const slot = series.find((s) => s.day === dayKey(row.day));
    if (slot) slot.n = row._count._all;
  }

  const max = Math.max(1, ...series.map((s) => s.n));
  const rangeTotal = series.reduce((s, x) => s + x.n, 0);
  const todayViews = series.find((s) => s.day === todayKey)?.n ?? 0;
  const uniqueVisitors = new Set(rangeVisits.map((v) => v.visitor)).size;
  const peak = series.reduce((a, b) => (b.n > a.n ? b : a), series[0]);
  const pathMax = Math.max(1, ...byPath.map((p) => p._count._all));
  const uaMax = Math.max(1, ...byUa.map((u) => u._count._all));
  const refMax = Math.max(1, ...byRef.map((r) => r._count._all));
  const activeDays = series.filter((s) => s.n > 0).length;

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>访问统计</h1>
          <small>
            累计 {total} 次 · 有记录 {activeDays} 天 · 最后一次{' '}
            {recent[0] ? fmtTime(recent[0].createdAt) : '暂无'}
          </small>
        </div>
        <div className="admin-actions">
          <div className="st-tabs" role="tablist" aria-label="统计区间">
            {RANGES.map((r) => (
              <Link key={r} href={`/admin/stats?d=${r}`} className={r === range ? 'is-active' : ''}>
                近 {r} 天
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="st-kpis">
        <div className="st-kpi">
          <span>今日访问</span>
          <b>{todayViews}</b>
        </div>
        <div className="st-kpi">
          <span>近 {range} 天</span>
          <b>{rangeTotal}</b>
        </div>
        <div className="st-kpi">
          <span>独立访客</span>
          <b>{uniqueVisitors}</b>
          <i>按「IP + 浏览器 + 当日盐」去重</i>
        </div>
        <div className="st-kpi">
          <span>单日峰值</span>
          <b>{peak.n}</b>
          <i>{peak.n > 0 ? peak.day.slice(5) : '暂无数据'}</i>
        </div>
      </div>

      {/* 柱图 */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2>每日访问</h2>
          <span>近 {range} 天 · 平均 {(rangeTotal / range).toFixed(1)} 次/天</span>
        </div>

        {rangeTotal > 0 ? (
          <div className={range > 14 ? 'st-chart is-dense' : 'st-chart'}>
            <div className="st-grid" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            {series.map((s, i) => (
              <div className="st-col" key={s.day} title={`${s.day} ${s.weekday} · ${s.n} 次 / ${s.uniq} 人`}>
                <span className="st-col-n">{s.n || ''}</span>
                <div className="st-col-track">
                  <div className="st-col-bar" style={{ height: `${Math.max(s.n ? 4 : 0, Math.round((s.n / max) * 100))}%` }} />
                </div>
                {range <= 14 || i % 5 === 0 || i === series.length - 1 ? (
                  <span className="st-col-day">{s.day.slice(5)}</span>
                ) : (
                  <span className="st-col-day" aria-hidden="true" />
                )}
                {range <= 14 ? <span className="st-col-wd">{s.weekday}</span> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="st-empty">
            这段时间还没有访问记录。前台打开几次（bot 会被过滤），这里就会长出柱子。
          </p>
        )}
      </section>

      {/* 热门页面 + 浏览器 */}
      <div className="st-split">
        <section className="st-panel">
          <div className="st-panel-head">
            <h2>热门页面</h2>
            <span>近 {range} 天</span>
          </div>
          {byPath.length ? (
            <ul className="st-rows">
              {byPath.map((p) => (
                <li key={p.path}>
                  <span className="st-row-name">{p.path}</span>
                  <span className="st-row-track">
                    <i style={{ width: `${Math.round((p._count._all / pathMax) * 100)}%` }} />
                  </span>
                  <em>{p._count._all}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-empty">暂无页面访问。</p>
          )}
        </section>

        <section className="st-panel">
          <div className="st-panel-head">
            <h2>浏览器</h2>
            <span>近 {range} 天</span>
          </div>
          {byUa.length ? (
            <ul className="st-rows">
              {byUa.map((u) => (
                <li key={u.ua || 'unknown'}>
                  <span className="st-row-name">{uaName(u.ua)}</span>
                  <span className="st-row-track">
                    <i style={{ width: `${Math.round((u._count._all / uaMax) * 100)}%` }} />
                  </span>
                  <em>{u._count._all}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-empty">暂无数据。</p>
          )}
        </section>
      </div>

      {/* 来源 */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2>来源站点</h2>
          <span>只有带来源页的外链才会记在这里</span>
        </div>
        {byRef.length ? (
          <ul className="st-rows">
            {byRef.map((r) => (
              <li key={r.ref}>
                <span className="st-row-name">{r.ref}</span>
                <span className="st-row-track">
                  <i style={{ width: `${Math.round((r._count._all / refMax) * 100)}%` }} />
                </span>
                <em>{r._count._all}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="st-empty">这一段时间没有外链来源。</p>
        )}
      </section>

      {/* 最近访问 */}
      <section className="st-panel">
        <div className="st-panel-head">
          <h2>最近访问</h2>
          <span>最新 10 条，不含 IP 地址</span>
        </div>
        {recent.length ? (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>页面</th>
                  <th>浏览器</th>
                  <th>来源</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((v) => (
                  <tr key={String(v.id)}>
                    <td className="mono">{fmtTime(v.createdAt)}</td>
                    <td className="mono">{v.path}</td>
                    <td>{uaName(v.ua)}</td>
                    <td>{v.ref || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="st-empty">还没有访问记录。</p>
        )}
      </section>

      <p className="st-note">
        只统计前台页面（已过滤爬虫、后台与静态资源）。访客按「IP + 浏览器 + 当日盐」的哈希去重，原始 IP 不入库，跨天不可关联。
      </p>
    </div>
  );
}
