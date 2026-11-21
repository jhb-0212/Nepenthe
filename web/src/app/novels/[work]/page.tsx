import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getNovel, fmtDate } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';

type Params = { params: Promise<{ work: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { work } = await params;
  const novel = await getNovel(work);
  if (!novel) return { title: '作品不存在' };
  return { title: novel.title, description: novel.summary };
}

export default async function NovelPage({ params }: Params) {
  const { work } = await params;
  const novel = await getNovel(work);
  if (!novel) notFound();

  const first = novel.chapters[0];
  const body = novel.body ? await renderMarkdown(novel.body) : '';

  return (
    <div className="page">
      <div className="wrap">
        <Link className="back" href="/novels">
          <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M19 12H6M11 6l-6 6 6 6" />
          </svg>
          回到小说
        </Link>

        <div className="work-head">
          <span className="novel-status">{novel.status}</span>
          <h1>{novel.title}</h1>
          {novel.subtitle ? <div className="work-sub">{novel.subtitle}</div> : null}
          <p className="work-sum">{novel.summary}</p>
          <div className="work-meta">
            <span>{novel.chapters.length} 章</span>
            <span>最近更新 {fmtDate(novel.updated)}</span>
            {novel.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
          {first ? (
            <div className="hero-act">
              <Link className="btn btn-primary" href={`/novels/${novel.slug}/${first.slug}`}>
                从第一章读起
              </Link>
            </div>
          ) : null}
        </div>

        <ol className="chap-list scroll-panel chapters-scroll">
          {novel.chapters.map((c, i) => (
            <li key={c.id}>
              <Link className="chap-row" href={`/novels/${novel.slug}/${c.slug}`}>
                <span className="chap-no">{String(i + 1).padStart(2, '0')}</span>
                <span className="chap-title">{c.title}</span>
                <span className="chap-date">{fmtDate(c.date)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {body ? (
        <div className="wrap work-body">
          <div className="art-body" dangerouslySetInnerHTML={{ __html: body }} />
        </div>
      ) : null}
    </div>
  );
}
