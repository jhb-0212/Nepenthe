'use client';

import { useState } from 'react';

/** 后台通用的一张图字段：选图 → /api/admin/upload 压成 WebP → 把 URL 写回字段 */
export default function ImageField({
  value,
  onChange,
  label = '图片',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) throw new Error(data.error || '上传失败');
      onChange(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '上传失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="abx-img">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" />
      ) : (
        <span className="abx-img-empty">无图</span>
      )}
      <div className="abx-img-actions">
        <label className="abx-file">
          {busy ? '上传中…' : value ? `换${label}` : `上传${label}`}
          <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} hidden />
        </label>
        {value ? (
          <button type="button" className="abx-mini" onClick={() => onChange('')}>
            去掉
          </button>
        ) : null}
      </div>
      {err ? <b className="abx-err">{err}</b> : null}
    </div>
  );
}
