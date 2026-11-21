'use client';

import { useActionState, useState } from 'react';
import { savePages, type PagesState } from '@/actions/pages';
import type { PageCopy, PagesConfig } from '@/lib/pages';
import ImageField from '@/components/ImageField';

const KEYS: { key: Exclude<keyof PagesConfig, 'galleryBg'>; label: string; path: string; hint: string }[] = [
  { key: 'writing', label: '文章', path: '/writing', hint: '列表页页头；note 只在没文章时显示' },
  { key: 'notes', label: '随记', path: '/notes', hint: 'note 是空态文案' },
  { key: 'novels', label: '小说', path: '/novels', hint: 'note 显示在列表下方' },
  { key: 'gallery', label: '相册', path: '/gallery', hint: 'lead/sub 是横幅上的两行字，note 是空态' },
  { key: 'archive', label: '归档', path: '/archive', hint: 'note 是空态' },
  { key: 'music', label: '音乐', path: '/music', hint: '下面那台播放器不用在这里改' },
  { key: 'doing', label: '在做', path: '/doing', hint: 'sub 是卡片上方那段自述' },
  { key: 'wall', label: '留言', path: '/wall', hint: 'note 是墙上还没人时的提示' },
  { key: 'search', label: '搜索', path: '/search', hint: 'note 是页脚的小字说明' },
];

export default function PagesForm({ pages: initial }: { pages: PagesConfig }) {
  const [state, action, pending] = useActionState<PagesState, FormData>(savePages, {});
  const [pages, setPages] = useState<PagesConfig>(initial);

  const setPage = (key: Exclude<keyof PagesConfig, 'galleryBg'>, part: Partial<PageCopy>) =>
    setPages((p) => ({ ...p, [key]: { ...(p[key] as PageCopy), ...part } }));

  return (
    <form className="admin-form about-editor" action={action}>
      <input type="hidden" name="payload" value={JSON.stringify(pages)} readOnly />

      <p className="abx-tip">
        这里是各个前台页面的页头文字：小标签、大标题、一句说明、空态提示。改完保存，前台刷新即生效。
        文章、随记、小说、相册里的<b>具体内容</b>仍然在各自的后台模块里编辑。
      </p>

      <section className="abx-sec">
        <div className="abx-head">
          <h3>相册横幅图</h3>
          <span>不填就用站点默认背景</span>
        </div>
        <div className="abx-row">
          <ImageField value={pages.galleryBg} onChange={(url) => setPages((p) => ({ ...p, galleryBg: url }))} label="背景图" />
          <label className="grow">
            地址
            <input
              value={pages.galleryBg}
              onChange={(e) => setPages((p) => ({ ...p, galleryBg: e.target.value }))}
              placeholder="/hero-bg.jpg"
            />
          </label>
        </div>
      </section>

      {KEYS.map(({ key, label, path, hint }) => {
        const pc = pages[key] as PageCopy;
        return (
          <section className="abx-sec" key={key}>
            <div className="abx-head">
              <h3>{label}</h3>
              <span>
                {path} · {hint}
              </span>
              <a className="abx-link" href={path} target="_blank" rel="noopener">
                看这一页 ↗
              </a>
            </div>

            <div className="abx-row">
              <label>
                小标签
                <input value={pc.kicker} onChange={(e) => setPage(key, { kicker: e.target.value })} placeholder="WORDS" />
              </label>
              <label className="grow">
                大标题
                <input value={pc.title} onChange={(e) => setPage(key, { title: e.target.value })} />
              </label>
            </div>

            <label>
              一句说明
              <textarea value={pc.lead} onChange={(e) => setPage(key, { lead: e.target.value })} style={{ minHeight: 64 }} />
            </label>

            <div className="abx-row">
              <label className="grow">
                副句 / 第二段
                <input value={pc.sub} onChange={(e) => setPage(key, { sub: e.target.value })} />
              </label>
              <label className="grow">
                空态 / 页脚小字
                <input value={pc.note} onChange={(e) => setPage(key, { note: e.target.value })} />
              </label>
            </div>
          </section>
        );
      })}

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="admin-actions sticky-save">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存页面文案'}
        </button>
        <a className="admin-btn" href="/writing" target="_blank" rel="noopener">
          看文章页
        </a>
      </div>
    </form>
  );
}
