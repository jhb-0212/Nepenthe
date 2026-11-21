const fs = require('fs');
let a = fs.readFileSync('src/app/archive/page.tsx','utf8');
a = a.replace('          {pages.archive.note ? <p className="arc-empty">{pages.archive.note}</p> : null}',
              '          pages.archive.note ? <p className="arc-empty">{pages.archive.note}</p> : null');
fs.writeFileSync('src/app/archive/page.tsx', a, 'utf8');

let g = fs.readFileSync('src/app/gallery/page.tsx','utf8');
g = g.replace('{shaped.length ? <GalleryTabs albums={shaped} /> : {pages.gallery.note ? <p className="plain-note">{pages.gallery.note}</p> : null}}',
              '{shaped.length ? <GalleryTabs albums={shaped} /> : pages.gallery.note ? <p className="plain-note">{pages.gallery.note}</p> : null}');
fs.writeFileSync('src/app/gallery/page.tsx', g, 'utf8');
console.log('patched');
