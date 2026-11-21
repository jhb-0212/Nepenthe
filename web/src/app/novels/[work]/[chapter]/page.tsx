import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getChapter, fmtDate } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';

type Params = { params: Promise<{ work: string; chapter: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { work, chapter } = await params;
  const data = await getChapter(work, chapter);
  if (!data) return { title: '章节不存在' };
  return { title: `${data.chapter.title} · ${data.novel.title}`, description: data.novel.summary };
}

export default async function ChapterPage({ params }: Params) {
  const { work, chapter } = await params;
  const data = await getChapter(work, chapter);
  if (!data) notFound();

  const { novel, chapter: ch, prev, next } = data;
  const html = await renderMarkdown(ch.body);

  return (
    <article className="article">
      <div className="wrap">
        <Link className="back" href={`/novels/${novel.slug}`}>
          <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M19 12H6M11 6l-6 6 6 6" />
          </svg>
          {novel.title}
        </Link>

        <div className="article-top">
          <h1>{ch.title}</h1>
          <div className="art-meta">
            <span className="tag">{novel.title}</span>
            <span>第 {ch.order} 章</span>
            <span>{fmtDate(ch.date)}</span>
          </div>
        </div>

        <div className="art-body" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="pager">
          {prev ? (
            <Link href={`/novels/${novel.slug}/${prev.slug}`}>
              <span>上一章</span>
              <b>{prev.title}</b>
            </Link>
          ) : (
            <div className="disabled">
              <span>上一章</span>
              <b>这是第一章</b>
            </div>
          )}
          {next ? (
            <Link href={`/novels/${novel.slug}/${next.slug}`}>
              <span>下一章</span>
              <b>{next.title}</b>
            </Link>
          ) : (
            <div className="disabled">
              <span>下一章</span>
              <b>还没写到这里</b>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
