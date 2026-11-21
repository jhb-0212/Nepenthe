'use client';

import { useEffect, useRef, useState } from 'react';

type Quote = { text: string; from: string };

export default function Hero({
  name,
  quotes,
  phrases,
}: {
  name: string;
  quotes: Quote[];
  phrases: string[];
}) {
  const [typed, setTyped] = useState('');
  const [qi, setQi] = useState(0);
  const [spin, setSpin] = useState(false);
  const [fading, setFading] = useState(false);

  // 打字机：打出来、停一下、删掉、换下一句
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
          timer = window.setTimeout(tick, 1800);
          return;
        }
        timer = window.setTimeout(tick, 130);
      } else {
        ci -= 1;
        setTyped(cur.slice(0, ci));
        if (ci <= 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
          timer = window.setTimeout(tick, 320);
          return;
        }
        timer = window.setTimeout(tick, 60);
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
    <section className="hero-full">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg-img" style={{ backgroundImage: 'url(/hero-bg.jpg)' }} />
        <div className="hero-bg-overlay" />
      </div>

      <div className="hero-center">
        <div className="hero-pill">{name}</div>
        <p className="hero-hi">HERE LIVES A WORRILESS SOUL</p>
        <h1 className="hero-type">
          <span className="typed">{typed}</span>
          <span className="caret" aria-hidden="true" />
        </h1>

        <div className="hero-quote">
          <button className={`quote-refresh${spin ? ' is-spin' : ''}`} type="button" aria-label="换一句格言" onClick={refresh}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
          <div className="quote-body" style={{ opacity: fading ? 0 : 1, transition: 'opacity .2s' }}>
            <p className="quote-text">{q.text}</p>
            <p className="quote-from">—— {q.from}</p>
          </div>
        </div>
      </div>

      <a className="hero-scroll" href="#down" data-scroll="down">
        <span>向下滚动</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </a>

      <div className="hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,120 L0,120 Z" fill="#ffffff" />
        </svg>
      </div>
    </section>
  );
}
