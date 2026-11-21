import { chromium } from 'playwright-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const b = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--no-proxy-server'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.setDefaultTimeout(45000);
for (const [path, shot] of [['/archive','shots/page-archive.png'],['/gallery','shots/page-gallery.png'],['/doing','shots/page-doing.png'],['/wall','shots/page-wall.png']]) {
  await p.goto('http://127.0.0.1:3100' + path, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: shot });
  console.log('shot', path);
}
await b.close();
