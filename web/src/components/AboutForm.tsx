'use client';

import { useActionState, useState } from 'react';
import { saveAbout, type AboutState } from '@/actions/about';
import type { AboutConfig } from '@/lib/about';
import ImageField from '@/components/ImageField';

const toText = (items: string[]) => items.join('、');
const toList = (text: string) =>
  text
    .split(/[、,，/｜|\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export default function AboutForm({ about: initial }: { about: AboutConfig }) {
  const [state, action, pending] = useActionState<AboutState, FormData>(saveAbout, {});
  const [about, setAbout] = useState<AboutConfig>(initial);

  const patch = <K extends keyof AboutConfig>(key: K, value: AboutConfig[K]) =>
    setAbout((a) => ({ ...a, [key]: value }));

  function rowPatch<K extends keyof AboutConfig>(key: K, i: number, part: Record<string, unknown>) {
    const list = [...(about[key] as unknown as Record<string, unknown>[])];
    list[i] = { ...list[i], ...part };
    patch(key, list as unknown as AboutConfig[K]);
  }

  function addRow<K extends keyof AboutConfig>(key: K, blank: Record<string, unknown>) {
    patch(key, [...(about[key] as unknown as unknown[]), blank] as unknown as AboutConfig[K]);
  }

  function delRow<K extends keyof AboutConfig>(key: K, i: number) {
    patch(key, (about[key] as unknown as unknown[]).filter((_, x) => x !== i) as unknown as AboutConfig[K]);
  }

  function moveRow<K extends keyof AboutConfig>(key: K, i: number, dir: -1 | 1) {
    const list = [...(about[key] as unknown as unknown[])];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    patch(key, list as unknown as AboutConfig[K]);
  }

  const RowTools = ({ k, i, n }: { k: keyof AboutConfig; i: number; n: number }) => (
    <div className="abx-tools">
      <button type="button" onClick={() => moveRow(k, i, -1)} disabled={i === 0} title="上移">
        ↑
      </button>
      <button type="button" onClick={() => moveRow(k, i, 1)} disabled={i === n - 1} title="下移">
        ↓
      </button>
      <button type="button" className="del" onClick={() => delRow(k, i)} title="删除这一行">
        删
      </button>
    </div>
  );

  return (
    <form className="admin-form about-editor" action={action}>
      <input type="hidden" name="payload" value={JSON.stringify(about)} readOnly />

      <p className="abx-tip">
        这一页的每一行文字、每张配图都能在这里改，保存后前台 <b>/about</b> 直接生效，不用改代码也不用重新构建。
        个人的三段自我介绍还在「站点设置 → 个人简介」里。
      </p>

      {/* ---------- 开篇 ---------- */}
      <section className="abx-sec">
        <div className="abx-head">
          <h3>开篇</h3>
          <span>大标题、三枚身份小签、落款</span>
        </div>
        <label>
          大标题
          <textarea
            value={about.headline}
            onChange={(e) => patch('headline', e.target.value)}
            style={{ minHeight: 60 }}
          />
        </label>

        <div className="abx-sub">身份小签</div>
        {about.chips.map((c, i) => (
          <div className="abx-row three" key={i}>
            <label>
              标签
              <input value={c.label} onChange={(e) => rowPatch('chips', i, { label: e.target.value })} />
            </label>
            <label className="grow">
              内容
              <input value={c.text} onChange={(e) => rowPatch('chips', i, { text: e.target.value })} />
            </label>
            <RowTools k="chips" i={i} n={about.chips.length} />
          </div>
        ))}
        <button type="button" className="abx-add" onClick={() => addRow('chips', { label: '', text: '' })}>
          + 加一枚小签
        </button>

        <div className="abx-sub">落款（每行一句，显示在结尾的卡片里）</div>
        {about.outro.map((line, i) => (
          <div className="abx-row" key={i}>
            <label className="grow">
              第 {i + 1} 句
              <input value={line} onChange={(e) => patch('outro', about.outro.map((x, k) => (k === i ? e.target.value : x)))} />
            </label>
            <div className="abx-tools">
              <button
                type="button"
                className="del"
                onClick={() => patch('outro', about.outro.filter((_, k) => k !== i))}
                disabled={about.outro.length <= 1}
              >
                删
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="abx-add" onClick={() => patch('outro', [...about.outro, ''])}>
          + 加一句
        </button>
      </section>

      {/* ---------- 三句实话 ---------- */}
      <section className="abx-sec">
        <div className="abx-head">
          <h3>壹 · 三句实话</h3>
          <span>左边一句判断，右边一句括注。三句最稳妥，多了就没劲了</span>
        </div>
        {about.truths.map((t, i) => (
          <div className="abx-row" key={i}>
            <div className="abx-num">{String(i + 1).padStart(2, '0')}</div>
            <label className="grow">
              判断
              <textarea value={t.title} onChange={(e) => rowPatch('truths', i, { title: e.target.value })} style={{ minHeight: 52 }} />
            </label>
            <label className="grow">
              括注
              <textarea value={t.note} onChange={(e) => rowPatch('truths', i, { note: e.target.value })} style={{ minHeight: 52 }} />
            </label>
            <RowTools k="truths" i={i} n={about.truths.length} />
          </div>
        ))}
        <button type="button" className="abx-add" onClick={() => addRow('truths', { title: '', note: '' })}>
          + 加一句
        </button>
      </section>

      {/* ---------- 此刻在做 ---------- */}
      <section className="abx-sec">
        <div className="abx-head">
          <h3>贰 · 此刻在做</h3>
          <span>「在做的事 / 更新节奏 / 常用工具」三张数字卡片的文字，在站点设置里改</span>
        </div>
        {about.now.map((n, i) => (
          <div className="abx-row" key={i}>
            <div className="abx-num">#{i + 1}</div>
            <label>
              事项
              <input value={n.name} onChange={(e) => rowPatch('now', i, { name: e.target.value })} />
            </label>
            <label>
              状态
              <input value={n.state} onChange={(e) => rowPatch('now', i, { state: e.target.value })} placeholder="推进中 / 想起就写" />
            </label>
            <label className="grow">
              一句现状
              <input value={n.note} onChange={(e) => rowPatch('now', i, { note: e.target.value })} />
            </label>
            <RowTools k="now" i={i} n={about.now.length} />
          </div>
        ))}
        <button type="button" className="abx-add" onClick={() => addRow('now', { name: '', state: '', note: '' })}>
          + 加一件
        </button>
      </section>

      {/* ---------- 技能 ---------- */}
      <section className="abx-sec">
        <div className="abx-head">
          <h3>叁 · 手上这些工具</h3>
          <span>标签用「、」隔开；色系跟着分组类型走</span>
        </div>
        {about.skills.map((s, i) => (
          <div className="abx-row" key={i}>
            <label>
              分组
              <input value={s.group} onChange={(e) => rowPatch('skills', i, { group: e.target.value })} />
            </label>
            <label>
              色系
              <select value={s.type} onChange={(e) => rowPatch('skills', i, { type: e.target.value })}>
                <option value="backend">后端（墨绿）</option>
                <option value="frontend">前端（蓝）</option>
                <option value="database">数据（土黄）</option>
                <option value="tool">工具（紫）</option>
              </select>
            </label>
            <label className="grow">
              一句用处
              <input value={s.note} onChange={(e) => rowPatch('skills', i, { note: e.target.value })} />
            </label>
            <label className="grow">
              标签
              <input
                value={toText(s.items)}
                onChange={(e) => rowPatch('skills', i, { items: toList(e.target.value) })}
                placeholder="Python、FastAPI"
              />
            </label>
            <RowTools k="skills" i={i} n={about.skills.length} />
          </div>
        ))}
        <button type="button" className="abx-add" onClick={() => addRow('skills', { group: '', type: 'backend', note: '', items: [] })}>
          + 加一组
        </button>
      </section>

      {/* ---------- 玩什么 ---------- */}
      <section className="abx-sec">
        <div className="abx-head">
          <h3>肆 · 玩什么</h3>
          <span>「大卡」占两张小卡的宽度，一般给花时间最多的两个</span>
        </div>
        <label>
          这一段的小字说明
          <input value={about.playNote} onChange={(e) => patch('playNote', e.target.value)} />
        </label>
        {about.plays.map((p, i) => (
          <div className="abx-play" key={i}>
            <ImageField value={p.img} onChange={(url) => rowPatch('plays', i, { img: url })} />
            <div className="abx-play-body">
              <div className="abx-row">
                <label>
                  名称
                  <input value={p.name} onChange={(e) => rowPatch('plays', i, { name: e.target.value })} />
                </label>
                <label className="grow">
                  副标题
                  <input value={p.desc} onChange={(e) => rowPatch('plays', i, { desc: e.target.value })} />
                </label>
                <label className="abx-check">
                  <input
                    type="checkbox"
                    checked={p.big}
                    onChange={(e) => rowPatch('plays', i, { big: e.target.checked })}
                  />
                  大卡
                </label>
                <RowTools k="plays" i={i} n={about.plays.length} />
              </div>
              <label>
                一句为什么玩
                <input value={p.quote} onChange={(e) => rowPatch('plays', i, { quote: e.target.value })} />
              </label>
              <label>
                图片地址
                <input value={p.img} onChange={(e) => rowPatch('plays', i, { img: e.target.value })} placeholder="/games/wangzhe.webp" />
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="abx-add"
          onClick={() => addRow('plays', { name: '', desc: '', quote: '', img: '', big: false })}
        >
          + 加一张卡
        </button>
      </section>

      {/* ---------- 来路 ---------- */}
      <section className="abx-sec">
        <div className="abx-head">
          <h3>伍 · 来路</h3>
          <span>时间线，最后一句写当时的心境</span>
        </div>
        {about.timeline.map((t, i) => (
          <div className="abx-row" key={i}>
            <label>
              时间
              <input value={t.time} onChange={(e) => rowPatch('timeline', i, { time: e.target.value })} placeholder="2025.06" />
            </label>
            <label>
              标题
              <input value={t.title} onChange={(e) => rowPatch('timeline', i, { title: e.target.value })} />
            </label>
            <label className="grow">
              副标题
              <input value={t.desc} onChange={(e) => rowPatch('timeline', i, { desc: e.target.value })} />
            </label>
            <label className="grow">
              旁白
              <input value={t.note} onChange={(e) => rowPatch('timeline', i, { note: e.target.value })} />
            </label>
            <RowTools k="timeline" i={i} n={about.timeline.length} />
          </div>
        ))}
        <button type="button" className="abx-add" onClick={() => addRow('timeline', { time: '', title: '', desc: '', note: '' })}>
          + 加一个节点
        </button>
      </section>

      {/* ---------- 听什么看什么 ---------- */}
      <section className="abx-sec">
        <div className="abx-head">
          <h3>陆 · 听什么，看什么</h3>
          <span>两栏，标签用「、」隔开</span>
        </div>
        {about.listens.map((l, i) => (
          <div className="abx-row" key={i}>
            <label>
              小标题
              <input value={l.cat} onChange={(e) => rowPatch('listens', i, { cat: e.target.value })} />
            </label>
            <label className="grow">
              内容
              <input
                value={toText(l.items)}
                onChange={(e) => rowPatch('listens', i, { items: toList(e.target.value) })}
              />
            </label>
            <RowTools k="listens" i={i} n={about.listens.length} />
          </div>
        ))}
        <button type="button" className="abx-add" onClick={() => addRow('listens', { cat: '', items: [] })}>
          + 加一栏
        </button>
        <label>
          底下那段话
          <textarea value={about.listenNote} onChange={(e) => patch('listenNote', e.target.value)} style={{ minHeight: 80 }} />
        </label>
      </section>

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="admin-actions sticky-save">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存关于页'}
        </button>
        <a className="admin-btn" href="/about" target="_blank" rel="noopener">
          看效果
        </a>
      </div>
    </form>
  );
}
