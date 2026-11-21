import type { Metadata } from 'next';
import { listDoings } from '@/lib/content';
import { getSite } from '@/lib/site';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.doing.title, description: pages.doing.lead };
}

export default async function DoingPage() {
  const [site, doings, pages] = await Promise.all([getSite(), listDoings(), getPages()]);

  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <h1>
            <span className="kicker">{pages.doing.kicker}</span>{pages.doing.title}
          </h1>
          <p>{pages.doing.lead}</p>
        </div>

        {pages.doing.sub ? <p className="now-lead">{pages.doing.sub}</p> : null}

        <div className="doing-grid now-grid">
          {doings.map((d) => (
            <article key={d.id} className="doing-card">
              <span className="state">{d.state}</span>
              <h3>{d.title}</h3>
              <div className="sub">{d.sub}</div>
              <p className="note">{d.noteLong || d.note}</p>
            </article>
          ))}
        </div>

        <div className="facts">
          {site.facts.map((f) => (
            <div key={f.k} className="fact">
              <em>{f.k}</em>
              <b>{f.v}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
