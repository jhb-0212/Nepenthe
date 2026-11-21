import type { Metadata, Viewport } from 'next';
import Nav from '@/components/Nav';
import SiteEffects from '@/components/SiteEffects';
import PlayerProvider from '@/components/PlayerProvider';
import { listTracks } from '@/lib/content';
import { getSite, siteUrl } from '@/lib/site';
import './globals.css';

// 内容全部来自数据库，站点不做预渲染（Next 只保留静态资源缓存）
export const dynamic = 'force-dynamic';

// 主题色要跟宣纸底色一致，否则手机状态栏会压一条深色
export const viewport: Viewport = {
  themeColor: '#f8f6f1',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const base = siteUrl();
  return {
    metadataBase: new URL(base),
    title: { default: `${site.name} · ${site.en}`, template: `%s · ${site.name} ${site.en}` },
    description: site.desc,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: `${site.name} · ${site.en}`,
      description: site.desc,
      locale: 'zh_CN',
      url: base,
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${site.name} ${site.en}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${site.name} · ${site.en}`,
      description: site.desc,
      images: ['/og-image.jpg'],
    },
    icons: { icon: '/favicon.svg' },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, tracks] = await Promise.all([getSite(), listTracks()]);
  const year = new Date().getFullYear();
  const bg = site.backgroundImage;

  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://miaoda.feishu.cn" />
        <link rel="preconnect" href="https://sf3-scmcdn-cn.feishucdn.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://miaoda.feishu.cn/fonts/css2?family=Noto+Serif+SC:wght@900&family=Noto+Sans+SC:wght@400&family=Noto+Sans+SC:wght@700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');" }} />
      </head>
      <body
        className={bg ? 'has-bgimg' : undefined}
        style={bg ? ({ '--bgimg': `url("${bg}")`, '--bgdim': String(site.backgroundImageDim) } as React.CSSProperties) : undefined}
      >
        <PlayerProvider
          api={site.musicApi}
          playlistId={site.playlistId}
          tracks={tracks.map((t) => ({ id: t.songId, name: t.name, artist: t.artist, dur: t.dur, why: t.why }))}
        >
        <Nav name={site.name} en={site.en} portfolioUrl={site.portfolioUrl} />
        <main id="app">{children}</main>

        <footer className="foot">
          <div className="wrap foot-in">
            <div>
              <span className="foot-name">{site.name}</span>
              <span className="foot-en">{site.en}</span>
            </div>
            <div className="foot-meta">
              © {year} · 手工搭建 · <a href="/rss.xml">RSS</a>
            </div>
          </div>
        </footer>

        <div className="toast" id="toast" role="status" aria-live="polite" />
        <SiteEffects />
        </PlayerProvider>
      </body>
    </html>
  );
}
