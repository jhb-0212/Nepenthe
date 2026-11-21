'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/actions/auth';

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form className="admin-form" action={action} style={{ maxWidth: 380, margin: '80px auto', padding: '0 22px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>后台登录</h1>
      <p style={{ fontSize: 13, color: 'var(--faint)', marginTop: 0 }}>账号走环境变量，不提供注册。</p>
      <label>
        账号
        <input name="username" autoComplete="username" defaultValue="admin" required />
      </label>
      <label>
        口令
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      <button className="admin-btn primary" type="submit" disabled={pending}>
        {pending ? '登录中…' : '登录'}
      </button>
    </form>
  );
}
