'use client';

import { useState } from 'react';

type Photo = { id: number; src: string; caption: string; date: string };
type Album = { id: number; slug: string; title: string; tone: string; note: string; photos: Photo[] };

const fmt = (d: string) => d.slice(0, 10).replace(/-/g, '.');

export default function GalleryTabs({ albums }: { albums: Album[] }) {
  const [active, setActive] = useState(albums[0]?.slug ?? '');
  // 有照片才套滚动面板；空相册让它保持原样的留白，不要先框一个空盒子
  const hasPhotos = albums.some((a) => a.photos.length > 0);

  return (
    <>
      <div className="wrap">
        <div className="gallery-tabs" role="tablist">
          {albums.map((a) => (
            <button
              key={a.slug}
              className="gallery-tab"
              type="button"
              role="tab"
              aria-selected={active === a.slug}
              onClick={() => setActive(a.slug)}
            >
              {a.title}
              <span className="gallery-tab-count">{a.photos.length}</span>
            </button>
          ))}
        </div>

        <div className={hasPhotos ? 'gallery-content scroll-panel tall' : 'gallery-content'}>
          {albums.map((a) => (
            <div key={a.slug} className="gallery-panel" hidden={active !== a.slug}>
              <div className="gallery-panel-head">
                <h2>{a.title}</h2>
                <p>{a.note}</p>
              </div>

              {a.photos.length ? (
                <div className="gallery-grid">
                  {a.photos.map((p) => (
                    <figure key={p.id} className="gallery-photo-card">
                      <div className="gallery-photo-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.src} alt={p.caption} loading="lazy" />
                      </div>
                      <figcaption className="gallery-photo-info">
                        <b>{p.caption}</b>
                        <span>发布于：{fmt(p.date)}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="gallery-empty">
                  <div className="gallery-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                  <p>还没有照片，后续会慢慢补上。</p>
                  <p className="gallery-empty-sub">待放图，待放风，待放一段好时光。</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
