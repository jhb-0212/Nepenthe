import Link from 'next/link';
import type { Metadata } from 'next';
import { getArchive, fmtDate } from '@/lib/content';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.archive.title, description: pages.archive.lead };
}

const STEP = 152;
const AMP = 14;
const MID = 50;
const BAND = 230;
const RIPPLE = 54;

export default async function ArchivePage() {
  const [groups, pages] = await Promise.all([getArchive(), getPages()]);
  const items = groups.flatMap((g) => g.items);

  const height = Math.max(items.length * STEP, 1);
  const points = items.map((_, i) => ({ x: MID + (i % 2 === 0 ? -AMP : AMP), y: i * STEP + STEP / 2 }));

  let path = '';
  if (points.length) {
    const first = points[0];
    path = `M ${first.x} 0 L ${first.x} ${first.y}`;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const my = (a.y + b.y) / 2;
      path += ` C ${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
    }
    path += ` L ${points[points.length - 1].x} ${height}`;
  }

  const oldest = items.length ? items[items.length - 1].date : null;
  const newest = items.length ? items[0].date : null;
  const span = oldest ? `${oldest.toISOString().slice(0, 7).replace('-', '.')} – ${newest ? newest.toISOString().slice(0, 7).replace('-', '.') : ''}` : '—';

  const counts = {
    文章: items.filter((i) => i.kind === '文章').length,
    随记: items.filter((i) => i.kind === '随记').length,
    章节: items.filter((i) => i.kind === '章节').length,
  };

  return (
    <div className="page arc-page">
      <div className="wrap">
        <div className="page-head">
          <h1>
            <span className="kicker">{pages.archive.kicker}</span>{pages.archive.title}
          </h1>
          <p>{pages.archive.lead}</p>
          <div className="arc-stat">
            {items.length} 条 · 跨 {span}
            {Object.entries(counts)
              .filter(([, n]) => n)
              .map(([label, n]) => ` · ${label} ${n}`)
              .join('')}
          </div>
        </div>

        {items.length ? (
          <div className="scroll-panel tall arc-scroll">
            <div className="flow" style={{ ['--step' as string]: `${STEP}px`, ['--amp' as string]: `${AMP}%` }}>
              <svg className="flow-line" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop className="g-night" offset="0" stopOpacity="0" />
                    <stop className="g-night" offset="0.06" stopOpacity="1" />
                    <stop className="g-sky" offset="0.34" stopOpacity="0.95" />
                    <stop className="g-cyan" offset="0.6" stopOpacity="0.9" />
                    <stop className="g-gold" offset="0.78" stopOpacity="0.9" />
                    <stop className="g-peach" offset="0.92" stopOpacity="0.85" />
                    <stop className="g-peach" offset="1" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="flowSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity="0" />
                    <stop offset="0.32" stopColor="#fff" stopOpacity="0.85" />
                    <stop offset="0.68" stopColor="#fff" stopOpacity="0.85" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="flowRipple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                  <mask id="flowMask" maskUnits="userSpaceOnUse" x="-40" y="0" width="180" height={height}>
                    <rect className="flow-band" x="-40" y={-BAND} width="180" height={BAND} fill="url(#flowSpark)">
                      <animateTransform attributeName="transform" type="translate" values={`0 0; 0 ${height + BAND}`} dur="14s" repeatCount="indefinite" />
                    </rect>
                    <rect className="flow-band band-2" x="-40" y={-BAND} width="180" height={BAND} fill="url(#flowSpark)">
                      <animateTransform attributeName="transform" type="translate" values={`0 0; 0 ${height + BAND}`} dur="14s" begin="-7s" repeatCount="indefinite" />
                    </rect>
                  </mask>
                  <mask id="flowRippleMask" maskUnits="userSpaceOnUse" x="-40" y="0" width="180" height={height}>
                    <rect className="flow-ripple" x="-40" y={-RIPPLE} width="180" height={RIPPLE} fill="url(#flowRipple)">
                      <animateTransform attributeName="transform" type="translate" values={`0 0; 0 ${height + RIPPLE}`} dur="22s" repeatCount="indefinite" />
                    </rect>
                    <rect className="flow-ripple ripple-2" x="-40" y={-RIPPLE} width="180" height={RIPPLE} fill="url(#flowRipple)">
                      <animateTransform attributeName="transform" type="translate" values={`0 0; 0 ${height + RIPPLE}`} dur="22s" begin="-11s" repeatCount="indefinite" />
                    </rect>
                  </mask>
                  <filter id="flowSoft" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" />
                  </filter>
                </defs>
                <path className="flow-bed" d={path} fill="none" stroke="url(#flowGrad)" strokeWidth="16" vectorEffect="non-scaling-stroke" filter="url(#flowSoft)" />
                <path className="flow-core" d={path} fill="none" stroke="url(#flowGrad)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path className="flow-spark" d={path} fill="none" stroke="#FFF4E2" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" mask="url(#flowMask)" />
                <path className="flow-glint" d={path} fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" mask="url(#flowRippleMask)" />
              </svg>

              <ol className="flow-rows">
                {items.map((it, i) => (
                  <li key={`${it.href}-${i}`} className={`flow-row side-${i % 2 === 0 ? 'left' : 'right'}`}>
                    <Link className="flow-card" href={it.href}>
                      <span className="flow-kind">{it.kind === '章节' ? '小说' : it.kind}</span>
                      <b>{it.title}</b>
                      {it.meta ? <em>{it.meta}</em> : null}
                    </Link>
                    <span className="flow-node" aria-hidden="true" />
                    <time dateTime={it.date.toISOString()}>{fmtDate(it.date)}</time>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          pages.archive.note ? <p className="arc-empty">{pages.archive.note}</p> : null
        )}
      </div>
    </div>
  );
}
