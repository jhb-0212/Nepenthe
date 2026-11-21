import Link from 'next/link';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { fmtDate } from '@/lib/content';
import { deleteNote } from '@/actions/notes';

export const metadata = { title: '随记管理' };

export default async function AdminNotesPage() {
  await guard();
  const notes = await prisma.note.findMany({ orderBy: [{ date: 'desc' }, { id: 'desc' }] });

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>随记</h1>
          <small>共 {notes.length} 条 · 草稿 {notes.filter((n) => n.draft).length} 条</small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn primary" href="/admin/notes/new">
            写一条
          </Link>
          <Link className="admin-btn" href="/admin">
            回后台
          </Link>
        </div>
      </div>

      <ul className="admin-list">
        {notes.map((n) => (
          <li key={n.id}>
            <Link href={`/admin/notes/${n.id}`}>
              <span>
                {n.body.replace(/[#>`*=\[\]]/g, '').slice(0, 46) || '（空）'}
                {n.draft ? <em>（草稿）</em> : null}
              </span>
              <em>
                {n.tag ? `${n.tag} · ` : ''}
                {fmtDate(n.date)}
              </em>
            </Link>
            <form action={deleteNote} style={{ marginTop: 6 }}>
              <input type="hidden" name="id" value={n.id} />
              <button className="admin-btn danger" type="submit">
                删除
              </button>
            </form>
          </li>
        ))}
      </ul>
      {notes.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>还没有随记。</p> : null}
    </div>
  );
}
