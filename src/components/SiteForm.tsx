'use client';

import { useActionState } from 'react';
import { saveSite, type SiteState } from '@/actions/site';
import type { SiteConfig } from '@/lib/site';

export default function SiteForm({ site }: { site: SiteConfig }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(saveSite, {});

  return (
    <form className="admin-form" action={action}>
      <div className="admin-row">
        <label>
          站点名
          <input name="name" defaultValue={site.name} required />
        </label>
        <label>
          英文名
          <input name="en" defaultValue={site.en} />
        </label>
        <label>
          角标文字
          <input name="mark" defaultValue={site.mark} />
        </label>
      </div>

      <label>
        一句话介绍
        <input name="intro" defaultValue={site.intro} />
      </label>
      <label>
        首屏长句
        <textarea name="lead" defaultValue={site.lead} style={{ minHeight: 90 }} />
      </label>
      <label>
        SEO 描述
        <textarea name="desc" defaultValue={site.desc} style={{ minHeight: 80 }} />
      </label>

      <div className="admin-row">
        <label>
          作品集链接
          <input name="portfolioUrl" defaultValue={site.portfolioUrl} placeholder="https://…" />
        </label>
        <label>
          网易云歌单 ID
          <input name="playlistId" defaultValue={site.playlistId} />
        </label>
      </div>

      <div className="admin-row">
        <label>
          全局背景图
          <input name="backgroundImage" defaultValue={site.backgroundImage} placeholder="hero-bg.jpg 或 /uploads/…" />
        </label>
        <label>
          压暗（0–100）
          <input name="backgroundImageDim" type="number" min={0} max={100} defaultValue={site.backgroundImageDim} />
        </label>
      </div>

      <div className="admin-row">
        <label>
          GitHub
          <input name="github" defaultValue={site.contact.github} />
        </label>
        <label>
          邮箱
          <input name="email" defaultValue={site.contact.email} />
        </label>
        <label>
          微信
          <input name="wechatId" defaultValue={site.contact.wechatId} />
        </label>
        <label>
          抖音
          <input name="douyin" defaultValue={site.contact.douyin} />
        </label>
      </div>

      <label>
        个人简介（JSON 数组，一行一段）
        <textarea name="bio" defaultValue={JSON.stringify(site.bio, null, 2)} style={{ minHeight: 140 }} />
      </label>
      <label>
        在做的事（JSON 数组：state / title / sub / note / noteLong）
        <textarea name="doing" defaultValue={JSON.stringify(site.doing, null, 2)} style={{ minHeight: 180 }} />
      </label>
      <label>
        数字卡片（JSON 数组：k / v）
        <textarea name="facts" defaultValue={JSON.stringify(site.facts, null, 2)} style={{ minHeight: 120 }} />
      </label>

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="admin-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存站点设置'}
        </button>
      </div>
    </form>
  );
}
