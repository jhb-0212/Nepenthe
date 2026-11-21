const fs = require('fs');
let s = fs.readFileSync('src/app/wall/page.tsx', 'utf8');
s = s.replace(
  '{pages.wall.note ? <p className="plain-note">{pages.wall.note}</p> : null}',
  'pages.wall.note ? <p className="plain-note">{pages.wall.note}</p> : null'
);
fs.writeFileSync('src/app/wall/page.tsx', s, 'utf8');
console.log('wall fixed:', !s.includes('{pages.wall.note ?'));
