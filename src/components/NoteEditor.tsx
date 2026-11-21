'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { saveNote, type NoteState } from '@/actions/notes';
import BodyEditor from '@/components/BodyEditor';

type Note = {
  id: number;
  slug: string;
  body: string;
  tag: string | null;
  date: string;
  draft: boolean;
} | null;

export default function NoteEditor({ note }: { note: Note }) {
  const [state, action, pending] = useActionState<NoteState, FormData>(saveNote, {});

  return (
    <form className="admin-form" action={action}>
      <input type="hidden" name="id" value={note?.id ?? 0} />

      <div className="admin-row">
        <label>
          日期
          <input name="date" type="date" defaultValue={note?.date ?? new Date().toISOString().slice(0, 10)} required />
        </label>
        <label>
          标签
          <input name="tag" defaultValue={note?.tag ?? ''} placeholder="可不填" />
        </label>
        <label>
          slug
          <input name="slug" defaultValue={note?.slug ?? ''} placeholder="留空自动生成" />
        </label>
      </div>

      <BodyEditor
        label="内容（支持 ==高亮== 与 > [!note]）"
        defaultValue={note?.body ?? ''}
        minHeight={200}
        required
      />

      <label style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" name="draft" defaultChecked={note?.draft ?? false} style={{ width: 'auto' }} />
        存为草稿
      </label>

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="admin-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存'}
        </button>
        <Link className="admin-btn" href="/admin/notes">
          回列表
        </Link>
      </div>
    </form>
  );
}
