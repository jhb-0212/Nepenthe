import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const b = await chromium.launch({ executablePath: EDGE, headless: true });
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto('http://127.0.0.1:3100/about', { waitUntil: 'networkidle' });
await m.evaluate(() => document.querySelector('.play-grid').scrollIntoView({ block: 'start' }));
await m.waitForTimeout(1200);
await m.screenshot({ path: 'shots/about-play-mobile.png' });
await b.close();
