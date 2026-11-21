import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ORIG = '三件事并行，一件都还没做完。';
const TEST = '三件事并行，一件都还没做完。· 后台改的';
const b = await chromium.launch({ executablePath: EDGE, headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('http://127.0.0.1:3100/admin/login', { waitUntil: 'networkidle' });
await p.fill('input[name=username]', 'admin');
await p.fill('input[name=password]', 'Nepenthe@2026-Local');
await p.click('button[type=submit]');
await p.waitForURL(/\/admin$/, { timeout: 20000 });

async function saveHeadline(text, shot) {
  await p.goto('http://127.0.0.1:3100/admin/about', { waitUntil: 'networkidle' });
  const ta = p.locator('.abx-sec textarea').first();
  await ta.fill(text);
  await p.click('button:has-text("保存关于页")');
  await p.waitForSelector('.admin-banner.ok', { timeout: 20000 });
  const msg = await p.locator('.admin-banner.ok').innerText();
  if (shot) await p.screenshot({ path: shot });
  return msg.trim();
}

console.log('save1:', await saveHeadline(TEST, 'shots/admin-about-saved.png'));

const front = await p.goto('http://127.0.0.1:3100/about', { waitUntil: 'networkidle' });
const h1 = await p.locator('.about-h1').innerText();
console.log('front h1:', h1);
console.log('front status', front.status());
await p.screenshot({ path: 'shots/about-edited.png' });

const fresh = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await fresh.goto('http://127.0.0.1:3100/about', { waitUntil: 'networkidle' });
console.log('no-cookie sees:', await fresh.locator('.about-h1').innerText());

console.log('restore:', await saveHeadline(ORIG, null));
await p.goto('http://127.0.0.1:3100/about', { waitUntil: 'networkidle' });
console.log('after restore:', await p.locator('.about-h1').innerText());
await b.close();
