import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${BASE}/music`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.lyric-line', { timeout: 20000 });
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/music-lyrics.png', fullPage: true });

// 换到一首网易云曲目，看看另一家的歌词
const rows = await page.$$('.track');
if (rows[1]) {
  await rows[1].click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shots/music-lyrics-netease.png', fullPage: true });
}
const n = await page.$$eval('.lyric-line', (els) => els.length);
console.log('lyric lines:', n);
await browser.close();
