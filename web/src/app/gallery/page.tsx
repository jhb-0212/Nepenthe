import type { Metadata } from 'next';
import GalleryTabs from '@/components/GalleryTabs';
import { listAlbums } from '@/lib/content';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.gallery.title, description: pages.gallery.lead };
}

export default async function GalleryPage() {
  const [albums, pages] = await Promise.all([listAlbums(), getPages()]);
  const shaped = albums.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    tone: a.tone,
    note: a.note,
    photos: a.photos.map((p) => ({
      id: p.id,
      src: p.src,
      caption: p.caption,
      date: p.date.toISOString(),
    })),
  }));

  return (
    <div className="gallery-page">
      <div className="gallery-banner">
        <div className="gallery-banner-bg" style={{ backgroundImage: `url(${pages.galleryBg || '/hero-bg.jpg'})` }} />
        <div className="gallery-banner-content">
          <span className="gallery-banner-tag">{pages.gallery.kicker}</span>
          <h1>{pages.gallery.title}</h1>
          <p>{pages.gallery.lead}</p>
          {pages.gallery.sub ? <p className="gallery-banner-sub">{pages.gallery.sub}</p> : null}
        </div>
      </div>

      {shaped.length ? <GalleryTabs albums={shaped} /> : pages.gallery.note ? <p className="plain-note">{pages.gallery.note}</p> : null}
    </div>
  );
}
