import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const bg = fs.readFileSync('public/hero-bg.jpg').toString('base64');

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #f8f6f1;
         font-family: "Noto Serif SC", "Songti SC", "STSong", "SimSun", serif; }
  .stage { position: relative; width: 1200px; height: 630px; overflow: hidden; }
  .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
        filter: saturate(0.85) brightness(1.02); }
  .veil { position: absolute; inset: 0;
          background: linear-gradient(100deg, rgba(248,246,241,.94) 0%, rgba(248,246,241,.72) 42%, rgba(248,246,241,.18) 78%, rgba(248,246,241,0) 100%); }
  .inner { position: absolute; left: 84px; top: 92px; width: 620px; color: #1f2e2a; }
  .mark { display: inline-block; padding: 7px 16px; border: 1px solid rgba(58,90,82,.35);
          border-radius: 999px; font-size: 17px; letter-spacing: .32em; color: #3a5a52;
          background: rgba(255,255,255,.55); }
  .name { font-size: 92px; line-height: 1.06; letter-spacing: .1em; margin: 30px 0 10px; font-weight: 900; }
  .en { font-size: 20px; letter-spacing: .52em; color: #3a5a52; margin-left: 4px; }
  .rule { width: 74px; height: 2px; background: #3a5a52; opacity: .45; margin: 26px 0 22px; }
  .lead { font-size: 23px; line-height: 1.85; color: #2c3e3a; letter-spacing: .06em; }
  .foot { position: absolute; left: 84px; bottom: 62px; font-size: 15px; letter-spacing: .28em;
          color: #4a5a55; display: flex; gap: 22px; align-items: center; }
  .dot { width: 4px; height: 4px; border-radius: 50%; background: #c89a6a; }
  .seal { position: absolute; right: 72px; bottom: 58px; width: 78px; height: 78px;
          border: 2px solid rgba(58,90,82,.5); border-radius: 9px; color: #3a5a52;
          display: grid; place-items: center; font-size: 19px; line-height: 1.25;
          letter-spacing: .08em; text-align: center; background: rgba(255,255,255,.4); }
</style></head>
<body>
  <div class="stage">
    <img class="bg" src="data:image/jpeg;base64,${bg}" />
    <div class="veil"></div>
    <div class="inner">
      <span class="mark">忘忧居 · 二〇二六</span>
      <div class="name">忘忧居</div>
      <div class="en">NEPENTHE</div>
      <div class="rule"></div>
      <div class="lead">在做 AIGC，也在写文案。<br />声音、文章、正在做的事 —— 这里允许有过程。</div>
    </div>
    <div class="foot"><span>HERE LIVES A WORRILESS SOUL</span><span class="dot"></span><span>手工搭建</span></div>
    <div class="seal">忘<br />忧</div>
  </div>
</body></html>`;

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(600);
const raw = await page.screenshot({ type: 'png' });
await browser.close();

const out = path.resolve('public/og-image.jpg');
await sharp(raw).jpeg({ quality: 84, mozjpeg: true }).toFile(out);

const size = fs.statSync(out).size;
console.log('og-image.jpg', Math.round(size / 1024) + 'KB');
