import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import MessageForm from '@/components/MessageForm';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.wall.title, description: pages.wall.lead };
}

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

export default async function WallPage() {
  const [messages, pages] = await Promise.all([
    prisma.message.findMany({
    where: { approved: true, hidden: false },
    orderBy: { createdAt: 'desc' },
    take: 60,
      select: { id: true, name: true, body: true, createdAt: true },
    }),
    getPages(),
  ]);

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <h1>
            <span className="kicker">{pages.wall.kicker}</span>{pages.wall.title}
          </h1>
          <p>{pages.wall.lead}</p>
        </div>

        <div className="wall-layout">
          <MessageForm />

          <div className={`wall-list-wrap${messages.length ? ' scroll-panel wall-scroll' : ''}`}>
            {messages.length === 0 ? (
              pages.wall.note ? <p className="plain-note">{pages.wall.note}</p> : null
            ) : (
              <ul className="wall-list">
                {messages.map((m) => (
                  <li className="wall-card" key={m.id}>
                    <p className="wall-body">{m.body}</p>
                    <span className="wall-meta">
                      <b>{m.name || '佚名'}</b>
                      <em>{fmt(m.createdAt)}</em>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
