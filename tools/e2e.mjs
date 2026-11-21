import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));

// 1. 登录
await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'Nepenthe@2026-Local');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin(?!\/login)/, { timeout: 20000 });
console.log('login ok ->', page.url());

// 2. 发布（Server Action + SSE 进度）
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /发布（重建索引）/ }).click();
await page.waitForSelector('.publish-bar', { timeout: 20000 });
await page.waitForTimeout(2500);
const bar = await page.$eval('.publish-bar', (el) => el.textContent);
console.log('publish bar:', bar.trim().slice(0, 80));
await page.screenshot({ path: 'shots/admin.png' });

// 3. 新建一篇文章（Server Action 保存 + 版本快照）
const slug = `e2e-${Date.now()}`;
await page.goto(`${BASE}/admin/posts/new`, { waitUntil: 'networkidle' });
await page.fill('input[name="title"]', '端到端验证：动态站的第一次发布');
await page.fill('input[name="slug"]', slug);
await page.fill('input[name="date"]', new Date().toISOString().slice(0, 10));
await page.fill('input[name="tag"]', '验证');
await page.fill('input[name="readTime"]', '1 分钟');
await page.fill('input[name="summary"]', '由 Playwright 写入的一篇，用来证明 Server Actions 真的落库了。');
await page.fill('textarea[name="body"]', '这是正文。\n\n> [!note] 动态站\n> 改完保存，刷新前台立刻能看到，不再跑构建。\n\n还有 ==高亮== 和 **加粗**。');
await page.getByRole('button', { name: '保存' }).click();
await page.waitForSelector('.admin-banner.ok, .admin-banner.err', { timeout: 20000 });
const banner = await page.$eval('.admin-banner', (el) => `${el.className}: ${el.textContent}`);
console.log('save banner:', banner);

// 4. 前台验证即时生效
const resp = await page.goto(`${BASE}/writing/${slug}`, { waitUntil: 'networkidle' });
console.log('new post page status:', resp.status());
const hasCallout = await page.$('.callout') !== null;
console.log('callout rendered:', hasCallout);
await page.screenshot({ path: 'shots/newpost.png' });

// 5. 搜索
const search = await (await ctx.request.get(`${BASE}/api/search?q=${encodeURIComponent('动态站')}`)).json();
console.log('search hits:', search.source, search.hits.length, search.hits[0]?.title ?? '');

// 6. 埋点 + SSE：页面上的 live-strip 由 EventSource 推送
await ctx.request.post(`${BASE}/api/hit`, {
  data: JSON.stringify({ path: '/writing/' + slug, ref: '' }),
  headers: { 'content-type': 'text/plain;charset=UTF-8', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0' },
});
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForSelector('.live-strip', { timeout: 15000 });
await page.waitForTimeout(3500);
const live = await page.$eval('.live-strip', (el) => el.textContent);
console.log('live strip:', live.replace(/\s+/g, ' ').trim().slice(0, 80));


console.log('--- page errors ---');
console.log(errs.join('\n') || '(none)');
await browser.close();
