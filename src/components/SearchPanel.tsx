'use client';

import { useEffect, useRef, useState } from 'react';

type Hit = { kind: string; title: string; href: string; snippet: string; date: string; tag?: string };

export default function SearchPanel() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const initial = new URLSearchParams(location.search).get('q') || '';
    if (initial) setQ(initial);
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setHits([]);
      return;
    }
    const id = ++seq.current;
    setBusy(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data: { source: string; hits: Hit[] }) => {
          if (id !== seq.current) return;
          setHits(data.hits || []);
          setSource(data.source || '');
        })
        .catch(() => undefined)
        .finally(() => id === seq.current && setBusy(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  return (
    <div className="search-panel">
      <div className="search-box">
        <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜文章、随记、小说…"
          aria-label="搜索"
          autoFocus
        />
        {busy ? <span className="search-busy">搜…</span> : null}
      </div>

      {q.trim() ? (
        <p className="search-meta">
          {hits.length} 条结果{source ? ` · ${source === 'meili' ? 'Meilisearch' : 'PostgreSQL 兜底'}` : ''}
        </p>
      ) : null}

      <ul className={`search-results${hits.length ? ' scroll-panel' : ''}`}>
        {hits.map((h) => (
          <li key={h.href + h.title}>
            <a href={h.href}>
              <span className="sr-kind">{h.kind === 'post' ? '文章' : h.kind === 'note' ? '随记' : h.kind === 'novel' ? '小说' : '章节'}</span>
              <b dangerouslySetInnerHTML={{ __html: h.title }} />
              <p dangerouslySetInnerHTML={{ __html: h.snippet }} />
              <span className="sr-date">{h.date}</span>
            </a>
          </li>
        ))}
      </ul>

      {q.trim() && !busy && hits.length === 0 ? <p className="search-empty">没有命中。换个词，或者这个词确实没写过。</p> : null}
    </div>
  );
}
