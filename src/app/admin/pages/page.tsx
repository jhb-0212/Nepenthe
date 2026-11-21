import Link from 'next/link';
import { guard } from '@/lib/admin';
import { getPages } from '@/lib/pages';
import PagesForm from '@/components/PagesForm';

export const metadata = { title: '页面文案' };

export default async function AdminPagesPage() {
  await guard();
  const pages = await getPages();

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>页面文案</h1>
          <small>各页面的小标签、标题、说明、空态提示，存在 SiteSetting 的 pages 键</small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" href="/writing" target="_blank">
            看文章页
          </Link>
          </div>
      </div>

      <PagesForm pages={pages} />
    </div>
  );
}
