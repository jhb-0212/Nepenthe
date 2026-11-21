import Hero from '@/components/Hero';
import NowPlaying from '@/components/NowPlaying';
import LiveReaders from '@/components/LiveReaders';
import CardScene from '@/components/CardScene';
import Link from 'next/link';
import { getHomeData, fmtDate, listDoings } from '@/lib/content';
import { getSite, isAbsoluteUrl } from '@/lib/site';

const DEFAULT_SCENE = '/hero-bg.jpg';

export default async function HomePage() {
  const [site, data, doings] = await Promise.all([getSite(), getHomeData(), listDoings()]);

  const { posts, notes, photos, newest, latestNotes } = data;
  const latest = newest[0];
  const rest = newest.slice(1, 3);

  const c = site.contact;
  const ghUrl = c.github ? (isAbsoluteUrl(c.github) ? c.github : `https://github.com/${c.github.replace(/^@/, '')}`) : '';
  const ghLabel = c.github ? (isAbsoluteUrl(c.github) ? c.github.replace(/^https?:\/\//, '').replace(/\/$/, '') : `@${c.github.replace(/^@/, '')}`) : '';
  const dyUrl = c.douyin ? (isAbsoluteUrl(c.douyin) ? c.douyin : `https://www.douyin.com/search/${encodeURIComponent(c.douyin)}`) : '';

  const quotes = [
    { text: '星光不问赶路人，时光不负有心人。', from: '佚名' },
    { text: '既然选择了远方，便只顾风雨兼程。', from: '汪国真' },
    { text: '把一件事讲清楚，比算对一个数难。', from: site.name },
    { text: '山脚太挤了，我们山顶见。', from: '写给后来的人' },
  ];
  const phrases = ['闲来无事，坐看云起', '这里允许有过程', '日更是逼自己讲清楚'];


  return (
    <>
      <Hero name={site.name} quotes={quotes} phrases={phrases} />

      <div className="wrap" id="down">
        <Link className="search-band" href="/search" data-search-entry>
          <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
          <span>搜文章、随记、小说里的句子</span>
          <kbd>/</kbd>
        </Link>
        <LiveReaders />
      </div>

      <div className="wrap home-cards">
        <article className="hcard pf">
          <div className="pf-head">
            <div className="pf-face" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/avatar.png" alt="忘忧居头像" />
            </div>
            <div className="pf-id">
              <h2>{site.name}</h2>
              <span className="pf-en">{site.en}</span>
              <p className="pf-one">{site.intro}</p>
            </div>
          </div>

          <div className="pf-bio">
            {site.bio.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="pf-foot">
            <Link className="pf-num" href="/writing">
              <b>{posts.length}</b>
              <span>文章</span>
            </Link>
            <Link className="pf-num" href="/notes">
              <b>{notes.length}</b>
              <span>随记</span>
            </Link>
            <Link className="pf-num" href="/gallery">
              <b>{photos}</b>
              <span>照片</span>
            </Link>

            <div className="pf-icons">
              {ghUrl ? (
                <a className="pf-icon-btn" href={ghUrl} target="_blank" rel="noopener" title={`GitHub ${ghLabel}`}>
                  <svg className="gh-mark" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                    <path d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436c.55.096.756-.233.756-.522c0-.262-.013-1.128-.013-2.049c-2.764.509-3.479-.674-3.699-1.292c-.124-.317-.66-1.293-1.127-1.554c-.385-.207-.936-.715-.014-.729c.866-.014 1.485.797 1.691 1.128c.99 1.663 2.571 1.196 3.204.907c.096-.715.385-1.196.701-1.471c-2.448-.275-5.005-1.224-5.005-5.432c0-1.196.426-2.186 1.128-2.956c-.111-.275-.496-1.402.11-2.915c0 0 .921-.288 3.024 1.128a10.2 10.2 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371c2.104-1.43 3.025-1.128 3.025-1.128c.605 1.513.221 2.64.111 2.915c.701.77 1.127 1.747 1.127 2.956c0 4.222-2.571 5.157-5.019 5.432c.399.344.743 1.004.743 2.035c0 1.471-.014 2.654-.014 3.025c0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11" />
                  </svg>
                  <span className="sr">GitHub</span>
                </a>
              ) : (
                <button className="pf-icon-btn is-todo" type="button" data-todo="GitHub 还没填：后台「站点」页填 contact.github" title="GitHub 待接入">
                  <svg className="gh-mark" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                    <path d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436c.55.096.756-.233.756-.522c0-.262-.013-1.128-.013-2.049c-2.764.509-3.479-.674-3.699-1.292c-.124-.317-.66-1.293-1.127-1.554c-.385-.207-.936-.715-.014-.729c.866-.014 1.485.797 1.691 1.128c.99 1.663 2.571 1.196 3.204.907c.096-.715.385-1.196.701-1.471c-2.448-.275-5.005-1.224-5.005-5.432c0-1.196.426-2.186 1.128-2.956c-.111-.275-.496-1.402.11-2.915c0 0 .921-.288 3.024 1.128a10.2 10.2 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371c2.104-1.43 3.025-1.128 3.025-1.128c.605 1.513.221 2.64.111 2.915c.701.77 1.127 1.747 1.127 2.956c0 4.222-2.571 5.157-5.019 5.432c.399.344.743 1.004.743 2.035c0 1.471-.014 2.654-.014 3.025c0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11" />
                  </svg>
                  <span className="sr">GitHub</span>
                </button>
              )}
              {c.email ? (
                <a className="pf-icon-btn" href={`mailto:${c.email}`} title={`写信：${c.email}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <rect x="3.5" y="6" width="17" height="12" rx="2" />
                    <path d="M4.5 8l7.5 5.2 7.5-5.2" />
                  </svg>
                  <span className="sr">邮箱</span>
                </a>
              ) : null}
              {c.wechatId ? (
                <button className="pf-icon-btn" type="button" data-copy={c.wechatId} title={`复制微信：${c.wechatId}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M5.5 5h10a3 3 0 0 1 3 3v4.5a3 3 0 0 1-3 3H10l-4.5 3.5V15.5h-.5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" />
                  </svg>
                  <span className="sr">微信</span>
                </button>
              ) : null}
              {dyUrl ? (
                <a className="pf-icon-btn" href={dyUrl} target="_blank" rel="noopener" title={`抖音 ${c.douyin}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M14 4v9.5a3.4 3.4 0 1 1-3.4-3.4" />
                    <path d="M14 4c.5 2.4 2.2 3.9 4 4.2" />
                  </svg>
                  <span className="sr">抖音</span>
                </a>
              ) : null}
            </div>
          </div>

          {c.wechatQr ? (
            <a className="pf-qr" href={c.wechatQr} target="_blank" rel="noopener">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.wechatQr} alt="微信二维码" width={104} height={104} loading="lazy" />
              <span>微信二维码 · 点开放大</span>
            </a>
          ) : null}
        </article>

        <NowPlaying />
      </div>

      <section className="wall-sec">
        <div className="wrap">
          <div className="wall-head">
            <span>最新</span>
            <Link className="sec-link" href="/archive">
              翻归档
              <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="wall">
            {latest ? (
              <Link className="wc wc-big" href={`/writing/${latest.slug}`}>
                <CardScene src={latest.cover ?? DEFAULT_SCENE} alt={latest.title} />
                <span className="wc-meta">
                  <span>{latest.tag}</span>
                  <span>{fmtDate(latest.date)}</span>
                  <span>{latest.readTime}</span>
                </span>
                <span className="wc-title">{latest.title}</span>
                <span className="wc-sum">{latest.summary}</span>
              </Link>
            ) : null}

            {rest.map((post) => (
              <Link key={post.id} className="wc" href={`/writing/${post.slug}`}>
                <CardScene src={post.cover ?? DEFAULT_SCENE} alt={post.title} />
                <span className="wc-meta">
                  <span>{post.tag}</span>
                  <span>{fmtDate(post.date)}</span>
                </span>
                <span className="wc-title">{post.title}</span>
                <span className="wc-sum">{post.summary}</span>
              </Link>
            ))}

            {latestNotes.length ? (
              <Link className="wc wc-notes" href="/notes">
                <CardScene src={DEFAULT_SCENE} alt="随记山水" />
                <span className="wc-meta">
                  <span>随记</span>
                  <span>{notes.length} 条</span>
                </span>
                <ul>
                  {latestNotes.map((n) => (
                    <li key={n.id}>
                      <time>{fmtDate(n.date)}</time>
                      <span>{(n.body ?? '').trim().split('\n')[0].replace(/[#>*`]/g, '').slice(0, 40)}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            ) : null}

            <Link className="wc wc-gallery" href="/gallery">
              <CardScene src={DEFAULT_SCENE} alt="相册山水" />
              <span className="wc-meta">
                <span>相册</span>
                <span>{photos} 张</span>
              </span>
              <span className="wc-thumbs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={DEFAULT_SCENE} alt="山景占位" loading="lazy" />
              </span>
              <span className="wc-sum">{photos ? '最近放进去的几张' : '相册还空着，等第一张图'}</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head rise">
            <h2>
              <em>NOW</em>现在在做
            </h2>
            <Link className="sec-link" href="/doing">
              展开看
              <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className="doing-grid rise">
            {doings.map((d) => (
              <article key={d.id} className="doing-card">
                <CardScene src={DEFAULT_SCENE} alt={d.title} />
                <span className="state">{d.state}</span>
                <h3>{d.title}</h3>
                <div className="sub">{d.sub}</div>
                <p className="note">{d.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="cta rise">
            <div className="cta-in">
              <h2>作品集</h2>
              <p>视频、AIGC 实验、文案合集，都在那边。这里留下过程，那里放成品。</p>
              <a
                className="btn btn-primary"
                href={site.portfolioUrl || '#'}
                data-ext="portfolio"
                target={site.portfolioUrl ? '_blank' : undefined}
                rel={site.portfolioUrl ? 'noopener' : undefined}
              >
                过去看看
                <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
