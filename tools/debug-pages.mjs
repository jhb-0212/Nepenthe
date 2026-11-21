import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const b = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--no-proxy-server'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.setDefaultTimeout(45000);

(async () => {
  await p.goto('http://127.0.0.1:3100/admin/login', { waitUntil: 'domcontentloaded' });
  await p.fill('input[name=username]', 'admin');
  await p.fill('input[name=password]', 'Nepenthe@2026-Local');
  await p.click('button[type=submit]');
  await p.waitForURL(/\/admin$/, { waitUntil: 'commit', timeout: 45000 });
  console.log('logged in:', p.url());

  await p.goto('http://127.0.0.1:3100/admin/pages', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForSelector('.abx-sec', { timeout: 45000 });
  await p.waitForTimeout(300);
  console.log('sections:', await p.locator('.abx-sec').count());
  await p.screenshot({ path: 'shots/admin-pages.png' });
  await p.screenshot({ path: 'shots/admin-pages-full.png', fullPage: true });
  await b.close();
})();
