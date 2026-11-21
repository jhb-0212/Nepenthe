import type { Metadata } from 'next';
import MusicStage from '@/components/MusicStage';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.music.title, description: pages.music.lead };
}

export default async function MusicPage() {
  const pages = await getPages();
  return (
    <div className="page">
      <div className="wrap">
        <div className="page-head">
          <h1>
            <span className="kicker">{pages.music.kicker}</span>{pages.music.title}
          </h1>
          <p>{pages.music.lead}</p>
        </div>

        <MusicStage />
      </div>
    </div>
  );
}
