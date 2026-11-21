'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Quote = { text: string; from: string };

export default function Hero({
  name,
  en,
  title,
  lead,
  quotes,
  phrases,
  stats,
}: {
  name: string;
  en: string;
  title: string;
  lead: string;
  quotes: Quote[];
  phrases: string[];
  stats: { posts: number; notes: number; photos: number };
}) {
  const [typed, setTyped] = useState('');
  const [qi, setQi] = useState(0);
  const [spin, setSpin] = useState(false);
  const [fading, setFading] = useState(false);

  // 打字机现在只在副标题里用：打、停、删、换句，不承载个人定位
  useEffect(() => {
    if (!phrases.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(phrases[0]);
      return;
    }
    let pi = 0;
    let ci = 0;
    let deleting = false;
    let timer = 0;

    const tick = () => {
      const cur = phrases[pi];
      if (!deleting) {
        ci += 1;
        setTyped(cur.slice(0, ci));
        if (ci >= cur.length) {
          deleting = true;
          timer = window.setTimeout(tick, 2600);
          return;
        }
        timer = window.setTimeout(tick, 90);
      } else {
        ci -= 1;
        setTyped(cur.slice(0, ci));
        if (ci <= 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
          timer = window.setTimeout(tick, 320);
          return;
        }
        timer = window.setTimeout(tick, 40);
      }
    };
    timer = window.setTimeout(tick, 400);
    return () => window.clearTimeout(timer);
  }, [phrases]);

  const refresh = () => {
    if (!quotes.length) return;
    setSpin(true);
    setFading(true);
    window.setTimeout(() => {
      setQi((v) => (v + 1) % quotes.length);
      setFading(false);
      setSpin(false);
    }, 220);
  };

  const q = quotes[qi] ?? { text: '', from: '' };

  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero-bg-img" style={{ backgroundImage: 'url(/hero-bg.jpg)' }} />
        <div className="hero-bg-overlay" />
      </div>

      <div className="hero__inner">
        <div className="hero__panel">
          <p className="hero__eyebrow">
            <span className="hero__dot" aria-hidden="true" />
            {name} · {en}
          </p>

          <h1 className="hero__title">{title}</h1>

          <p className="hero__sub">
            <span className="typed">{typed}</span>
            <span className="hero__caret" aria-hidden="true" />
          </p>

          <p className="hero__desc">{lead}</p>

          <div className="hero__cta">
            <a className="btn btn-primary" href="#featured">
              看看作品
              <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </a>
            <Link className="btn btn-ghost" href="/about">
              了解我
            </Link>
          </div>

          <ul className="hero__stats">
            <li>
              <b>{stats.posts}</b>
              <span>文章</span>
            </li>
            <li>
              <b>{stats.notes}</b>
              <span>随记</span>
            </li>
            <li>
              <b>{stats.photos}</b>
              <span>照片</span>
            </li>
          </ul>

          {q.text ? (
            <div className="hero__quote">
              <button className={`hero__quote-btn${spin ? ' is-spin' : ''}`} type="button" aria-label="换一句" onClick={refresh}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <path d="M21 3v6h-6" />
                </svg>
              </button>
              <span className="hero__quote-body" style={{ opacity: fading ? 0 : 1 }}>
                <span className="hero__quote-text">{q.text}</span>
                <span className="hero__quote-from">—— {q.from}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <a className="hero__scroll" href="#featured">
        <span>向下</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
