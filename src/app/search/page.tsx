import type { Metadata } from 'next';
import SearchPanel from '@/components/SearchPanel';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.search.title, description: pages.search.lead };
}

export default async function SearchPage() {
  const pages = await getPages();
  return (
    <div className="page search-page">
      <div className="wrap">
        <div className="page-head">
          <h1>
            <span className="kicker">{pages.search.kicker}</span>{pages.search.title}
          </h1>
          <p>{pages.search.lead}</p>
        </div>

        <SearchPanel />

        {pages.search.note ? <p className="plain-note">{pages.search.note}</p> : null}
      </div>
    </div>
  );
}
