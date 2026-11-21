'use client';

import { useEffect, useState } from 'react';
import { publishAction } from '@/actions/auth';

type Job = { status: string; step: string; progress: number; log: string };

export default function PublishButton() {
  const [jobId, setJobId] = useState<number | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);

  const publish = async () => {
    setBusy(true);
    setJob({ status: 'running', step: '重建索引', progress: 40, log: '' });
    const res = await publishAction();
    setJobId(res.jobId);
    setJob({
      status: res.ok ? 'success' : 'failed',
      step: res.message,
      progress: 100,
      log: res.ok ? '前台已即时生效，无需等待构建' : '看下方任务日志',
    });
    setBusy(false);
  };

  // 发布任务进度走 SSE（比轮询体面：服务端一条连接推到底）
  useEffect(() => {
    if (!jobId) return;
    const es = new EventSource(`/api/publish/stream?job=${jobId}`);
    es.addEventListener('publish', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as Job;
        setJob((prev) => ({ ...data, progress: Math.max(prev?.progress ?? 0, data.progress) }));
        if (data.status === 'success' || data.status === 'failed') es.close();
      } catch {
        /* ignore */
      }
    });
    es.addEventListener('error', () => es.close());
    return () => es.close();
  }, [jobId]);

  return (
    <>
      <button className="admin-btn primary" type="button" onClick={publish} disabled={busy}>
        {busy ? '发布中…' : '发布（重建索引）'}
      </button>
      {job ? (
        <div
          className="publish-bar"
          style={{ position: 'fixed', right: 24, bottom: 24, width: 340, zIndex: 60, boxShadow: '0 10px 30px rgba(0,0,0,.08)' }}
        >          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{job.step}</span>
            <span>{job.progress}%</span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${job.progress}%` }} />
          </div>
          {job.log ? <div style={{ marginTop: 6, color: 'var(--faint)' }}>{job.log}</div> : null}
        </div>
      ) : null}
    </>
  );
}
