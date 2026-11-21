'use client';

import { useRef, useState } from 'react';
import { addPhoto } from '@/actions/gallery';

type Props = { albumId: number };

/** 上传组件：选图 → /api/admin/upload 压成 WebP → 拿到 url 后交给 Server Action 落库 */
export default function PhotoUploader({ albumId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const srcRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    let done = 0;
    for (const file of files) {
      setMsg(`上传中 ${done + 1}/${files.length}…`);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !data.ok || !data.url) throw new Error(data.error || '上传失败');

        if (srcRef.current && captionRef.current && formRef.current) {
          srcRef.current.value = data.url;
          captionRef.current.value = file.name.replace(/\.[^.]+$/, '');
          formRef.current.requestSubmit();
          done += 1;
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch (err) {
        setMsg((err as Error).message);
        setBusy(false);
        if (fileRef.current) fileRef.current.value = '';
        return;
      }
    }
    setMsg(`已加入 ${done} 张`);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <>
      <form ref={formRef} action={addPhoto} style={{ display: 'none' }}>
        <input type="hidden" name="albumId" value={albumId} />
        <input ref={srcRef} type="hidden" name="src" />
        <input ref={captionRef} type="hidden" name="caption" />
      </form>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
        style={{ display: 'none' }}
        onChange={onPick}
      />
      <button className="admin-btn" type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? '上传中…' : '上传照片'}
      </button>
      {msg ? <small style={{ color: 'var(--faint)', fontSize: 12 }}>{msg}</small> : null}
    </>
  );
}
