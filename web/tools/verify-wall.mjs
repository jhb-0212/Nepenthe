import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';
const TEXT = `端到端验证 ${Date.now().toString().slice(-6)}：匿名留言墙，先审后发。`;

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(`${BASE}/wall`, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'shots/wall-empty.png' });

// 1) 带链接的应当被拒
await page.fill('input[name="name"]', '测试甲');
await page.fill('textarea[name="body"]', '来试试看 http://spam.example.com 能不能过');
await page.waitForTimeout(3500);
await page.click('.msg-form button[type="submit"]');
await page.waitForSelector('.admin-banner.err', { timeout: 15000 });
console.log('link rejected:', await page.locator('.admin-banner.err').innerText());

// 2) 正常留言
await page.fill('input[name="name"]', '测试乙');
await page.fill('textarea[name="body"]', TEXT);
await page.waitForTimeout(3500);
await page.click('.msg-form button[type="submit"]');
await page.waitForSelector('.admin-banner.ok', { timeout: 15000 });
console.log('submit ok:', await page.locator('.admin-banner.ok').innerText());

const wallBefore = await page.locator('.wall-body').count();
console.log('not public before approve:', wallBefore === 0);

// 3) 后台审核
await page.goto(`${BASE}/admin/login`);
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'Nepenthe@2026-Local');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin$/, { timeout: 20000 });

await page.goto(`${BASE}/admin/wall`, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'shots/admin-wall.png' });
console.log('pending shown:', await page.locator('.wall-admin-item.pending').count());

await page.locator('.wall-admin-item.pending').first().locator('button', { hasText: '通过' }).click();
await page.waitForTimeout(1200);
await page.screenshot({ path: 'shots/admin-wall-after.png' });

// 4) 前台可见
await page.goto(`${BASE}/wall`, { waitUntil: 'networkidle' });
const bodies = await page.locator('.wall-body').allInnerTexts();
console.log('visible after approve:', bodies.some((b) => b.includes(TEXT.slice(0, 12))));
await page.screenshot({ path: 'shots/wall-public.png' });

await browser.close();
