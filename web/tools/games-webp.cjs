const sharp = require('sharp');
const fs = require('fs');
const names = ['wangzhe','delta','wukong','fanren','jianlai'];
(async () => {
  for (const n of names) {
    const src = `public/games/${n}.jpg`;
    await sharp(src).resize(1280, 720, { fit: 'cover' }).webp({ quality: 82 }).toFile(`public/games/${n}.webp`);
    fs.unlinkSync(src);
    console.log(n, fs.statSync(`public/games/${n}.webp`).size);
  }
})();
