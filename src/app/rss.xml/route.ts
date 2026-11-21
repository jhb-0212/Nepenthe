import { listPosts, fmtDate } from '@/lib/content';
import { getSite, siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const [site, posts] = await Promise.all([getSite(), listPosts(30)]);
  const base = siteUrl();

  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/writing/${p.slug}</link>
      <guid isPermaLink="true">${base}/writing/${p.slug}</guid>
      <pubDate>${new Date(`${fmtDate(p.date).replace(/\./g, '-')}T00:00:00+08:00`).toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(site.name)} · ${esc(site.en)}</title>
    <link>${base}</link>
    <description>${esc(site.desc)}</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
