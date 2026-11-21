'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[page-error]', error);
  }, [error]);

  return (
    <section className="state-page">
      <p className="state-kicker">500</p>
      <h1 className="state-title">这条河，暂时断流了</h1>
      <p className="state-text">
        页面没能加载出来。多半是数据库还在启动，或者正在部署新版本——过一会儿再试，通常就好了。
      </p>
      <div className="state-actions">
        <button className="admin-btn primary" type="button" onClick={reset}>
          再试一次
        </button>
        <Link className="admin-btn" href="/">
          回首页
        </Link>
      </div>
      {error.digest ? <small className="state-digest">错误编号 {error.digest}</small> : null}
    </section>
  );
}
