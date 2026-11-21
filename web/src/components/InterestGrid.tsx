'use client';

import { useEffect, useState } from 'react';

type Item = { name: string; desc: string; quote: string };

export default function InterestGrid({ items }: { items: Item[] }) {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!tip) return;
    const t = window.setTimeout(() => setTip(null), 2500);
    return () => window.clearTimeout(t);
  }, [tip]);

  return (
    <>
      <div className="interests-grid">
        {items.map((i) => (
          <button
            key={i.name}
            className="interest-item"
            type="button"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTip({ text: i.quote, x: rect.left + rect.width / 2, y: rect.top - 12 });
            }}
          >
            <div className="interest-name">{i.name}</div>
            <div className="interest-desc">{i.desc}</div>
          </button>
        ))}
      </div>

      {tip ? (
        <div className="quote-tooltip" style={{ left: tip.x, top: tip.y }}>
          <div className="quote-tooltip-inner">
            <span className="quote-tooltip-mark">"</span>
            <p className="quote-tooltip-text">{tip.text}</p>
            <span className="quote-tooltip-mark right">"</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
