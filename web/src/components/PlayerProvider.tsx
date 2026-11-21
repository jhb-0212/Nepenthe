'use client';

// 全站唯一的一台播放器。
// 挂载在根布局里，所以前端路由跳转（首页 → /music → …）时 <audio> 不会被卸载，歌一直放着；
// 首页的 NowPlaying 和音乐页的 MusicStage 都只读这里的状态，点哪边都会同步。

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Track = { id: string; name: string; artist: string; dur?: number; why?: string };

type PlayerApi = {
  api: string;
  tracks: Track[];
  index: number;
  track: Track;
  playing: boolean;
  loading: boolean;
  cur: number;
  dur: number;
  clip: boolean;
  err: string;
  ready: boolean;
  load: (next: number, autoplay?: boolean) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
};

const Ctx = createContext<PlayerApi | null>(null);

export function usePlayer(): PlayerApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlayer 必须在 PlayerProvider 里使用');
  return ctx;
}

const EMPTY: Track = { id: '', name: '还没有曲目', artist: '', why: '' };

/** 纯数字是网易云 id，字母数字混排是 QQ 音乐 songmid */
export const isQQ = (id: string) => Boolean(id) && !/^\d+$/.test(id);

export const trackLink = (id: string) =>
  isQQ(id) ? `https://y.qq.com/n/ryqq/songDetail/${id}` : `https://music.163.com/#/song?id=${id}`;

export const fmtTime = (sec: number) => {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
};

export default function PlayerProvider({
  api,
  playlistId,
  tracks: initial,
  children,
}: {
  api: string;
  playlistId: string;
  tracks: Track[];
  children: React.ReactNode;
}) {
  const [tracks, setTracks] = useState<Track[]>(initial);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [clip, setClip] = useState(false);
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);
  const tracksRef = useRef<Track[]>(initial);

  indexRef.current = index;
  tracksRef.current = tracks;

  // 后台手填的曲目优先；一条都没有时才去拉歌单
  useEffect(() => {
    if (initial.length > 0 || !playlistId) return;
    let alive = true;
    fetch(`${api}${api.includes('?') ? '&' : '?'}type=playlist&id=${encodeURIComponent(playlistId)}`)
      .then((r) => r.json())
      .then((list: { name?: string; artist?: string; url?: string }[]) => {
        if (!alive || !Array.isArray(list) || !list.length) return;
        setTracks(
          list.map((s, i) => {
            const m = s.url?.match(/id=([^&]+)/);
            return { id: m ? m[1] : `song-${i}`, name: s.name || '未知歌曲', artist: s.artist || '未知艺术家', dur: 300, why: '网易云歌单' };
          }),
        );
        setIndex(0);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [api, initial.length, playlistId]);

  const load = useCallback(
    (next: number, autoplay = true) => {
      const audio = audioRef.current;
      const list = tracksRef.current;
      if (!audio || !list.length) return;
      const i = ((next % list.length) + list.length) % list.length;
      setIndex(i);
      setErr('');
      setCur(0);
      setDur(0);
      setClip(false);
      // 名字和歌手一起带上：没配 cookie 时后端要拿它去查 30 秒试听
      const params = new URLSearchParams({ type: 'url', id: list[i].id });
      if (list[i].name) params.set('name', list[i].name);
      if (list[i].artist) params.set('artist', list[i].artist);
      audio.src = `${api}${api.includes('?') ? '&' : '?'}${params.toString()}`;
      if (autoplay) {
        audio.play().catch(() => setErr('这首没拿到音频，点链接去音乐软件里听'));
      }
    },
    [api],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) {
      load(indexRef.current, true);
      return;
    }
    if (audio.paused) audio.play().catch(() => setErr('播放被浏览器拦了，再点一次'));
    else audio.pause();
  }, [load]);

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, t);
    if (audio.paused) audio.play().catch(() => undefined);
  }, []);

  // 事件只注册一次，内部用 ref 读最新的 index / tracks
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setReady(true);

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onMeta = () => setDur(audio.duration);
    const onTime = () => {
      setCur(audio.currentTime);
      setDur(audio.duration);
      const whole = tracksRef.current[indexRef.current]?.dur;
      setClip(Boolean(whole && Number.isFinite(audio.duration) && audio.duration > 0 && audio.duration + 8 < whole));
    };
    const onEnd = () => load(indexRef.current + 1, true);
    const onError = () => {
      const id = tracksRef.current[indexRef.current]?.id || '';
      setErr(isQQ(id) ? '这首的音频没拿到：QQ 音乐需要在 .env 里配 QQ_COOKIE' : '这首的音频没拿到，点链接去音乐软件里听');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
    };
  }, [load]);

  // 切到后台标签页时浏览器可能把播放器挂起，回到前台重新同步一次时间
  useEffect(() => {
    const onVisible = () => {
      const audio = audioRef.current;
      if (!audio) return;
      setPlaying(!audio.paused);
      setCur(audio.currentTime);
      setDur(audio.duration);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const track = tracks[index] ?? tracks[0] ?? EMPTY;

  const value = useMemo<PlayerApi>(
    () => ({
      api,
      tracks,
      index,
      track,
      playing,
      loading,
      cur,
      dur,
      clip,
      err,
      ready,
      load,
      toggle,
      next: () => load(index + 1, true),
      prev: () => load(index - 1, true),
      seek,
    }),
    [api, tracks, index, track, playing, loading, cur, dur, clip, err, ready, load, toggle, seek],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="none" />
    </Ctx.Provider>
  );
}
