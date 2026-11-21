'use client';

import { useActionState, useState } from 'react';
import { submitMessage, type MessageState } from '@/actions/message';

export default function MessageForm() {
  const [state, action, pending] = useActionState<MessageState, FormData>(submitMessage, {});
  const [renderedAt] = useState(() => Date.now());

  return (
    <form className="msg-form" action={action}>
      <input type="hidden" name="renderedAt" value={renderedAt} />
      {/* 蜜罐：真人看不到，viewport 之外且不留 tab 焦点 */}
      <div className="msg-honey" aria-hidden="true">
        <label>
          网站
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="msg-field">
        昵称（可空）
        <input key={state.ok ? 'name-sent' : 'name-edit'} name="name" defaultValue={state.name ?? ''} maxLength={12} placeholder="佚名" />
      </label>

      <label className="msg-field">
        说点什么
        <textarea
          key={state.ok ? 'body-sent' : 'body-edit'}
          name="body"
          defaultValue={state.body ?? ''}
          rows={5}
          maxLength={400}
          required
          placeholder="不用登录，也不用留联系方式。写一句就走，审核过了会出现在下面。"
        />
      </label>

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="msg-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '提交中…' : '写上去'}
        </button>
        <small>匿名 · 不存 IP · 人工审核后显示</small>
      </div>
    </form>
  );
}
