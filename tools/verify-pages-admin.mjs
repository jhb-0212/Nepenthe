import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const b = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--no-proxy-server'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.setDefaultTimeout(45000);

await p.goto('http://127.0.0.1:3100/admin/login', { waitUntil: 'domcontentloaded' });
await p.fill('input[name=username]', 'admin');
await p.fill('input[name=password]', 'Nepenthe@2026-Local');
await p.click('button[type=submit]');
await p.waitForURL(/\/admin$/, { waitUntil: 'commit', timeout: 45000 });

await p.goto('http://127.0.0.1:3100/admin/pages', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.abx-sec');
const sec = p.locator('.abx-sec').nth(1);
const titleInput = sec.locator('input').nth(1);
const oldTitle = await titleInput.inputValue();
const oldLead = await sec.locator('textarea').inputValue();

await titleInput.fill('写字的地方');
await sec.locator('textarea').fill('改个说明试试 —— 这一段现在来自数据库。');
await p.click('button:has-text("保存页面文案")');
await p.waitForSelector('.admin-banner.ok');
console.log('save msg:', (await p.locator('.admin-banner.ok').innerText()).trim());

let html = await (await fetch('http://127.0.0.1:3100/writing')).text();
console.log('front title changed:', html.includes('写字的地方'), '| lead changed:', html.includes('这一段现在来自数据库'));
console.log('meta description from db:', /<meta name="description" content="[^"]*这一段/.test(html));

await p.goto('http://127.0.0.1:3100/admin/pages', { waitUntil: 'domcontentloaded' });
const sec2 = p.locator('.abx-sec').nth(1);
await sec2.locator('input').nth(1).fill(oldTitle);
await sec2.locator('textarea').fill(oldLead);
await p.click('button:has-text("保存页面文案")');
await p.waitForSelector('.admin-banner.ok');
html = await (await fetch('http://127.0.0.1:3100/writing')).text();
console.log('restored title:', html.includes(oldTitle), '| test text gone:', !html.includes('这一段现在来自数据库'));
await b.close();
