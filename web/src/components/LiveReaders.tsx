'use client';

import { useEffect, useState } from 'react';

type Snapshot = { total: number; paths: { path: string; n: number }[] };

const LABELS: Record<string, string> = {
  '/': '首页',
  '/writing': '文章',
  '/notes': '随记',
  '/novels': '小说',
  '/gallery': '相册',
  '/music': '音乐',
  '/about': '关于我',
  '/doing': '在做',
  '/archive': '归档',
};

const label = (path: string) => {
  if (LABELS[path]) return LABELS[path];
  if (path.startsWith('/writing/')) return '在读一篇文章';
  if (path.startsWith('/novels/')) return '在读小说';
  return path.replace(/^\//, '').slice(0, 18) || '首页';
};

// 「最近在读」：SSE 长连接，服务端每 3 秒推一次聚合后的快照。
// 只推路径 + 人次，不推任何身份信息。
export default function LiveReaders() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;
    let retry = 0;

    const connect = () => {
      es = new EventSource('/api/stream');
      es.addEventListener('open', () => {
        setLive(true);
        retry = 0;
      });
      es.addEventListener('presence', (ev) => {
        try {
          setSnap(JSON.parse((ev as MessageEvent).data));
        } catch {
          /* ignore */
        }
      });
      es.addEventListener('error', () => {
        setLive(false);
        es?.close();
        retry = Math.min(retry + 1, 6);
        window.setTimeout(connect, 1000 * 2 ** retry);
      });
    };
    connect();
    return () => es?.close();
  }, []);

  if (!snap || snap.total === 0) {
    return (
      <div className="live-strip" data-live={live ? 'on' : 'off'}>
        <span className="live-dot" aria-hidden="true" />
        <span>此刻站点很安静，等你来读</span>
      </div>
    );
  }

  return (
    <div className="live-strip" data-live={live ? 'on' : 'off'}>
      <span className="live-dot" aria-hidden="true" />
      <span>
        最近 5 分钟 <b>{snap.total}</b> 次阅读
      </span>
      <span className="live-sep" aria-hidden="true" />
      <span className="live-tags">
        {snap.paths.slice(0, 3).map((p) => (
          <em key={p.path}>
            {label(p.path)}
            <i>{p.n}</i>
          </em>
        ))}
      </span>
    </div>
  );
}
