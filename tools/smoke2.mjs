const paths = ['/', '/writing', '/notes', '/novels', '/gallery', '/archive', '/music', '/doing', '/wall', '/search', '/about', '/admin/pages'];
for (const p of paths) {
  const r = await fetch('http://127.0.0.1:3100' + p);
  const t = await r.text();
  const m = t.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const h1 = m ? m[1].replace(/<[^>]+>/g, '').trim().slice(0, 24) : '-';
  console.log(String(r.status).padEnd(4), p.padEnd(13), '| h1:', h1);
}
