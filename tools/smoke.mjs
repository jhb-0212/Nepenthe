const urls = ['http://127.0.0.1:3100/about', 'http://127.0.0.1:3100/admin/about', 'http://127.0.0.1:3100/'];
for (const u of urls) {
  const r = await fetch(u);
  console.log(r.status, u);
}
