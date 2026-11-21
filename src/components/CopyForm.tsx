'use client';

import { useActionState } from 'react';
import { saveCopy, type CopyState } from '@/actions/copy';
import { COPY_FIELDS, type CopyValues } from '@/lib/copy';

export default function CopyForm({ copy }: { copy: CopyValues }) {
  const [state, action, pending] = useActionState<CopyState, FormData>(saveCopy, {});

  const groups = [...new Set(COPY_FIELDS.map((f) => f.group))];

  return (
    <form className="admin-form copy-editor" action={action}>
      <p className="abx-tip">
        这里是全站每个页面的标题、引导语、空态提示和按钮字。改完保存，前台刷新就变，不用改代码也不用重新构建。
        还没搬过来的：导航与页脚的结构、首页「在做」卡片（在内容库里）、相册图（在相册后台）。
      </p>

      {groups.map((g) => (
        <section className="abx-sec" key={g}>
          <div className="abx-head">
            <h3>{g}</h3>
            <span>{COPY_FIELDS.filter((f) => f.group === g).length} 个字段</span>
          </div>

          {COPY_FIELDS.filter((f) => f.group === g).map((f) => {
            const value = copy[f.key] ?? f.fallback;
            const isDefault = value === f.fallback;
            return (
              <div className="abx-field" key={f.key}>
                <div className="abx-field-head">
                  <label htmlFor={f.key}>{f.label}</label>
                  {isDefault ? null : <span className="abx-changed">已修改</span>}
                  <code>{f.key}</code>
                </div>
                {f.multiline ? (
                  <textarea
                    id={f.key}
                    name={f.key}
                    defaultValue={value}
                    rows={Math.min(6, Math.max(2, f.fallback.split('\n').length + 1))}
                  />
                ) : (
                  <input id={f.key} name={f.key} defaultValue={value} />
                )}
                {f.hint ? <small className="abx-field-hint">{f.hint}</small> : null}
                {isDefault ? null : <small className="abx-field-hint">默认：{f.fallback}</small>}
              </div>
            );
          })}
        </section>
      ))}

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="admin-actions sticky-save">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存页面文案'}
        </button>
      </div>
    </form>
  );
}
