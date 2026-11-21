import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';
const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(`${BASE}/music`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
await page.click('.stage-big'); // 播放第一首
await page.waitForTimeout(4000);

const a = await page.evaluate(() => {
  const el = document.querySelector('audio');
  return {
    src: (el?.currentSrc || '').slice(-60),
    t: el?.currentTime,
    dur: el?.duration,
    paused: el?.paused,
    err: el?.error?.code,
  };
});
console.log('first play:', JSON.stringify(a));

await page.evaluate(() => document.querySelector('.stage')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/music-preview-playing.png' });

// 站内跳转，看看是不是继续放
const before = await page.evaluate(() => document.querySelector('audio').currentTime);
await page.click('a[href="/"]');
await page.waitForTimeout(3000);
const after = await page.evaluate(() => ({
  t: document.querySelector('audio')?.currentTime,
  paused: document.querySelector('audio')?.paused,
  card: document.querySelector('[data-mu] .mu-txt b')?.textContent,
}));
console.log('nav to home:', JSON.stringify({ before, after, delta: (after.t - before).toFixed(2) }));

// 首页按暂停 → 回音乐页看是否也停了
await page.evaluate(() => document.querySelector('[data-mu]')?.scrollIntoView({ block: 'center' }));
await page.click('[data-mu] .mu-btn-play');
await page.waitForTimeout(600);
const pausedHome = await page.evaluate(() => document.querySelector('audio').paused);
await page.click('a[href="/music"]');
await page.waitForTimeout(800);
const pausedMusic = await page.evaluate(() => ({
  paused: document.querySelector('audio')?.paused,
  bigBtn: document.querySelector('.stage-big')?.getAttribute('aria-pressed'),
}));
console.log('pause sync:', JSON.stringify({ pausedHome, pausedMusic }));

await browser.close();
