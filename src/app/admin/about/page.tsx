import Link from 'next/link';
import { guard } from '@/lib/admin';
import { getAbout } from '@/lib/about';
import AboutForm from '@/components/AboutForm';

export const metadata = { title: '关于页' };

export default async function AdminAboutPage() {
  await guard();
  const about = await getAbout();

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <h1>关于页</h1>
          <small>整页文案与配图都在这里编辑，保存即生效（存在 SiteSetting 的 about 键）</small>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" href="/about" target="_blank">
            看关于页
          </Link>
          </div>
      </div>

      <AboutForm about={about} />
    </div>
  );
}
