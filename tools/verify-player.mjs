import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${BASE}/music`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.lyric-line', { timeout: 20000 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/music-cols.png', fullPage: false });

// 用一段本地生成的正弦波，验证「跳页面不停」这件事本身
const res = await page.evaluate(async () => {
  const audio = document.querySelector('audio');
  if (!audio) return 'no audio';
  const ctx = new OfflineAudioContext(1, 44100 * 8, 44100);
  const osc = ctx.createOscillator();
  osc.frequency.value = 440;
  osc.connect(ctx.destination);
  osc.start(0);
  const buf = await ctx.startRendering();
  // 转成 wav 的 base64
  const pcm = buf.getChannelData(0);
  const bytes = new Uint8Array(44 + pcm.length * 2);
  const dv = new DataView(bytes.buffer);
  const put = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  put(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); put(8, 'WAVEfmt '); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 44100, true); dv.setUint32(28, 88200, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); put(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) dv.setInt16(44 + i * 2, pcm[i] * 0x7fff, true);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  audio.src = 'data:audio/wav;base64,' + btoa(bin);
  await audio.play();
  return 'playing';
});
console.log('audio:', res);
await page.waitForTimeout(1500);
const t1 = await page.evaluate(() => document.querySelector('audio')?.currentTime);
// 站内跳转（前端路由，不刷新页面）
await page.click('a[href="/"]');
await page.waitForTimeout(1200);
await page.goto('about:blank');
await page.waitForTimeout(100);
await page.goto(`${BASE}/about`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(100);
console.log('注意：goto 会刷新页面，这里只是兜底，不算数');
await page.goBack();
await page.waitForTimeout(500);

// 真正的站内跳转验证
await page.goto(`${BASE}/music`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(400);
await page.evaluate(async () => {
  const audio = document.querySelector('audio');
  const ctx = new OfflineAudioContext(1, 44100 * 8, 44100);
  const osc = ctx.createOscillator();
  osc.connect(ctx.destination); osc.start(0);
  const buf = await ctx.startRendering();
  const pcm = buf.getChannelData(0);
  const bytes = new Uint8Array(44 + pcm.length * 2);
  const dv = new DataView(bytes.buffer);
  const put = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  put(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); put(8, 'WAVEfmt '); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 44100, true); dv.setUint32(28, 88200, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); put(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) dv.setInt16(44 + i * 2, pcm[i] * 0x7fff, true);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  audio.src = 'data:audio/wav;base64,' + btoa(bin);
  await audio.play();
});
await page.waitForTimeout(2000);
const before = await page.evaluate(() => ({ t: document.querySelector('audio')?.currentTime, paused: document.querySelector('audio')?.paused }));
await page.click('a[href="/"]');
await page.waitForTimeout(2500);
const after = await page.evaluate(() => ({ t: document.querySelector('audio')?.currentTime, paused: document.querySelector('audio')?.paused }));
console.log('music→home:', JSON.stringify({ before, after }), 'delta', (after.t - before.t).toFixed(2));
await page.screenshot({ path: 'shots/home-nowplaying.png', fullPage: false });
const sync = await page.evaluate(() => document.querySelector('[data-mu]')?.className);
console.log('home card class:', sync);
await browser.close();
