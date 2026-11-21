'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { saveNovel, type NovelState } from '@/actions/novels';

type Novel = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string;
  status: string;
  tags: string[];
  body: string;
  updated: string;
  draft: boolean;
} | null;

export default function NovelEditor({ novel }: { novel: Novel }) {
  const [state, action, pending] = useActionState<NovelState, FormData>(saveNovel, {});

  return (
    <form className="admin-form" action={action}>
      <input type="hidden" name="id" value={novel?.id ?? 0} />

      <div className="admin-row">
        <label>
          标题
          <input name="title" defaultValue={novel?.title ?? ''} required />
        </label>
        <label>
          slug
          <input name="slug" defaultValue={novel?.slug ?? ''} placeholder="留空由标题生成" />
        </label>
      </div>

      <div className="admin-row">
        <label>
          副标题
          <input name="subtitle" defaultValue={novel?.subtitle ?? ''} />
        </label>
        <label>
          状态
          <input name="status" defaultValue={novel?.status ?? '连载中'} placeholder="连载中 / 已完结" />
        </label>
        <label>
          更新日期
          <input name="updated" type="date" defaultValue={novel?.updated ?? new Date().toISOString().slice(0, 10)} required />
        </label>
      </div>

      <label>
        标签（逗号分隔）
        <input name="tags" defaultValue={novel?.tags?.join('，') ?? ''} placeholder="都市，成长" />
      </label>

      <label>
        简介
        <input name="summary" defaultValue={novel?.summary ?? ''} />
      </label>

      <label>
        作品页正文（Markdown）
        <textarea name="body" defaultValue={novel?.body ?? ''} />
      </label>

      <label style={{ gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" name="draft" defaultChecked={novel?.draft ?? false} style={{ width: 'auto' }} />
        存为草稿
      </label>

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="admin-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存'}
        </button>
        <Link className="admin-btn" href="/admin/novels">
          回列表
        </Link>
        {novel ? (
          <Link className="admin-btn" href={`/novels/${novel.slug}`} target="_blank">
            前台预览
          </Link>
        ) : null}
      </div>
    </form>
  );
}
