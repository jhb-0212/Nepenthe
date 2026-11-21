import { chromium } from 'playwright-core';
import sharp from 'sharp';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';
const MARK = `v${Date.now().toString().slice(-6)}`;

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

// 造一张带 EXIF 方向的大图，验证会压成 WebP
await sharp({ create: { width: 1400, height: 1000, channels: 3, background: { r: 58, g: 90, b: 82 } } })
  .jpeg({ quality: 92 })
  .withMetadata({ orientation: 1 })
  .toFile('tools/test-upload.jpg');

await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'Nepenthe@2026-Local');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin$/, { timeout: 20000 });
console.log('1 login ok');

/* ---------- 上传：坏文件应被拒 ---------- */
const bad = await page.request.post(`${BASE}/api/admin/upload`, {
  multipart: { file: { name: 'x.mjs', mimeType: 'text/plain', buffer: Buffer.from('not an image') } },
});
console.log('2 reject non-image:', bad.status(), (await bad.json()).error);

/* ---------- 上传：正常图片 ---------- */
const good = await page.request.post(`${BASE}/api/admin/upload`, {
  multipart: { file: { name: 'test.jpg', mimeType: 'image/jpeg', buffer: (await import('node:fs')).readFileSync('tools/test-upload.jpg') } },
});
const up = await good.json();
console.log('3 upload:', good.status(), up.url, `${up.width}x${up.height}`, `${Math.round(up.bytes / 1024)}KB`);
const imgRes = await page.request.get(`${BASE}${up.url}`);
console.log('4 uploaded file served:', imgRes.status(), imgRes.headers()['content-type']);

/* ---------- 文章 + 插图 ---------- */
await page.goto(`${BASE}/admin/posts/new`, { waitUntil: 'domcontentloaded' });
await page.fill('input[name="title"]', `插图测试 ${MARK}`);
await page.fill('input[name="slug"]', `img-test-${MARK}`);
await page.fill('textarea[name="body"]', '这是正文第一段。\n\n');
await page.locator('.admin-actions input[type="file"]').setInputFiles('tools/test-upload.jpg');
await page.waitForFunction(() => document.querySelector('textarea[name="body"]').value.includes('/uploads/'), null, { timeout: 20000 });
console.log('5 markdown inserted:', (await page.inputValue('textarea[name="body"]')).includes('/uploads/'));
await page.click('.admin-actions button[type="submit"]');
await page.waitForSelector('.admin-banner.ok', { timeout: 20000 });
console.log('6 post saved:', await page.locator('.admin-banner.ok').innerText());

const article = await page.request.get(`${BASE}/writing/img-test-${MARK}`);
const html = await article.text();
console.log('7 article page:', article.status(), 'img rendered:', html.includes(up.url));

/* ---------- 随记 ---------- */
await page.goto(`${BASE}/admin/notes/new`, { waitUntil: 'domcontentloaded' });
await page.fill('textarea[name="body"]', `随记验证 ${MARK}`);
await page.fill('input[name="slug"]', `note-${MARK}`);
await page.click('.admin-actions button[type="submit"]');
await page.waitForSelector('.admin-banner.ok', { timeout: 20000 });
const notesHtml = await (await page.request.get(`${BASE}/notes`)).text();
console.log('8 note on front:', notesHtml.includes(`随记验证 ${MARK}`));

/* ---------- 小说 + 章节 ---------- */
await page.goto(`${BASE}/admin/novels/new`, { waitUntil: 'domcontentloaded' });
await page.fill('input[name="title"]', `小说测试 ${MARK}`);
await page.fill('input[name="slug"]', `novel-${MARK}`);
await page.click('.admin-actions button[type="submit"]');
await page.waitForSelector('.admin-banner.ok', { timeout: 20000 });
await page.goto(`${BASE}/admin/novels`, { waitUntil: 'domcontentloaded' });
await page.locator('.admin-list a').first().click();
await page.waitForSelector('.version-box');
const novelUrl = page.url();
const novelId = novelUrl.split('/').pop();
await page.goto(`${BASE}/admin/novels/${novelId}/chapters/new`, { waitUntil: 'domcontentloaded' });
await page.fill('input[name="title"]', `第一章 ${MARK}`);
await page.fill('textarea[name="body"]', '章节正文。');
await page.click('.admin-actions button[type="submit"]');
await page.waitForSelector('.admin-banner.ok', { timeout: 20000 });
const novelPage = await page.request.get(`${BASE}/novels/novel-${MARK}`);
console.log('9 novel + chapter saved:', novelPage.status());

/* ---------- 曲目 ---------- */
await page.goto(`${BASE}/admin/music`, { waitUntil: 'domcontentloaded' });
await page.locator('.version-box input[name="songId"]').fill('186016');
await page.locator('.version-box input[name="name"]').fill(`曲目测试 ${MARK}`);
await page.locator('.version-box input[name="artist"]').fill('测试歌手');
await page.locator('.version-box button[type="submit"]').click();
await page.waitForSelector('.admin-banner.ok', { timeout: 20000 });
const musicHtml = await (await page.request.get(`${BASE}/music`)).text();
console.log('10 track on front:', musicHtml.includes(`曲目测试 ${MARK}`));

/* ---------- 站点设置 ---------- */
await page.goto(`${BASE}/admin/site`, { waitUntil: 'domcontentloaded' });
const nameVal = await page.inputValue('input[name="name"]');
await page.fill('input[name="mark"]', '十一月 · 二〇二六');
await page.locator('.admin-actions button[type="submit"]').click();
await page.waitForSelector('.admin-banner.ok', { timeout: 20000 });
console.log('11 site save:', nameVal, '→', await page.locator('.admin-banner.ok').innerText());

/* ---------- 统计页 ---------- */
const stats = await page.goto(`${BASE}/admin/stats`, { waitUntil: 'domcontentloaded' });
console.log('12 stats page:', stats.status(), 'bars:', await page.locator('.stats-bar').count());
await page.screenshot({ path: 'shots/admin-stats.png' });

/* ---------- 导出 ---------- */
const json = await page.request.get(`${BASE}/api/admin/export`);
const dump = await json.json();
console.log('13 export json:', json.status(), dump.counts);

const md = await page.request.get(`${BASE}/api/admin/export/md`);
const mdText = await md.text();
console.log('14 export md:', md.status(), `${Math.round(mdText.length / 1024)}KB`, mdText.includes('忘忧居，开业'));

/* ---------- 后台首页截图 ---------- */
await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
await page.screenshot({ path: 'shots/admin-home2.png', fullPage: true });

await browser.close();


