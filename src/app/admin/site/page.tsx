import Link from 'next/link';
import { guard } from '@/lib/admin';
import { getSite } from '@/lib/site';
import SiteForm from '@/components/SiteForm';

export const metadata = { title: '站点设置' };

export default async function AdminSitePage() {
  await guard();
  const site = await getSite();

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>站点设置</h1>
          <small>改完保存，前台刷新就看得到（内容存在 SiteSetting 的 site 键）</small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" href="/" target="_blank">
            看首页
          </Link>
          <Link className="admin-btn" href="/admin">
            回后台
          </Link>
        </div>
      </div>

      <SiteForm site={site} />
    </div>
  );
}
