import Link from 'next/link';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import TrackForm from '@/components/TrackForm';
import { deleteTrack } from '@/actions/music';

export const metadata = { title: '曲目管理' };

export default async function AdminMusicPage() {
  await guard();
  const tracks = await prisma.track.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] });

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>曲目</h1>
          <small>
            {tracks.length} 首 · 播放走 /api/music 代理，没配 NETEASE_COOKIE 时只有试听
          </small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" href="/music" target="_blank">
            看音乐页
          </Link>
          </div>
      </div>

      <p style={{ color: 'var(--faint)', fontSize: 12.5, marginTop: 14 }}>
        在网易云网页版打开歌曲，地址栏里 <code>id=</code> 后面那串数字就是。
      </p>

      <ul className="admin-list">
        {tracks.map((t) => (
          <li key={t.id}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--panel)' }}>
              <span>
                {t.name}
                {t.artist ? <em> · {t.artist}</em> : null}
              </span>
              <em>
                {t.songId} · {Math.floor(t.dur / 60)}:{String(t.dur % 60).padStart(2, '0')}
              </em>
            </span>
            <form action={deleteTrack} style={{ margin: '6px 0 10px' }}>
              <input type="hidden" name="id" value={t.id} />
              <button className="admin-btn danger" type="submit">
                删除
              </button>
            </form>
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--faint)' }}>修改这首</summary>
              <TrackForm track={{ id: t.id, songId: t.songId, name: t.name, artist: t.artist, dur: t.dur, why: t.why, sort: t.sort }} />
            </details>
          </li>
        ))}
      </ul>

      <section className="version-box">
        <h2>加一首</h2>
        <TrackForm track={null} />
      </section>
    </div>
  );
}
