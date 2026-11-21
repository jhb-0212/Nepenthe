import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(`${BASE}/admin/login`);
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'Nepenthe@2026-Local');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin$/, { timeout: 20000 });

await page.goto(`${BASE}/admin/posts`, { waitUntil: 'networkidle' });
await page.locator('.admin-list a').last().click();
await page.waitForSelector('.version-box', { timeout: 20000 });
await page.locator('.version-box').scrollIntoViewIfNeeded();
await page.locator('.version-list details').nth(0).locator('summary').click();
await page.waitForTimeout(600);
await page.locator('.version-box').screenshot({ path: 'shots/admin-versions.png' });
console.log('versions shot ok');
await browser.close();
