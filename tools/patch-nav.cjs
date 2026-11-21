const fs = require('fs');
let s = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
s = s.replace(`        <Link className="admin-btn" href="/admin/about">
          关于页
        </Link>`, `        <Link className="admin-btn" href="/admin/about">
          关于页
        </Link>
        <Link className="admin-btn" href="/admin/pages">
          页面文案
        </Link>`);
fs.writeFileSync('src/app/admin/page.tsx', s, 'utf8');
console.log('nav ok', s.includes('/admin/pages'));
