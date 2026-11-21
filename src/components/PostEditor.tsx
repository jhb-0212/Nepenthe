'use client';

import { useActionState, useRef, useState } from 'react';
import Link from 'next/link';
import { savePost, type SaveState } from '@/actions/post';

type Post = {
  id: number;
  slug: string;
  title: string;
  tag: string;
  readTime: string;
  summary: string;
  body: string;
  date: string;
  draft: boolean;
} | null;

export default function PostEditor({ post }: { post: Post }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(savePost, {});
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('上传中…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string; width?: number; height?: number };
      if (!res.ok || !data.ok || !data.url) throw new Error(data.error || '上传失败');

      const ta = bodyRef.current;
      const alt = file.name.replace(/\.[^.]+$/, '');
      const md = `![${alt}](${data.url})`;
      if (ta) {
        const start = ta.selectionStart ?? ta.value.length;
        const end = ta.selectionEnd ?? start;
        ta.value = ta.value.slice(0, start) + md + ta.value.slice(end);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + md.length;
      }
      setUploadMsg(`已插入 ${data.width}×${data.height}`);
    } catch (err) {
      setUploadMsg((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <form className="admin-form" action={action}>
      <input type="hidden" name="id" value={post?.id ?? 0} />
      <div className="admin-row">
        <label>
          标题
          <input name="title" defaultValue={post?.title ?? ''} required />
        </label>
        <label>
          slug（网址）
          <input name="slug" defaultValue={post?.slug ?? ''} placeholder="留空则从标题生成" />
        </label>
      </div>
      <div className="admin-row">
        <label>
          日期
          <input name="date" type="date" defaultValue={post?.date ?? new Date().toISOString().slice(0, 10)} required />
        </label>
        <label>
          标签
          <input name="tag" defaultValue={post?.tag ?? ''} />
        </label>
        <label>
          阅读时长
          <input name="readTime" defaultValue={post?.readTime ?? '3 分钟'} />
        </label>
      </div>
      <label>
        摘要
        <input name="summary" defaultValue={post?.summary ?? ''} />
      </label>
      <label>
        正文（Markdown，支持 &gt; [!note] 与 ==高亮==）
        <textarea name="body" ref={bodyRef} defaultValue={post?.body ?? ''} />
      </label>

      <div className="admin-actions" style={{ alignItems: 'center' }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
          style={{ display: 'none' }}
          onChange={onPickImage}
        />
        <button
          className="admin-btn"
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? '上传中…' : '插入图片'}
        </button>
        <small style={{ color: 'var(--faint)', fontSize: 12 }}>
          图片会压成 WebP、长边 2560、剥掉 EXIF{uploadMsg ? ` · ${uploadMsg}` : ''}
        </small>
      </div>
      <label style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" name="draft" defaultChecked={post?.draft ?? false} style={{ width: 'auto' }} />
        存为草稿（前台不展示）
      </label>

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}（改完再去点「发布」刷索引）</div> : null}

      <div className="admin-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存'}
        </button>
        <Link className="admin-btn" href="/admin/posts">
          回列表
        </Link>
        {post ? (
          <Link className="admin-btn" href={`/writing/${post.slug}`} target="_blank">
            前台预览
          </Link>
        ) : null}
      </div>
    </form>
  );
}
