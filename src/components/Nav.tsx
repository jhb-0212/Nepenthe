'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Props = { name: string; en: string; portfolioUrl: string };

const BG_SWATCHES = [
  { file: 'hero-bg.jpg', label: '青山云海' },
  { file: 'bg-star.jpg', label: '星空' },
  { file: 'bg-sakura.jpg', label: '樱花' },
  { file: 'bg-ocean.jpg', label: '海边日落' },
  { file: 'bg-city.jpg', label: '城市夜景' },
];

const ITEMS = [
  { href: '/', label: '首页' },
];

/** 分组导航：一级只留 5 项，栏目收进「创作 / 生活」两组 */
const GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: '创作',
    items: [
      { href: '/writing', label: '文章' },
      { href: '/notes', label: '随记' },
      { href: '/novels', label: '小说' },
      { href: '/archive', label: '归档' },
    ],
  },
  {
    label: '生活',
    items: [
      { href: '/gallery', label: '相册' },
      { href: '/music', label: '音乐' },
      { href: '/doing', label: '在做' },
      { href: '/wall', label: '留言' },
    ],
  },
];

export default function Nav({ name, en, portfolioUrl }: Props) {
  const pathname = usePathname() || '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [setsOpen, setSetsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [activeBg, setActiveBg] = useState<string>('');

  // 首屏透明叠在山景上，下滑后固定
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      const hasHero = document.querySelector('.hero, .hero-full');
      if (!hasHero || window.scrollY > 40) nav.classList.add('is-fixed');
      else nav.classList.remove('is-fixed');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 背景图切换：记住到 localStorage，下次打开还是这张
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nepenthe-bg');
      if (saved) applyBg(saved);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSetsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function applyBg(val: string) {
    setActiveBg(val);
    const [type, ...rest] = val.split(':');
    const v = rest.join(':');
    const img = document.querySelector<HTMLElement>('.hero-bg-img');
    const overlay = document.querySelector<HTMLElement>('.hero-bg-overlay');
    if (img && type === 'img') {
      img.style.background = 'none';
      img.style.backgroundImage = `url(/${v})`;
      if (overlay) overlay.style.background = '';
    }
    try {
      localStorage.setItem('nepenthe-bg', val);
    } catch {
      /* ignore */
    }
  }

  const matched = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  // 后台不显示站点导航，避免和后台操作区抢位置
  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="nav" ref={navRef}>
      <div className="nav-in">
        <Link className="brand" href="/">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-cn">{name}</span>
          <span className="brand-en">{en}</span>
        </Link>

        <button
          className="nav-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label="展开菜单"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <nav className={`menu${menuOpen ? ' open' : ''}`} id="site-menu" aria-label="主导航">
          {ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              aria-current={matched(it.href) ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {it.label}
            </Link>
          ))}

          {GROUPS.map((g) => {
            const active = g.items.some((it) => matched(it.href));
            return (
              <div key={g.label} className={`menu-group${active ? ' is-active' : ''}`}>
                <button
                  className="menu-group__btn"
                  type="button"
                  aria-haspopup="true"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') e.currentTarget.blur();
                  }}
                >
                  {g.label}
                  <svg className="menu-group__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className="menu-group__panel">
                  {g.items.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      aria-current={matched(it.href) ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          <Link href="/about" aria-current={matched('/about') ? 'page' : undefined} onClick={() => setMenuOpen(false)}>
            关于我
          </Link>

          {portfolioUrl ? (
            <a className="ext" href={portfolioUrl} data-ext="portfolio" target="_blank" rel="noopener noreferrer">
              作品集
            </a>
          ) : null}
        </nav>

        <button
          className="set-btn"
          type="button"
          aria-expanded={setsOpen}
          aria-controls="sets"
          aria-label="打开设置"
          onClick={() => setSetsOpen((v) => !v)}
        >
          <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      <aside className={`sets${setsOpen ? ' open' : ''}`} id="sets" aria-hidden={!setsOpen} aria-labelledby="sets-title">
        <div className="sets-head">
          <b id="sets-title">设置</b>
          <button className="sets-close" type="button" aria-label="关闭设置" onClick={() => setSetsOpen(false)}>
            ×
          </button>
        </div>
        <div className="sets-body">
          <div className="set-group">
            <div className="set-label">背景图</div>
            <div className="set-bg-thumbs">
              {BG_SWATCHES.map((b) => (
                <button
                  key={b.file}
                  type="button"
                  data-bg={`img:${b.file}`}
                  className={activeBg === `img:${b.file}` ? 'is-active' : undefined}
                  style={{ backgroundImage: `url(/${b.file})` }}
                  aria-label={b.label}
                  onClick={() => applyBg(`img:${b.file}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </header>
  );
}
