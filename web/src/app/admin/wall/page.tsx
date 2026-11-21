import Link from 'next/link';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { moderateMessage } from '@/actions/message';

export const metadata = { title: '留言审核' };

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

export default async function AdminWallPage() {
  await guard();

  const [pending, publiced, hidden, stats] = await Promise.all([
    prisma.message.findMany({
      where: { approved: false, hidden: false },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.message.findMany({
      where: { approved: true, hidden: false },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    prisma.message.findMany({ where: { hidden: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.message.count(),
  ]);

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>留言审核</h1>
          <small>
            待审 {pending.length} · 已上墙 {publiced.length} · 已下架 {hidden.length} · 累计 {stats}
          </small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" href="/wall" target="_blank">
            看留言墙
          </Link>
          <Link className="admin-btn" href="/admin">
            回后台
          </Link>
        </div>
      </div>

      <h2 style={{ fontSize: 16, margin: '26px 0 8px' }}>待审</h2>
      {pending.length === 0 ? (
        <p style={{ color: 'var(--faint)', fontSize: 13 }}>没有待审留言。</p>
      ) : (
        <ul className="wall-admin-list">
          {pending.map((m) => (
            <li key={m.id} className="wall-admin-item pending">
              <div className="wall-admin-head">
                <b>{m.name || '佚名'}</b>
                <em>
                  {fmt(m.createdAt)} · {m.ua || '未知'} · {m.ipHash.slice(0, 8)}
                </em>
              </div>
              <p className="wall-admin-body">{m.body}</p>
              <div className="wall-admin-actions">
                <form action={moderateMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="op" value="approve" />
                  <button className="admin-btn primary" type="submit">
                    通过
                  </button>
                </form>
                <form action={moderateMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="op" value="hide" />
                  <button className="admin-btn danger" type="submit">
                    下架
                  </button>
                </form>
                <form action={moderateMessage} className="note-form">
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="op" value="note" />
                  <input name="note" defaultValue={m.note} placeholder="备注（只有你能看到）" maxLength={200} />
                  <button className="admin-btn" type="submit">
                    存备注
                  </button>
                </form>
              </div>
              {m.note ? <small className="wall-note">备注：{m.note}</small> : null}
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 16, margin: '30px 0 8px' }}>已上墙</h2>
      {publiced.length === 0 ? (
        <p style={{ color: 'var(--faint)', fontSize: 13 }}>还没有通过的留言。</p>
      ) : (
        <ul className="wall-admin-list">
          {publiced.map((m) => (
            <li key={m.id} className="wall-admin-item">
              <div className="wall-admin-head">
                <b>{m.name || '佚名'}</b>
                <em>{fmt(m.createdAt)}</em>
              </div>
              <p className="wall-admin-body">{m.body}</p>
              <div className="wall-admin-actions">
                <form action={moderateMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="op" value="hide" />
                  <button className="admin-btn danger" type="submit">
                    下架
                  </button>
                </form>
                <form action={moderateMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="op" value="delete" />
                  <button className="admin-btn danger" type="submit">
                    彻底删除
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hidden.length ? (
        <>
          <h2 style={{ fontSize: 16, margin: '30px 0 8px' }}>已下架（软删，留着对证）</h2>
          <ul className="wall-admin-list">
            {hidden.map((m) => (
              <li key={m.id} className="wall-admin-item muted">
                <div className="wall-admin-head">
                  <b>{m.name || '佚名'}</b>
                  <em>{fmt(m.createdAt)}</em>
                </div>
                <p className="wall-admin-body">{m.body}</p>
                <div className="wall-admin-actions">
                  <form action={moderateMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="op" value="restore" />
                    <button className="admin-btn" type="submit">
                      放回待审
                    </button>
                  </form>
                  <form action={moderateMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="op" value="delete" />
                    <button className="admin-btn danger" type="submit">
                      彻底删除
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
