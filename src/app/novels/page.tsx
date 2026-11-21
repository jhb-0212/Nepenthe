import Link from 'next/link';
import type { Metadata } from 'next';
import { listNovels, fmtDate } from '@/lib/content';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.novels.title, description: pages.novels.lead };
}

export default async function NovelsPage() {
  const [works, pages] = await Promise.all([listNovels(), getPages()]);

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <h1>
            <span className="kicker">{pages.novels.kicker}</span>{pages.novels.title}
          </h1>
          <p>{pages.novels.lead}</p>
        </div>

        <div className={works.length ? 'scroll-panel novels-scroll' : undefined}>
          <div className="novel-grid">
            {works.map((w) => (
              <Link key={w.id} className="novel-card" href={`/novels/${w.slug}`}>
                <span className="novel-status">{w.status}</span>
                <h2 className="novel-title">{w.title}</h2>
                {w.subtitle ? <span className="novel-sub">{w.subtitle}</span> : null}
                <p className="novel-sum">{w.summary}</p>
                <span className="novel-meta">
                  {w._count.chapters} 章 · 最近更新 {fmtDate(w.updated)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {pages.novels.note ? <p className="plain-note">{pages.novels.note}</p> : null}
      </div>
    </div>
  );
}
