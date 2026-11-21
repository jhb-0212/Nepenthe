'use client';

import { useActionState } from 'react';
import { saveTrack, type TrackState } from '@/actions/music';

type Track = { id: number; songId: string; name: string; artist: string; dur: number; why: string; sort: number } | null;

export default function TrackForm({ track }: { track: Track }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(saveTrack, {});

  return (
    <form className="admin-form" action={action} style={{ marginTop: 0 }}>
      <input type="hidden" name="id" value={track?.id ?? 0} />
      <div className="admin-row">
        <label>
          歌曲 ID
          <input name="songId" defaultValue={track?.songId ?? ''} placeholder="网易云填数字 / QQ 填 songmid" required />
        </label>
        <label>
          歌名
          <input name="name" defaultValue={track?.name ?? ''} required />
        </label>
        <label>
          歌手
          <input name="artist" defaultValue={track?.artist ?? ''} />
        </label>
        <label>
          时长（秒）
          <input name="dur" type="number" min={0} defaultValue={track?.dur ?? 0} />
        </label>
        <label>
          排序
          <input name="sort" type="number" defaultValue={track?.sort ?? 0} />
        </label>
      </div>
      <label>
        为什么放在这儿
        <input name="why" defaultValue={track?.why ?? ''} placeholder="一句话，别写乐评" />
      </label>

      {state.error ? <div className="admin-banner err">{state.error}</div> : null}
      {state.ok ? <div className="admin-banner ok">{state.message}</div> : null}

      <div className="admin-actions">
        <button className="admin-btn primary" type="submit" disabled={pending}>
          {pending ? '保存中…' : track ? '保存' : '加一首'}
        </button>
      </div>
    </form>
  );
}
