import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const b = await chromium.launch({ executablePath: EDGE, headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://127.0.0.1:3100/admin/login', { waitUntil: 'networkidle' });
await p.fill('input[name=username]', 'admin');
await p.fill('input[name=password]', 'Nepenthe@2026-Local');
await p.click('button[type=submit]');
await p.waitForURL(/\/admin$/, { timeout: 20000 });
await p.goto('http://127.0.0.1:3100/admin/about', { waitUntil: 'networkidle' });
await p.waitForSelector('.abx-play');

// 第一张卡上传一张真图，看 URL 有没有写回
const card = p.locator('.abx-play').first();
await card.locator('input[type=file]').setInputFiles('public/avatar.png');
await p.waitForFunction(() => {
  const img = document.querySelector('.abx-play .abx-img img');
  return img && img.getAttribute('src') && img.getAttribute('src').startsWith('/uploads/');
}, { timeout: 30000 });
const url = await card.locator('.abx-img img').getAttribute('src');
console.log('uploaded url:', url);
await p.screenshot({ path: 'shots/admin-about-upload.png' });

// 保存并在前台确认换了图
await p.click('button:has-text("保存关于页")');
await p.waitForSelector('.admin-banner.ok', { timeout: 20000 });
await p.goto('http://127.0.0.1:3100/about', { waitUntil: 'networkidle' });
const src = await p.locator('.play-card img').first().getAttribute('src');
console.log('front first card img:', src);

// 还原成 /games/wangzhe.webp
await p.goto('http://127.0.0.1:3100/admin/about', { waitUntil: 'networkidle' });
const imgField = p.locator('.abx-play').first().locator('input[placeholder="/games/wangzhe.webp"]');
await imgField.fill('/games/wangzhe.webp');
await p.click('button:has-text("保存关于页")');
await p.waitForSelector('.admin-banner.ok', { timeout: 20000 });
await p.goto('http://127.0.0.1:3100/about', { waitUntil: 'networkidle' });
console.log('restored img:', await p.locator('.play-card img').first().getAttribute('src'));
await b.close();
