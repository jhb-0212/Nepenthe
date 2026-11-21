'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { saveChapter, type NovelState } from '@/actions/novels';
import BodyEditor from '@/components/BodyEditor';

type Chapter = {
  id: number;
  slug: string;
  title: string;
  order: number;
  date: string;
  body: string;
  draft: boolean;
} | null;

export default function ChapterEditor({ novelId, chapter, backHref }: { novelId: number; chapter: Chapter; backHref: string }) {
  const [state, action, pending] = useActionState<NovelState, FormData>(saveChapter, {});

  return (
    <form className="admin-form" action={action}>
      <input type="hidden" name="novelId" value={novelId} />
      <input type="hidden" name="id" value={chapter?.id ?? 0} />

      <div className="admin-row">
        <label>
          章节名
          <input name="title" defaultValue={chapter?.title ?? ''} required />
        </label>
        <label>
          序号
          <input name="order" type="number" min={1} defaultValue={chapter?.order ?? 1} required />
        </label>
        <label>
          日期
          <input name="date" type="date" defaultValue={chapter?.date ?? new Date().toISOString().slice(0, 10)} required />
        </label>
      </div>

      <label>
        slug（留空按序号生成）
        <input name="slug" defaultValue={chapter?.slug ?? ''} placeholder="ch-01" />
      </label>

      <BodyEditor label="正文（Markdown，可插图）" defaultValue={chapter?.body ?? ''} minHeight={320} />

      <label style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" name="draft" defaultChecked={chapter?.draft ?? false} style={{ width: 'auto' }} />
        存为草稿
      </label>

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="admin-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存'}
        </button>
        <Link className="admin-btn" href={backHref}>
          回作品
        </Link>
      </div>
    </form>
  );
}
