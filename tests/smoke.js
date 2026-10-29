// Teste rápido antes de empacotar: node tests/smoke.js  (ou npm test)
// Abre dist/ no Chromium com dados simulados e verifica: sem erros de JS,
// sem botões de gestão visíveis no link "só ver", sem deslize lateral.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css' };
const mock = { ok:true, hasAdminAuth:false, competitions:[{id:'c1',name:'Época 26/27',mode:'matches'}],
  data:{ c1:{ events:[
    {id:'e1',day:'2026-10',sport:'Andebol',opponent:'Sporting',status:'Passou',result:'28-24',data:'2026-10-20',local:'casa'},
    {id:'e2',day:'2026-11',sport:'Basquetebol',opponent:'Benfica',status:'Marcado',data:'2026-11-20',hora:'20:00',local:'fora'} ], status:{} } } };
const ADMIN_IDS = ['nextSeasonBtn','archiveCompBtn','newCompBtn'];
let fails = 0; const bad = m => { fails++; console.log('❌', m); }; const ok = m => console.log('✅', m);

(async () => {
  const srv = http.createServer((q, r) => {
    let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith(path.sep)) p += 'index.html';
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'content-type': MIME[path.extname(p)] || 'text/plain'}); r.end(d); });
  }).listen(0);
  const port = srv.address().port, browser = await chromium.launch();
  for (const [label, query] of [['público', '?view=readonly'], ['edição', '']]) {
    for (const w of [360, 390, 768]) {
      const page = await browser.newPage({ viewport: { width: w, height: 800 } });
      const errs = []; page.on('pageerror', e => errs.push(e.message));
      await page.addInitScript(d => {
        try { localStorage.setItem('dia22-viewer-name', 'Teste'); } catch (e) {}
        const f = window.fetch; window.fetch = (...a) => String(a[0]).includes('script.google.com')
          ? Promise.resolve(new Response(JSON.stringify(d), {status:200, headers:{'content-type':'application/json'}})) : f.apply(window, a);
      }, mock);
      await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
      await page.goto(`http://localhost:${port}/index.html${query}`, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      await page.evaluate(() => { const o = document.getElementById('introOverlay'); if (o) o.style.display = 'none'; });
      const tag = `${label} ${w}px`;
      errs.length ? bad(`${tag}: erros JS → ${errs.join(' | ')}`) : ok(`${tag}: sem erros JS`);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ov > 1 ? bad(`${tag}: deslize lateral de ${ov}px`) : ok(`${tag}: sem deslize lateral`);
      if (label === 'público') {
        const vis = await page.evaluate(ids => ids.filter(i => { const e = document.getElementById(i); return e && e.offsetParent !== null; }), ADMIN_IDS);
        vis.length ? bad(`${tag}: botões de gestão visíveis → ${vis}`) : ok(`${tag}: nenhum botão de gestão visível`);
      }
      await page.close();
    }
  }
  await browser.close(); srv.close();
  console.log(fails ? `\n${fails} problema(s) — NÃO publicar.` : '\nTudo ok.'); process.exit(fails ? 1 : 0);
})();
