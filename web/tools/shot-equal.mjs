import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const b = await chromium.launch({ executablePath: EDGE, headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://127.0.0.1:3100/music', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.lyric-line', { timeout: 20000 });
await p.waitForTimeout(500);
const h = await p.evaluate(() => {
  const l = document.querySelector('.music-cols > .lyrics').getBoundingClientRect();
  const m = document.querySelector('.music-cols > .mpanel').getBoundingClientRect();
  return { lyrics: Math.round(l.height), mpanel: Math.round(m.height), topDelta: Math.round(m.top - l.top) };
});
console.log('heights:', JSON.stringify(h));
await p.evaluate(() => document.querySelector('.music-cols')?.scrollIntoView({ block: 'center' }));
await p.waitForTimeout(300);
await p.screenshot({ path: 'shots/music-cols-equal.png' });
await b.close();
