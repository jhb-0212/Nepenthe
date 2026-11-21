'use client';

// 首页那张 Now Playing 卡。不自己拿 <audio>，读的是根布局里那台全局播放器，
// 所以点这里放歌、跳到 /music 也是同一首、同一个进度。

import Link from 'next/link';
import { usePlayer } from './PlayerProvider';

export default function NowPlaying() {
  const { tracks, track, playing, loading, clip, cur, dur, err, toggle, next, prev } = usePlayer();

  const ratio = Number.isFinite(dur) && dur > 0 ? cur / dur : 0;

  return (
    <div className={`hcard mu${playing ? ' is-playing' : ''}${loading ? ' is-loading' : ''}`} data-mu>
      <div className="mu-top">
        <span>NOW PLAYING</span>
        <span>歌单 · {tracks.length} 首</span>
      </div>

      <Link className="mu-body mu-hit" href="/music" aria-label={`去音乐页，现在在听《${track.name}》`}>
        <span className="mu-disc" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M15 5v9.2a3.2 3.2 0 1 1-3.2-3.2" />
            <path d="M15 5c.5 2.2 2 3.5 3.6 3.8" />
          </svg>
        </span>
        <span className="mu-txt">
          <b>{track.name}</b>
          <span>{track.artist}</span>
          <i className="mu-clip" hidden={!clip} title="没配会员 cookie，这里放的是 30 秒公开试听片段">
            试听
          </i>
        </span>
      </Link>

      <span className="mu-why">{err || track.why || ''}</span>

      <div className="mu-go">
        <button className="mu-btn" type="button" aria-label="上一首" onClick={prev}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M7 6v12M18 6l-8 6 8 6z" />
          </svg>
        </button>
        <button className="mu-btn mu-btn-play" type="button" aria-label={playing ? '暂停' : '播放'} aria-pressed={playing} onClick={toggle}>
          <svg className="i-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M8 6l9 6-9 6z" />
          </svg>
          <svg className="i-pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M9 6v12M15 6v12" />
          </svg>
        </button>
        <button className="mu-btn" type="button" aria-label="下一首" onClick={next}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M17 6v12M6 6l8 6-8 6z" />
          </svg>
        </button>
        <span className="mu-track" aria-hidden="true">
          <i style={{ width: `${Math.round(ratio * 1000) / 10}%` }} />
        </span>
      </div>


    </div>
  );
}
