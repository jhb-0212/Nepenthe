import { chromium } from 'playwright-core';
import sharp from 'sharp';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';

await sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 200, g: 180, b: 150 } } }).jpeg().toFile('tools/g1.jpg');
await sharp({ create: { width: 900, height: 1200, channels: 3, background: { r: 90, g: 120, b: 110 } } }).jpeg().toFile('tools/g2.jpg');

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'Nepenthe@2026-Local');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin$/, { timeout: 20000 });

await page.goto(`${BASE}/admin/gallery`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.version-box');

const fileInput = page.locator('input[type="file"]').first();
await fileInput.setInputFiles(['tools/g1.jpg', 'tools/g2.jpg']);
await page.waitForFunction(() => document.querySelectorAll('.gallery-cell').length >= 1, null, { timeout: 25000 });
await page.waitForTimeout(1500);
console.log('photos in admin:', await page.locator('.gallery-cell').count());
await page.screenshot({ path: 'shots/admin-gallery.png' });

await page.goto(`${BASE}/gallery`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const imgs = await page.locator('img').count();
console.log('front gallery imgs:', imgs);
await page.screenshot({ path: 'shots/gallery-with-photos.png' });

await browser.close();
