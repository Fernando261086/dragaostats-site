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
  { // v250: ecrã do basquetebol (Sofascore): parciais, gráfico, lance a lance, jogadores ordenáveis, estatísticas, relógio decrescente
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html?view=readonly`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const ev = { id: 'bk1', sport: 'Basquetebol', athlete: 'Ovarense', local: 'fora' };
      const pl = []; for (let i = 1; i <= 20; i++) pl.push([i * 100, i % 2, (i % 3) + 1, 'Jog ' + i, i * 2, i * 2 - 1]);
      BASKET = { bk1: { t: 1, f: 1, c: 0, q: [[12, 23], [25, 15], [19, 17], [20, 23]], g: [-5, -3, 2, 4, -1, -6, 3, 8, 5, -2], st: [['Free throws', '17/22 (77%)', '13/16 (81%)'], ['Biggest lead', '9', '4']],
        jg: [['A. Silva', '7', 0, 20, 12, 5, 2, 1, 4, 7.1, '4/9', '1/3', '3/4', 2, 0, 3, 1, 1], ['B. Costa', '9', 0, 25, 18, 2, 1, 0, -3, 8.0, '6/10', '2/4', '4/4', 1, 1, 2, 0, 1], ['C. Adv', '5', 1, 30, 9, 3, 3, 1, 2, 6.5, '3/8', '1/2', '2/2', 3, 0, 4, 0, 1]], pl } };
      const h = basketHtml_(ev);
      const host = document.createElement('div'); host.innerHTML = h; document.body.appendChild(host);
      const out = { q: !!host.querySelector('.bk-q'), g: !!host.querySelector('.bk-graph'), rows: host.querySelectorAll('.bk-row').length, hidden: host.querySelectorAll('.bk-row.gd-hide').length, jg: host.querySelectorAll('.bk-jg').length, st: !!host.querySelector('.gd-st'), tot: host.querySelector('.bk-q tbody tr td:last-child').textContent };
      host.querySelectorAll('.bk-jg')[0].querySelector('.bk-th[data-bkc="4"]').click();
      out.first = host.querySelector('.bk-jg tbody tr td').textContent;
      out.run = liveClockText_([600, Date.now() - 20000, 120, 0, -1, 1], Date.now()); out.stop = liveClockText_([425, Date.now() - 20000, 120, 0, -1, 0], Date.now());
      host.remove(); return out;
    });
    r.q && r.g && r.jg === 2 && r.st && r.rows === 20 && r.hidden === 8 && r.tot === '76' ? ok('basquetebol: parciais, gráfico, 20 cestos (8 escondidos), 2 tabelas, estatísticas') : bad('basquetebol: bloco → ' + JSON.stringify(r));
    /B\. Costa/.test(r.first) ? ok('basquetebol: tabela ordena por pontos') : bad('basquetebol: ordenação → ' + r.first);
    r.run === '9:40' && r.stop === '7:05' ? ok('basquetebol: relógio decrescente (a correr / parado)') : bad('basquetebol: relógio → ' + r.run + ' / ' + r.stop);
    const sc = await page.evaluate(() => { const ev = { id: 'bk1', sport: 'Basquetebol', athlete: 'Ovarense', local: 'fora' }; BASKET = { bk1: { jg: [['A', '1', 0, 20, 18], ['B', '2', 0, 20, 12], ['C', '3', 1, 20, 30]] } }; return { s: shareScorers_(ev), k: [resultKind_(ev, { resultado: '78-76' }), resultKind_({ local: 'casa' }, { resultado: '1-1' }), resultKind_({ local: 'casa' }, { resultado: '0-2' })] }; });
    sc.s && sc.s.label === 'Pontos' && sc.s.items.join() === 'A 18,B 12' && sc.k.join() === 'loss,draw,loss' ? ok('reel/legenda: marcadores do basquetebol e tipo de resultado') : bad('reel/legenda: ' + JSON.stringify(sc));
    errs.length ? bad('basquetebol: erros JS → ' + errs.join(' | ')) : ok('basquetebol: sem erros JS');
    await page.close();
  }
  { // v252: fichas (andebol, futebol, voleibol)
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html?view=readonly`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      FICHA = { a1: { k: 'A', g: [1, 2, 3, 2, 4, 5, 3], jg: [['A', '7', 0, 0, 5, 8, 1, 2, 1, 0, 0, ''], ['G', '1', 0, 0, 0, 0, 0, 0, 0, 0, 0, '9/20'], ['X', '9', 1, 0, 3, 6, 0, 1, 0, 1, 1, '']] },
        f1: { k: 'F', g: [3, -2, 5, 1, -4], jg: [['J', '10', 0, 90, 1, 1, 3, '30/40', 2, 5, 7.8], ['K', '4', 1, 70, 0, 0, 1, '20/30', 1, 3, 6.4]] },
        v1: { k: 'V', vs: [[1, 2, 1, 3, 4], [-1, -2, 0, 1]], vp: [[25, 20], [21, 25]] } };
      const h = ['A|a1|Andebol', 'F|f1|Equipa B', 'V|v1|Voleibol'].map(x => { const [k, id, sp] = x.split('|'); const d = document.createElement('div'); d.innerHTML = fichaHtml_({ id, sport: sp, athlete: 'Adv' }); return d; });
      return { a: h[0].querySelectorAll('.bk-graph').length + '/' + h[0].querySelectorAll('tbody tr').length, f: h[1].querySelectorAll('.bk-graph').length + '/' + h[1].querySelectorAll('tbody tr').length, v: h[2].querySelectorAll('.fk-set').length + '/' + h[2].querySelectorAll('.bk-graph').length, vt: h[2].textContent.includes('25–20') };
    });
    r.a === '1/3' && r.f === '1/2' && r.v === '2/2' && r.vt ? ok('fichas: andebol, futebol e voleibol (gráficos, jogadores, sets)') : bad('fichas → ' + JSON.stringify(r));
    errs.length ? bad('fichas: erros JS → ' + errs.join(' | ')) : ok('fichas: sem erros JS');
    await page.close();
  }
  { // v264: frente a frente (várias épocas), jogador do jogo (voto único) e «Fui ao jogo»
    const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const m3 = { ok:true, hasAdminAuth:false, competitions:[{id:'c1',name:'Época 26/27',mode:'matches'},{id:'c0',name:'Época 25/26',mode:'matches'}], reactions:{},
      plantel:{ Voleibol:{ t:Date.now(), j:[[1,'Ana Silva','P'],[2,'Bia Costa','C'],[3,'Carla Dias','L'],[4,'Dora Lima','O'],[5,'Eva Reis','P'],[6,'Filipa Sá','C']], s:[] } },
      data:{ c0:{ events:[{id:'o1',day:'2025-11-02',t:'18:00',sport:'Voleibol',athlete:'Sporting CP',local:'casa',detail:'Campeonato'}], status:{ o1:{resultado:'3-0',resultTag:'win'} } },
             c1:{ events:[{id:'n1',day:iso(-20),t:'18:00',sport:'Voleibol',athlete:'Sporting',local:'casa'},{id:'n2',day:iso(-1),t:'18:00',sport:'Voleibol',athlete:'Benfica',local:'casa'},{id:'n3',day:iso(5),t:'18:00',sport:'Voleibol',athlete:'Sporting',local:'casa'}],
                  status:{ n1:{resultado:'3-1',resultTag:'win'}, n2:{resultado:'3-2',resultTag:'win'} } } } };
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(d => {
      window.__posts = []; try { localStorage.setItem('dia22-viewer-name', 'Teste'); localStorage.removeItem('dia22-mvp'); localStorage.removeItem('dia22-fui'); } catch (e) {}
      const f = window.fetch; window.fetch = (...a) => { if (String(a[0]).includes('script.google.com')) {
        if (a[1] && a[1].method === 'POST') { window.__posts.push(a[1].body); return Promise.resolve(new Response('{"ok":true}', {status:200})); }
        return Promise.resolve(new Response(JSON.stringify(d), {status:200, headers:{'content-type':'application/json'}})); } return f.apply(window, a); };
    }, m3);
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html?view=readonly`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const o = document.getElementById('introOverlay'); if (o) o.style.display = 'none'; openGamePage_('n3'); });
    await page.waitForTimeout(400);
    const h2h = await page.evaluate(() => { const e = document.querySelector('.h2h-card'); return e ? e.innerText.replace(/\s+/g, ' ') : ''; });
    /2 jogos/.test(h2h) && /2\s*VIT/i.test(h2h) && /25\/26/.test(h2h) ? ok('frente a frente: soma jogos de duas épocas') : bad('frente a frente → ' + h2h);
    await page.evaluate(() => openGamePage_('n2')); await page.waitForTimeout(400);
    const nc = await page.evaluate(() => document.querySelectorAll('.mvp-pick').length);
    nc === 6 ? ok('jogador do jogo: 6 candidatos (plantel)') : bad('jogador do jogo: candidatos = ' + nc);
    await page.click('.mvp-pick >> nth=1'); await page.click('#mvpOk'); await page.waitForTimeout(300);
    await page.click('#fuiBtn'); await page.waitForTimeout(300);
    const posts = await page.evaluate(() => window.__posts.join(' '));
    posts.includes('mvp:Bia Costa') && posts.includes('"emoji":"fui"') ? ok('voto e presença enviados ao Apps Script') : bad('POSTs → ' + posts);
    await page.evaluate(() => { gameSig_ = ''; renderGamePage_(); }); await page.waitForTimeout(300);
    const dep = await page.evaluate(() => ({ pick: document.querySelectorAll('.mvp-pick').length, fui: document.querySelectorAll('#fuiBtn').length }));
    dep.pick === 0 && dep.fui === 0 ? ok('voto e presença só uma vez por aparelho') : bad('depois de votar → ' + JSON.stringify(dep));
    await page.evaluate(() => openSportPage_('Voleibol')); await page.waitForTimeout(300);
    await page.click('[data-sptab=h2h]'); await page.waitForTimeout(200);
    const nOpp = await page.evaluate(() => document.querySelectorAll('.h2h-opp').length);
    nOpp === 2 ? ok('separador Confrontos: 2 adversários') : bad('separador Confrontos: ' + nOpp);
    const ovf = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ovf > 1 ? bad('confrontos: deslize lateral de ' + ovf + 'px') : ok('confrontos: sem deslize lateral');
    errs.length ? bad('v264: erros JS → ' + errs.join(' | ')) : ok('v264: sem erros JS');
    await page.close();
  }
  await browser.close(); srv.close();
  console.log(fails ? `\n${fails} problema(s) — NÃO publicar.` : '\nTudo ok.'); process.exit(fails ? 1 : 0);
})();
