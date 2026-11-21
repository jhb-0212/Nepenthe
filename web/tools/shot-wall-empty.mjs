import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:3100/wall', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/wall-empty.png' });
console.log('empty wall shot ok');
await browser.close();
