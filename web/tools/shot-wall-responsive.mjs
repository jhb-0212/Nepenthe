import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });

for (const [name, w, h] of [['wall-mobile', 390, 844], ['wall-1024', 1024, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/wall`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/${name}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(name, 'h-overflow:', overflow);
  await ctx.close();
}

await browser.close();
