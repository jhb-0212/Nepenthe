import type { Metadata } from 'next';
import { getSite } from '@/lib/site';
import { getAbout } from '@/lib/about';

export const metadata: Metadata = {
  title: '关于我',
  description: '学数学出身，后来发现把一件事讲清楚，比算对一个数难。',
};

const NUM = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];

export default async function AboutPage() {
  const [site, about] = await Promise.all([getSite(), getAbout()]);
  const c = site.contact;

  return (
    <div className="page about-page">
      <div className="wrap">
        {/* ===== 开篇 ===== */}
        <header className="about-hero">
          <div className="about-hero-grid">
            <div className="about-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/avatar.png" alt="头像" />
              <span className="about-seal" aria-hidden="true">
                忘忧
              </span>
            </div>

            <div className="about-hero-text">
              <div className="about-kicker">About · 忘忧居主</div>
              <h1 className="about-h1">{about.headline}</h1>

              <div className="about-bio">
                {site.bio.map((b, i) => (
                  <p key={b} className={i === 0 ? 'about-bio-p about-bio-first' : 'about-bio-p'}>
                    {b}
                  </p>
                ))}
              </div>

              {about.chips.length ? (
                <div className="about-chips">
                  {about.chips.map((chip, i) => (
                    <span className="about-chip" key={`${chip.label}-${i}`}>
                      <b>{chip.label}</b>
                      {chip.text}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="about-sign">— {site.mark}</div>
            </div>
          </div>
        </header>

        {/* ===== 三句实话 ===== */}
        {about.truths.length ? (
          <section className="about-section">
            <div className="ab-head">
              <span className="ab-label">{NUM[0]}</span>
              <h2 className="ab-title">三句实话</h2>
              <span className="ab-rule" />
            </div>
            <div className="truths">
              {about.truths.map((t, i) => (
                <div key={`${t.title}-${i}`} className="truth">
                  <span className="truth-num">{String(i + 1).padStart(2, '0')}</span>
                  <p className="truth-title">{t.title}</p>
                  <p className="truth-note">{t.note}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== 此刻在做 ===== */}
        {about.now.length ? (
          <section className="about-section">
            <div className="ab-head">
              <span className="ab-label">{NUM[1]}</span>
              <h2 className="ab-title">此刻在做</h2>
              <span className="ab-rule" />
            </div>
            <div className="now-list">
              {about.now.map((n, i) => (
                <div key={`${n.name}-${i}`} className="now-item">
                  <div className="now-left">
                    <span className="now-name">{n.name}</span>
                    {n.state ? <span className="now-state">{n.state}</span> : null}
                  </div>
                  <p className="now-note">{n.note}</p>
                </div>
              ))}
            </div>
            {site.facts.length ? (
              <div className="about-meta">
                {site.facts.map((f) => (
                  <span key={f.k}>
                    <em>{f.k}</em>
                    {f.v}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ===== 手上这些工具 ===== */}
        {about.skills.length ? (
          <section className="about-section">
            <div className="ab-head">
              <span className="ab-label">{NUM[2]}</span>
              <h2 className="ab-title">手上这些工具，拿它做什么</h2>
              <span className="ab-rule" />
            </div>
            <div className="skill-list">
              {about.skills.map((s, i) => (
                <div key={`${s.group}-${i}`} className="skill-row" data-type={s.type}>
                  <div className="skill-row-name">{s.group}</div>
                  <div>
                    {s.note ? <p className="skill-row-note">{s.note}</p> : null}
                    <div className="skill-tags">
                      {s.items.map((item) => (
                        <span key={item} className="skill-tag">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== 玩什么 ===== */}
        {about.plays.length ? (
          <section className="about-section">
            <div className="ab-head">
              <span className="ab-label">{NUM[3]}</span>
              <h2 className="ab-title">玩什么</h2>
              <span className="ab-rule" />
            </div>
            {about.playNote ? <p className="ab-note">{about.playNote}</p> : null}
            <div className="play-grid">
              {about.plays.map((g, i) => (
                <div key={`${g.name}-${i}`} className={g.big ? 'play-card play-card-big' : 'play-card'}>
                  {g.img ? (
                    <div className="play-cover">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.img} alt={`${g.name} 配图`} loading="lazy" />
                    </div>
                  ) : null}
                  <div className="play-body">
                    <div className="play-name">{g.name}</div>
                    {g.desc ? <div className="play-desc">{g.desc}</div> : null}
                    {g.quote ? <p className="play-quote">{g.quote}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== 来路 ===== */}
        {about.timeline.length ? (
          <section className="about-section">
            <div className="ab-head">
              <span className="ab-label">{NUM[4]}</span>
              <h2 className="ab-title">来路</h2>
              <span className="ab-rule" />
            </div>
            <div className="timeline">
              {about.timeline.map((t, i) => (
                <div key={`${t.time}-${i}`} className="timeline-item">
                  {t.time ? <div className="timeline-time">{t.time}</div> : null}
                  <div className="timeline-content">
                    <div className="timeline-title">{t.title}</div>
                    {t.desc ? <div className="timeline-desc">{t.desc}</div> : null}
                    {t.note ? <div className="timeline-note">{t.note}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== 听什么看什么 ===== */}
        {about.listens.length ? (
          <section className="about-section">
            <div className="ab-head">
              <span className="ab-label">{NUM[5]}</span>
              <h2 className="ab-title">听什么，看什么</h2>
              <span className="ab-rule" />
            </div>
            <div className="listen-grid">
              {about.listens.map((l, i) => (
                <div key={`${l.cat}-${i}`} className="like-group">
                  <div className="like-cat">{l.cat}</div>
                  <div className="like-items">
                    {l.items.map((item) => (
                      <span key={item} className="like-item">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {about.listenNote ? <p className="listen-note">{about.listenNote}</p> : null}
          </section>
        ) : null}

        {/* ===== 落款 · 找我 ===== */}
        <section className="about-section about-outro">
          <p className="outro-line">
            {about.outro.map((line, i) => (
              <span key={i}>
                {line}
                {i < about.outro.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
          <div className="contact-grid">
            {c.github ? (
              <a className="contact-item" href={`https://github.com/${c.github}`} target="_blank" rel="noopener">
                <span className="contact-label">GitHub</span>
                <span className="contact-value">@{c.github}</span>
              </a>
            ) : null}
            {c.email ? (
              <a className="contact-item" href={`mailto:${c.email}`}>
                <span className="contact-label">邮箱</span>
                <span className="contact-value">{c.email}</span>
              </a>
            ) : null}
            {c.wechatId ? (
              <div className="contact-item" data-copy={c.wechatId} role="button" tabIndex={0}>
                <span className="contact-label">微信</span>
                <span className="contact-value">{c.wechatId}</span>
              </div>
            ) : null}
            {c.douyin ? (
              <div className="contact-item">
                <span className="contact-label">抖音</span>
                <span className="contact-value">{c.douyin}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
