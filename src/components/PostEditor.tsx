'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { savePost, type SaveState } from '@/actions/post';
import BodyEditor from '@/components/BodyEditor';

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

      <BodyEditor
        label="正文（Markdown，支持 > [!note] 与 ==高亮==）"
        defaultValue={post?.body ?? ''}
        minHeight={340}
      />

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
