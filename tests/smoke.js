// Teste rápido antes de empacotar: node tests/smoke.js  (ou npm test)
// Abre dist/ no Chromium com dados simulados e verifica: sem erros de JS,
// sem botões de gestão visíveis no link "só ver", sem deslize lateral.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css' };
const mock = { ok:true, hasAdminAuth:false, competitions:[{id:'c1',name:'Época 26/27',mode:'matches'}],
  noticias:{ 'Andebol':[{id:'n1',t:'Andebol: FC Porto vence em casa e segue na prova com um título bastante comprido para testar',f:'Record',u:'https://example.com/a',d:Date.now()-3600e3,i:''}], 'Equipa B':[{id:'n2',t:'Equipa B prepara jogo',f:'FC Porto',u:'https://example.com/b',d:Date.now()-7200e3,i:''}] },
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
      await page.evaluate(() => { try { setView('noticias'); } catch (e) {} });
      await page.waitForTimeout(300);
      const nCards = await page.evaluate(() => document.querySelectorAll('#newsView .nw-card').length);
      nCards === 2 ? ok(`${tag}: separador Notícias mostra 2 cartões`) : bad(`${tag}: separador Notícias mostra ${nCards} cartões (esperado 2)`);
      const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ov2 > 1 ? bad(`${tag}: Notícias com deslize lateral de ${ov2}px`) : ok(`${tag}: Notícias sem deslize lateral`);
      await page.evaluate(() => { try { setView('inicio'); } catch (e) {} });
      if (label === 'público') {
        const vis = await page.evaluate(ids => ids.filter(i => { const e = document.getElementById(i); return e && e.offsetParent !== null; }), ADMIN_IDS);
        vis.length ? bad(`${tag}: botões de gestão visíveis → ${vis}`) : ok(`${tag}: nenhum botão de gestão visível`);
      }
      await page.close();
    }
  }
  { // v247: modo demonstração ?demo=live (só público): jogo ao vivo com onze, lance a lance e estatísticas
    const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(d => {
      try { localStorage.setItem('dia22-viewer-name', 'Teste'); } catch (e) {}
      const f = window.fetch; window.fetch = (...a) => String(a[0]).includes('script.google.com')
        ? Promise.resolve(new Response(JSON.stringify(d), {status:200, headers:{'content-type':'application/json'}})) : f.apply(window, a);
    }, mock);
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html?view=readonly&demo=live`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { try { openGamePage_('demo-live'); } catch (e) {} });
    await page.waitForTimeout(400);
    const txt = await page.evaluate(() => document.body.innerText);
    ['AO VIVO', 'Onze inicial', 'Lance a lance', 'Estatísticas'].forEach(t => txt.includes(t) ? ok(`demo ao vivo: mostra «${t}»`) : bad(`demo ao vivo: falta «${t}»`));
    errs.length ? bad(`demo ao vivo: erros JS → ${errs.join(' | ')}`) : ok('demo ao vivo: sem erros JS');
    await page.close();
  }
  { // v249: painel «Partilhar» (edição): imagem do dia e de um jogo nos 3 tamanhos, legenda automática e reel do dia
    const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const m2 = { ok:true, hasAdminAuth:false, competitions:[{id:'c1',name:'Época 26/27',mode:'matches'}], data:{ c1:{ events:[
      {id:'g1',day:iso(0),t:'18:00',sport:'Andebol',athlete:'Sporting',local:'casa',detail:'Campeonato',phase:'5ª Jornada'},
      {id:'g3',day:iso(0),t:'11:00',sport:'Voleibol',athlete:'Fonte Bastardo',local:'casa'} ], status:{ g3:{resultado:'3-1',resultTag:'win'} } } } };
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(d => {
      try { localStorage.setItem('dia22-viewer-name', 'Teste'); localStorage.removeItem('dia22-share-size'); } catch (e) {}
      const f = window.fetch; window.fetch = (...a) => String(a[0]).includes('script.google.com')
        ? Promise.resolve(new Response(JSON.stringify(d), {status:200, headers:{'content-type':'application/json'}})) : f.apply(window, a);
    }, m2);
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html?view=edit`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => openShareHub_({ scope: 'dia', fmt: 'img', dayKind: 'jogos' }));
    await page.waitForTimeout(900);
    const dim = async () => page.evaluate(async () => { const im = document.querySelector('#shOut img'); if (!im) return ''; await im.decode().catch(() => {}); return im.naturalWidth + 'x' + im.naturalHeight; });
    (await dim()) === '1080x1350' ? ok('partilhar: dia em 4:5 (1080x1350)') : bad('partilhar: dia 4:5 errado → ' + await dim());
    for (const [k, v] of [['1x1', '1080x1080'], ['9x16', '1080x1920']]) { await page.click(`[data-size="${k}"]`); await page.waitForTimeout(500); (await dim()) === v ? ok(`partilhar: ${k} = ${v}`) : bad(`partilhar: ${k} errado → ` + await dim()); }
    await page.click('[data-scope="jogo"]'); await page.waitForTimeout(1000);
    const cap = await page.evaluate(() => (document.getElementById('shCap') || {}).value || '');
    cap.includes('FC Porto 3-1 Fonte Bastardo') && cap.includes('https://dragaostats.pt') && cap.includes('#FCPorto') ? ok('partilhar: legenda do jogo com resultado, link e hashtags') : bad('partilhar: legenda do jogo → ' + cap);
    await page.click('[data-rede="rd"]');
    const rd = await page.evaluate(() => document.getElementById('shCap').value);
    rd.includes('#') ? bad('partilhar: legenda Reddit ainda tem hashtags') : ok('partilhar: legenda Reddit sem hashtags');
    await page.click('[data-scope="dia"]'); await page.waitForTimeout(400); await page.click('[data-fmt="reel"]'); await page.click('#shGo');
    let pronto = false; for (let i = 0; i < 60 && !pronto; i++) { await page.waitForTimeout(2000); pronto = await page.evaluate(() => !!document.querySelector('#shOut video')); }
    pronto ? ok('partilhar: reel do dia criado') : bad('partilhar: reel do dia não ficou pronto');
    errs.length ? bad(`partilhar: erros JS → ${errs.join(' | ')}`) : ok('partilhar: sem erros JS');
    await page.close();
  }
  await browser.close(); srv.close();
  console.log(fails ? `\n${fails} problema(s) — NÃO publicar.` : '\nTudo ok.'); process.exit(fails ? 1 : 0);
})();
