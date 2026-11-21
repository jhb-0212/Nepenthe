import Link from 'next/link';
import type { Metadata } from 'next';
import { listPosts, fmtDate } from '@/lib/content';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.writing.title, description: pages.writing.lead };
}

export default async function WritingPage() {
  const [posts, pages] = await Promise.all([listPosts(), getPages()]);
  const groups: { year: number; items: typeof posts }[] = [];
  for (const post of posts) {
    const y = post.date.getUTCFullYear();
    const last = groups[groups.length - 1];
    if (last && last.year === y) last.items.push(post);
    else groups.push({ year: y, items: [post] });
  }

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <h1>
            <span className="kicker">{pages.writing.kicker}</span>{pages.writing.title}
          </h1>
          <p>{pages.writing.lead}</p>
        </div>

        <div className={posts.length ? 'scroll-panel posts-scroll' : undefined}>
          {groups.map((g) => (
            <div key={g.year}>
              <div className="year-mark">
                <span>{g.year}</span>
                <i />
                <span>{g.items.length} 篇</span>
              </div>
              <ul className="posts">
                {g.items.map((post) => (
                  <li key={post.id}>
                    <Link className="post-row" href={`/writing/${post.slug}`}>
                      <span className="post-meta">
                        <span className="tag">{post.tag}</span>
                        <span>{fmtDate(post.date)}</span>
                        <span>{post.readTime}</span>
                      </span>
                      <span className="post-title">{post.title}</span>
                      <p className="post-sum">{post.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {posts.length === 0 && pages.writing.note ? <p className="plain-note">{pages.writing.note}</p> : null}
      </div>
    </div>
  );
}
