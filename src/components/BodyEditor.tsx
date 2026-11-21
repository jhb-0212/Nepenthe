'use client';

import { useEffect, useRef, useState } from 'react';

/** 正文编辑器：Markdown 快捷按钮 + 字数 + Ctrl/Cmd+S 保存 + 插图 */
export default function BodyEditor({
  name = 'body',
  defaultValue = '',
  label,
  minHeight = 280,
  placeholder,
  required = false,
}: {
  name?: string;
  defaultValue?: string;
  label: string;
  minHeight?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const ta = ref.current;
    if (ta) setCount(ta.value.replace(/\s/g, '').length);
  }, []);

  function sync() {
    const ta = ref.current;
    if (ta) setCount(ta.value.replace(/\s/g, '').length);
  }

  function wrap(before: string, after: string, fallback = '文字') {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const sel = ta.value.slice(start, end) || fallback;
    ta.value = ta.value.slice(0, start) + before + sel + after + ta.value.slice(end);
    ta.focus();
    ta.selectionStart = start + before.length;
    ta.selectionEnd = start + before.length + sel.length;
    sync();
  }

  function prefixLines(p: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.value.lastIndexOf('\n', (ta.selectionStart ?? 0) - 1) + 1;
    const end = ta.value.indexOf('\n', ta.selectionEnd ?? 0);
    const stop = end === -1 ? ta.value.length : end;
    const block = ta.value.slice(start, stop).split('\n').map((l) => `${p}${l}`);
    ta.value = ta.value.slice(0, start) + block.join('\n') + ta.value.slice(stop);
    ta.focus();
    ta.selectionStart = start;
    ta.selectionEnd = start + block.join('\n').length;
    sync();
  }

  function divider() {
    const ta = ref.current;
    if (!ta) return;
    const at = ta.selectionStart ?? ta.value.length;
    ta.value = `${ta.value.slice(0, at)}\n\n---\n\n${ta.value.slice(at)}`;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = at + 7;
    sync();
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('上传中…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string; width?: number; height?: number };
      if (!res.ok || !data.ok || !data.url) throw new Error(data.error || '上传失败');
      const ta = ref.current;
      const alt = file.name.replace(/\.[^.]+$/, '');
      const md = `![${alt}](${data.url})`;
      if (ta) {
        const at = ta.selectionStart ?? ta.value.length;
        ta.value = ta.value.slice(0, at) + md + ta.value.slice(at);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = at + md.length;
        sync();
      }
      setMsg(`已插入 ${data.width}×${data.height}`);
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="md-editor">
      <div className="md-head">
        <span>{label}</span>
        <span className="md-count">{count} 字</span>
      </div>

      <div className="md-tools">
        <button type="button" onClick={() => wrap('**', '**')} title="加粗">
          加粗
        </button>
        <button type="button" onClick={() => wrap('==', '==')} title="高亮">
          高亮
        </button>
        <button type="button" onClick={() => prefixLines('> ')} title="引用">
          引用
        </button>
        <button type="button" onClick={() => prefixLines('- ')} title="列表">
          列表
        </button>
        <button type="button" onClick={() => wrap('## ', '', '小标题')} title="小标题">
          标题
        </button>
        <button type="button" onClick={divider} title="分隔线">
          分隔线
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? '上传中…' : '插入图片'}
        </button>
        <span className="md-hint">Ctrl/Cmd + S 保存{msg ? ` · ${msg}` : ''}</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
          style={{ display: 'none' }}
          onChange={onPick}
        />
      </div>

      <textarea
        ref={ref}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        style={{ minHeight }}
        onInput={sync}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
    </div>
  );
}
