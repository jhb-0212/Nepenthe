import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.resolve('shots');
fs.mkdirSync(OUT, { recursive: true });

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const pages = [
  ['/', 'home'],
  ['/writing', 'writing'],
  ['/writing/opening', 'article'],
  ['/archive', 'archive'],
  ['/music', 'music'],
  ['/gallery', 'gallery'],
  ['/admin/login', 'login'],
];

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

for (const [url, name] of pages) {
  await page.goto(`http://127.0.0.1:3100${url}`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  const title = await page.title();
  console.log(`${name}: ${title}`);
}

console.log('---console errors---');
console.log(errors.slice(0, 12).join('\n') || '(none)');
await browser.close();
