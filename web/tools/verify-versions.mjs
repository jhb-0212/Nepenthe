import { chromium } from 'playwright-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:3100';

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/admin/login`);
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'Nepenthe@2026-Local');
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin$/, { timeout: 20000 });

await page.goto(`${BASE}/admin/posts`, { waitUntil: 'networkidle' });
await page.locator('.admin-list a').last().click(); // opening
await page.waitForSelector('textarea[name="body"]');
await page.waitForTimeout(500);

const original = await page.inputValue('textarea[name="body"]');
console.log('original tail:', JSON.stringify(original.slice(-40)));
const tag = `<!-- 版本验证 ${Date.now()} -->`;

async function save(body) {
  await page.fill('textarea[name="body"]', body);
  await page.click('.admin-actions button[type="submit"]');
  await page.waitForFunction(() => !document.querySelector('.admin-actions button[type="submit"]').disabled, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  console.log('saved, banner:', await page.locator('.admin-banner').innerText().catch(() => '(none)'));
}

await save(`${original}\n\n${tag} A`);
await save(`${original}\n\n${tag} B`);

await page.reload({ waitUntil: 'networkidle' });
console.log('versions:', await page.locator('.version-list details').count());

await page.locator('.version-list details').nth(0).locator('summary').click();
const preview = await page.locator('.version-list details').nth(0).locator('.version-body').innerText();
console.log('preview has A:', preview.includes(`${tag} A`));

await page.locator('.version-list details').nth(0).locator('button').click();
await page.waitForURL(/\/admin\/posts\/\d+$/, { timeout: 25000 });
await page.waitForSelector('textarea[name="body"]');
await page.waitForFunction(
  (args) => {
    const v = document.querySelector('textarea[name="body"]')?.value ?? '';
    return v.includes(args.a) && !v.includes(args.b);
  },
  { a: `${tag} A`, b: `${tag} B` },
  { timeout: 25000 },
);
const after = await page.inputValue('textarea[name="body"]');
console.log('rolled back ok:', after.includes(`${tag} A`) && !after.includes(`${tag} B`));

await save(original);
const final = await page.inputValue('textarea[name="body"]');
console.log('restored:', final === original, JSON.stringify(final.slice(-30)));

await browser.close();
