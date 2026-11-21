const paths = ['/','/writing','/notes','/novels','/gallery','/archive','/music','/doing','/wall','/search','/about','/admin/login'];
for (const p of paths) {
  try {
    const r = await fetch('http://127.0.0.1:3100' + p, { redirect: 'manual' });
    console.log(String(r.status).padEnd(4), p);
  } catch (e) { console.log('ERR ', p, String(e).slice(0, 60)); }
}
