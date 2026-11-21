import Link from 'next/link';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { deleteAlbum, deletePhoto, updatePhoto, createAlbumForm } from '@/actions/gallery';
import PhotoUploader from '@/components/PhotoUploader';
import { fmtDate } from '@/lib/content';

export const metadata = { title: '相册管理' };

export default async function AdminGalleryPage() {
  await guard();
  const albums = await prisma.album.findMany({
    orderBy: { sort: 'asc' },
    include: { photos: { orderBy: [{ sort: 'asc' }, { date: 'desc' }] } },
  });

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>相册</h1>
          <small>
            {albums.length} 个相簿 · 照片合计 {albums.reduce((s, a) => s + a.photos.length, 0)} 张
          </small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" href="/gallery" target="_blank">
            看相册
          </Link>
          </div>
      </div>

      <p style={{ color: 'var(--faint)', fontSize: 12.5, marginTop: 14 }}>
        照片会压成 WebP（长边 2560、剥 EXIF），落在 <code>public/uploads/</code>；容器部署时这个目录要挂 volume，否则重建镜像就没了。
      </p>

      {albums.map((a) => (
        <section key={a.id} className="version-box">
          <h2>
            {a.title} <small>{a.photos.length} 张 · {a.slug}</small>
          </h2>

          <div className="admin-actions" style={{ margin: '12px 0' }}>
            <PhotoUploader albumId={a.id} />
            <form action={deleteAlbum}>
              <input type="hidden" name="id" value={a.id} />
              <button className="admin-btn danger" type="submit">
                删除相簿
              </button>
            </form>
          </div>

          <div className="gallery-grid">
            {a.photos.map((p) => (
              <div key={p.id} className="gallery-cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.caption || a.title} loading="lazy" />
                <form action={updatePhoto} className="gallery-cell-form">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="caption" defaultValue={p.caption} placeholder="图说" />
                  <input name="sort" type="number" defaultValue={p.sort} style={{ width: 64 }} />
                  <button className="admin-btn" type="submit">
                    存
                  </button>
                </form>
                <div className="gallery-cell-foot">
                  <small>{fmtDate(p.date)}</small>
                  <form action={deletePhoto}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="admin-btn danger" type="submit">
                      删
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
          {a.photos.length === 0 ? <p style={{ color: 'var(--faint)', fontSize: 13 }}>还没有照片，点上面「上传照片」。</p> : null}
        </section>
      ))}

      <section className="version-box">
        <h2>新建相簿</h2>
        <form className="admin-form" action={createAlbumForm}>
          <input type="hidden" name="id" value={0} />
          <div className="admin-row">
            <label>
              名字
              <input name="title" required placeholder="风月册" />
            </label>
            <label>
              slug
              <input name="slug" placeholder="留空由名字生成" />
            </label>
            <label>
              色调
              <input name="tone" defaultValue="mag" placeholder="mag / cyan / amber" />
            </label>
            <label>
              排序
              <input name="sort" type="number" defaultValue={albums.length} />
            </label>
          </div>
          <label>
            说明
            <input name="note" placeholder="一句话介绍这个相簿" />
          </label>
          <div className="admin-actions">
            <button className="admin-btn primary" type="submit">
              建相簿
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
