import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostWithNeighbors, fmtDate } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPostWithNeighbors(slug);
  if (!data) return { title: '文章不存在' };
  return {
    title: data.post.title,
    description: data.post.summary,
    openGraph: { type: 'article', publishedTime: data.post.date.toISOString(), tags: [data.post.tag] },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const data = await getPostWithNeighbors(slug);
  if (!data) notFound();

  const { post, newer, older } = data;
  const html = await renderMarkdown(post.body);

  return (
    <article className="article">
      <div className="wrap">
        <Link className="back" href="/writing">
          <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M19 12H6M11 6l-6 6 6 6" />
          </svg>
          回到文章
        </Link>
        <div className="article-top">
          <h1>{post.title}</h1>
          <div className="art-meta">
            <span className="tag">{post.tag}</span>
            <span>{fmtDate(post.date)}</span>
            <span>{post.readTime}</span>
          </div>
        </div>
        <div className="art-body drop" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="pager">
          {newer ? (
            <Link href={`/writing/${newer.slug}`}>
              <span>更新的一篇</span>
              <b>{newer.title}</b>
            </Link>
          ) : (
            <div className="disabled">
              <span>更新的一篇</span>
              <b>已经是第一篇</b>
            </div>
          )}
          {older ? (
            <Link href={`/writing/${older.slug}`}>
              <span>更早的一篇</span>
              <b>{older.title}</b>
            </Link>
          ) : (
            <div className="disabled">
              <span>更早的一篇</span>
              <b>到底了</b>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
