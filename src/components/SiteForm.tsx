'use client';

import { useActionState, useState } from 'react';
import { saveSite, type SiteState } from '@/actions/site';
import type { SiteConfig } from '@/lib/site';

export default function SiteForm({ site }: { site: SiteConfig }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(saveSite, {});
  const [doing, setDoing] = useState<SiteConfig['doing']>(site.doing);
  const [facts, setFacts] = useState<SiteConfig['facts']>(site.facts);

  const patchDoing = (i: number, part: Partial<SiteConfig['doing'][number]>) =>
    setDoing((list) => list.map((d, idx) => (idx === i ? { ...d, ...part } : d)));
  const patchFact = (i: number, part: Partial<SiteConfig['facts'][number]>) =>
    setFacts((list) => list.map((f, idx) => (idx === i ? { ...f, ...part } : f)));

  return (
    <form className="admin-form" action={action}>
      <input type="hidden" name="doing" value={JSON.stringify(doing)} />
      <input type="hidden" name="facts" value={JSON.stringify(facts)} />

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
        个人简介（一行一段，直接写文字，不用引号和逗号）
        <textarea name="bio" defaultValue={site.bio.join('\n')} style={{ minHeight: 120 }} />
      </label>
      <section className="abx-sec">
        <div className="abx-head">
          <h3>在做的事</h3>
          <span>首页与关于页「正在做」读这里；每条一项</span>
        </div>
        {doing.map((d, i) => (
          <div className="doing-item" key={i}>
            <div className="doing-item-top">
              <b>第 {i + 1} 条</b>
              <button
                type="button"
                className="abx-mini"
                onClick={() => setDoing((list) => list.filter((_, idx) => idx !== i))}
              >
                删除
              </button>
            </div>
            <div className="admin-row">
              <label>
                状态（如「进行中」）
                <input value={d.state} onChange={(e) => patchDoing(i, { state: e.target.value })} />
              </label>
              <label className="grow">
                标题
                <input value={d.title} onChange={(e) => patchDoing(i, { title: e.target.value })} />
              </label>
            </div>
            <label>
              一句话说明
              <input value={d.sub} onChange={(e) => patchDoing(i, { sub: e.target.value })} />
            </label>
            <div className="admin-row">
              <label className="grow">
                备注
                <input value={d.note} onChange={(e) => patchDoing(i, { note: e.target.value })} />
              </label>
              <label className="grow">
                长备注
                <input value={d.noteLong} onChange={(e) => patchDoing(i, { noteLong: e.target.value })} />
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="abx-mini"
          onClick={() => setDoing((list) => [...list, { state: '进行中', title: '', sub: '', note: '', noteLong: '' }])}
        >
          + 加一条
        </button>
      </section>

      <section className="abx-sec">
        <div className="abx-head">
          <h3>数字卡片</h3>
          <span>首页那排小统计，左边标签、右边数值</span>
        </div>
        {facts.map((f, i) => (
          <div className="facts-row" key={i}>
            <label>
              标签
              <input value={f.k} onChange={(e) => patchFact(i, { k: e.target.value })} />
            </label>
            <label>
              数值
              <input value={f.v} onChange={(e) => patchFact(i, { v: e.target.value })} />
            </label>
            <button type="button" className="abx-mini" onClick={() => setFacts((list) => list.filter((_, idx) => idx !== i))}>
              删除
            </button>
          </div>
        ))}
        <button type="button" className="abx-mini" onClick={() => setFacts((list) => [...list, { k: '', v: '' }])}>
          + 加一张
        </button>
      </section>

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
