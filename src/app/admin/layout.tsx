import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logoutAction } from '@/actions/auth';
import AdminNav from '@/components/AdminNav';

export const metadata = { title: '后台' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // 未登录时（登录页）不套后台框架
  if (!session) return <>{children}</>;

  return (
    <div className="adm-layout">
      <aside className="adm-side">
        <Link className="adm-brand" href="/admin">
          忘忧居<span>后台</span>
        </Link>
        <div className="adm-user">已登录 · {session.name}</div>

        <AdminNav />

        <div className="adm-side-foot">
          <Link className="adm-foot-link" href="/" target="_blank" rel="noopener">
            看站点 ↗
          </Link>
          <a className="adm-foot-link" href="/api/admin/export" download>
            导出 JSON
          </a>
          <a className="adm-foot-link" href="/api/admin/export/md" download>
            导出 Markdown
          </a>
          <form action={logoutAction}>
            <button className="adm-foot-link as-button" type="submit">
              退出登录
            </button>
          </form>
        </div>
      </aside>

      <main className="adm-main">{children}</main>
    </div>
  );
}
