'use client';

import { useEffect, useRef, useState } from 'react';
import { fmtTime, isQQ, trackLink, usePlayer } from './PlayerProvider';

type LyricLine = { t: number; text: string };

const pad = (n: number) => String(n).padStart(2, '0');

const STAMP = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

/** 解析 LRC：一行可能带多个时间戳，按时间排序；[ti:] 这类纯文字行自然被跳过 */
function parseLrc(raw: string): LyricLine[] {
  const out: LyricLine[] = [];
  for (const row of raw.split(/\r?\n/)) {
    STAMP.lastIndex = 0;
    const text = row.replace(STAMP, '').trim();
    if (!text) continue;
    STAMP.lastIndex = 0;
    const stamps: number[] = [];
    let m: RegExpExecArray | null = STAMP.exec(row);
    while (m) {
      const frac = m[3] ? Number(`0.${m[3]}`) : 0;
      stamps.push(Number(m[1]) * 60 + Number(m[2]) + frac);
      m = STAMP.exec(row);
    }
    for (const t of stamps) out.push({ t, text });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

export default function MusicStage() {
  const { api, tracks, index, track, playing, loading, cur, dur, clip, err, load, toggle, seek, next, prev } = usePlayer();

  const [lyric, setLyric] = useState<LyricLine[]>([]);
  const [lyricLoading, setLyricLoading] = useState(false);
  const [activeLyric, setActiveLyric] = useState(-1);
  const lyricBox = useRef<HTMLDivElement | null>(null);

  // 换歌就重新取歌词（两家都不用登录）
  useEffect(() => {
    const id = track.id;
    setLyric([]);
    setActiveLyric(-1);
    if (!id) return;
    let alive = true;
    setLyricLoading(true);
    fetch(`${api}${api.includes('?') ? '&' : '?'}type=lrc&id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => {
        if (!alive) return;
        setLyric(parseLrc(text || ''));
      })
      .catch(() => alive && setLyric([]))
      .finally(() => alive && setLyricLoading(false));
    return () => {
      alive = false;
    };
  }, [api, track.id]);

  // 当前唱到哪一句
  useEffect(() => {
    if (!lyric.length) return;
    let idx = -1;
    for (let i = 0; i < lyric.length; i++) {
      if (lyric[i].t <= cur + 0.2) idx = i;
      else break;
    }
    setActiveLyric(idx);
  }, [lyric, cur]);

  // 让当前句停在歌词框中间（只滚动容器）；没播的时候就停在开头
  useEffect(() => {
    const box = lyricBox.current;
    if (!box) return;
    if (!playing || activeLyric < 0) return;
    const el = box.querySelector<HTMLElement>(`[data-i="${activeLyric}"]`);
    if (!el) return;
    box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2), behavior: 'smooth' });
  }, [activeLyric, playing]);

  const ratio = Number.isFinite(dur) && dur > 0 ? cur / dur : 0;
  const seekByEvent = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    if (!Number.isFinite(dur) || dur <= 0) return;
    seek(Math.max(0, Math.min(dur - 0.2, ((clientX - rect.left) / rect.width) * dur)));
  };

  return (
    <>
      <section className={`stage${playing ? ' is-playing' : ''}${loading ? ' is-loading' : ''}`}>
        <span className="stage-art" aria-hidden="true">
          <span className="disc">
            <span className="disc-face">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 5v9.2a3.2 3.2 0 1 1-3.2-3.2" />
                <path d="M15 5c.5 2.2 2 3.5 3.6 3.8" />
              </svg>
            </span>
          </span>
        </span>

        <div className="stage-main">
          <p className="stage-kick">
            正在听 · <b>{pad(index + 1)}</b> / <span>{pad(tracks.length)}</span>
          </p>
          <h2 className="stage-name">{track.name}</h2>
          <p className="stage-artist">{track.artist}</p>
          <p className="stage-why">{err || track.why || ''}</p>

          <div className="stage-time">
            <span>{fmtTime(cur)}</span>
            <button
              className="stage-bar"
              type="button"
              aria-label="播放进度，点一下跳过去"
              onClick={(e) => seekByEvent(e.clientX, e.currentTarget)}
            >
              <i style={{ width: `${ratio * 100}%` }} />
            </button>
            <span>{fmtTime(dur)}</span>
            <span className="stage-clip" hidden={!clip} title="没配会员 cookie，这里放的是 30 秒公开试听片段">
              试听 · 30 秒
            </span>
          </div>

          <div className="stage-actions">
            <button className="stage-step" type="button" aria-label="上一首" onClick={prev}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M7 6v12M18 6l-8 6 8 6z" />
              </svg>
            </button>
            <button className="stage-big" type="button" aria-label={playing ? '暂停' : '播放'} aria-pressed={playing} onClick={toggle}>
              <svg className="i-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M8 6l9 6-9 6z" />
              </svg>
              <svg className="i-pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M9 6v12M15 6v12" />
              </svg>
            </button>
            <button className="stage-step" type="button" aria-label="下一首" onClick={next}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M17 6v12M6 6l8 6-8 6z" />
              </svg>
            </button>
            <a className="stage-out" href={trackLink(track.id)} target="_blank" rel="noopener">
              {isQQ(track.id) ? 'QQ 音乐 ↗' : '网易云音乐 ↗'}
            </a>
          </div>
        </div>
      </section>

      <div className="music-cols">
        <section className="lyrics">
          <div className="lyrics-head">
            <span className="kicker">LYRICS</span>
            <h3>歌词</h3>
            <span className="lyrics-src">{isQQ(track.id) ? 'QQ 音乐' : '网易云音乐'}</span>
          </div>
          {lyric.length ? (
            <div className="lyrics-body" ref={lyricBox}>
              {lyric.map((l, i) => (
                <button
                  key={`${l.t}-${i}`}
                  type="button"
                  data-i={i}
                  className={`lyric-line${i === activeLyric ? ' is-on' : ''}${i < activeLyric ? ' is-past' : ''}`}
                  onClick={() => seek(l.t)}
                  title="点这一句跳过去"
                >
                  {l.text}
                </button>
              ))}
            </div>
          ) : (
            <p className="lyrics-empty">{lyricLoading ? '歌词正在来…' : '这首没有歌词，或者接口只给了占位文本。'}</p>
          )}
        </section>

        <div className="mpanel is-on">
          <div className="lyrics-head">
            <span className="kicker">SETLIST</span>
            <h3>曲目</h3>
            <span className="lyrics-src">{tracks.length} 首</span>
          </div>
          <ul className="tracks">
            {tracks.map((t, i) => (
              <li key={`${t.id}-${i}`}>
                <button
                  className={`track${i === index ? ' is-on' : ''}`}
                  type="button"
                  aria-current={i === index ? 'true' : 'false'}
                  onClick={() => load(i, true)}
                >
                  <span className="no">{pad(i + 1)}</span>
                  <span className="nm">
                    {t.name}
                    <small>{t.artist}</small>
                  </span>
                  <span className="why">{t.why}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mpanel-note">点一条就换上面那张卡，直接开播；换页面也不停，回首页还是这一首。</p>
        </div>
      </div>
    </>
  );
}
