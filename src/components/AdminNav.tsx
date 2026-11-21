'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: '内容',
    items: [
      { href: '/admin/posts', label: '文章' },
      { href: '/admin/notes', label: '随记' },
      { href: '/admin/novels', label: '小说' },
      { href: '/admin/gallery', label: '相册' },
      { href: '/admin/music', label: '曲目' },
      { href: '/admin/wall', label: '留言' },
    ],
  },
  {
    title: '站点',
    items: [
      { href: '/admin/site', label: '站点设置' },
      { href: '/admin/about', label: '关于页' },
      { href: '/admin/pages', label: '页面文案' },
    ],
  },
  {
    title: '运营',
    items: [{ href: '/admin/stats', label: '访问统计' }],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="adm-nav" aria-label="后台导航">
      <Link className={pathname === '/admin' ? 'adm-nav-home is-active' : 'adm-nav-home'} href="/admin">
        控制台
      </Link>

      {GROUPS.map((g) => (
        <div className="adm-nav-group" key={g.title}>
          <div className="adm-nav-title">{g.title}</div>
          {g.items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
            return (
              <Link key={it.href} href={it.href} className={active ? 'adm-nav-item is-active' : 'adm-nav-item'}>
                {it.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
