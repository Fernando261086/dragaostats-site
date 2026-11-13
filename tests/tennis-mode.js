// Competição do tipo «ténis» (v285): node tests/tennis-mode.js [--shots dir]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css' };
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const hoje = new Date(); const dia = String(hoje.getDate());
const mock = { ok:true, hasAdminAuth:false,
  competitions:[{id:'c1',name:'Época 26/27',mode:'matches'},{id:'t1',name:'Ténis 2026',mode:'tenis'},{id:'m1',name:'Jogos X',mode:'medals'}],
  data:{ c1:{events:[],status:{}},
    t1:{ events:[{id:'e1',day:dia,t:'10:00',sport:'Ténis',athlete:'Nuno Borges',opp:'Casper Ruud',detail:'Singulares',phase:'Final',country:'França',watchName:'Eurosport',seq:1}], status:{ e1:{ passou:'yes', medal:'gold', resultado:'6-4 7-6(5)' } } },
    m1:{ events:[{id:'e2',day:dia,t:'11:00',sport:'Natação',athlete:'Fulano',detail:'100m',phase:'Final',seq:2}], status:{} } } };
let fails = 0; const bad = m => { fails++; console.log('❌', m); }; const ok = m => console.log('✅', m);
(async () => {
  const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith(path.sep)) p += 'index.html';
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'content-type': MIME[path.extname(p)] || 'text/plain'}); r.end(d); }); }).listen(0);
  const port = srv.address().port, browser = await chromium.launch();
  for (const [label, query] of [['público','?view=readonly'], ['edição','?view=edit']]) for (const theme of ['dark','light']) for (const w of [360, 768]) {
    const tag = `${label} ${theme} ${w}px`, page = await browser.newPage({ viewport: { width: w, height: 900 } }), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(([d, theme]) => { try { localStorage.setItem('dia22-viewer-name','Teste'); localStorage.setItem('dia22-theme', theme); localStorage.setItem('dia22-pinned-comp','t1'); } catch (e) {}
      const f = window.fetch; window.fetch = (u, o) => String(u).includes('script.google.com') ? Promise.resolve(new Response(JSON.stringify(d), {status:200, headers:{'content-type':'application/json'}})) : f.apply(window, [u, o]); }, [mock, theme]);
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html${query}`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.evaluate(() => { const o = document.getElementById('introOverlay'); if (o) o.style.display = 'none'; });
    const info = await page.evaluate(() => ({ comp: activeCompId, mode: currentCompMode(), tenis: isTenis_(), btn: (()=>{ const b = document.getElementById('viewRankingsBtn'); return !!b && b.style.display !== 'none'; })(), opts: [...document.querySelectorAll('#compSelect option')].map(o => o.textContent) }));
    if (label === 'público') {
      info.comp !== 't1' ? ok(`${tag}: não entra na competição de ténis`) : bad(`${tag}: entrou na competição de ténis`);
      info.opts.some(t => /Ténis/.test(t)) ? bad(`${tag}: ténis visível no seletor`) : ok(`${tag}: ténis escondido no seletor`);
      info.btn ? bad(`${tag}: botão Ténis visível`) : ok(`${tag}: sem botão Ténis`);
    } else {
      info.comp === 't1' && info.tenis && info.mode === 'medals' ? ok(`${tag}: competição de ténis ativa (comporta-se como medalhas)`) : bad(`${tag}: comp=${info.comp} tenis=${info.tenis} mode=${info.mode}`);
      info.btn ? ok(`${tag}: botão Ténis visível na competição de ténis`) : bad(`${tag}: botão Ténis escondido`);
      const card = await page.evaluate(() => document.getElementById('timeline').textContent);
      /Nuno Borges vs Casper Ruud/.test(card) ? ok(`${tag}: cartão «atleta vs adversário»`) : bad(`${tag}: cartão sem adversário → ${card.slice(0,120)}`);
      /Singulares/.test(card) && /Final/.test(card) && /França/.test(card) ? ok(`${tag}: detalhe, fase e país no cartão`) : bad(`${tag}: falta detalhe/fase/país`);
      const lab = await page.evaluate(() => { const r = document.querySelector('#timeline .card, #timeline .event, #timeline'); document.querySelectorAll('#timeline .c-medal,#timeline .medal-btn').forEach(()=>{}); return [...document.querySelectorAll('#timeline [data-medal]')].map(b => b.textContent.trim()); });
      if (lab.length) (lab.some(t => /Campeão/.test(t)) && lab.some(t => /Vice/.test(t)) && !lab.some(t => /Bronze|Ouro/.test(t))) ? ok(`${tag}: Campeão / Vice-campeão (sem Ouro/Bronze)`) : bad(`${tag}: etiquetas ${lab}`);
      const tb = await page.evaluate(() => { const vis = id => { const b = document.getElementById(id); return !!b && b.style.display !== 'none' && getComputedStyle(b).display !== 'none'; }; ['pollBanner','newsletterBanner','newsletterBox'].forEach(i => { const e = document.getElementById(i); if(e) e.style.display = 'flex'; });
        return { res: document.getElementById('viewMedalsBtn').textContent.trim(), resVis: vis('viewMedalsBtn'), stats: vis('viewStatsBtn'), rk: vis('viewRankingsBtn'), poll: vis('pollBanner'), nl: vis('newsletterBanner'), box: vis('newsletterBox') }; });
      tb.res === 'Resultados' && tb.resVis && !tb.stats && tb.rk ? ok(`${tag}: separadores Resultados + Rankings, sem Estatísticas`) : bad(`${tag}: separadores ${JSON.stringify(tb)}`);
      !tb.poll && !tb.nl && !tb.box ? ok(`${tag}: sem sondagem, banner de avisos/newsletter nem caixa de newsletter`) : bad(`${tag}: avisos visíveis ${JSON.stringify(tb)}`);
      await page.evaluate(() => document.getElementById('viewMedalsBtn').click()); await page.waitForTimeout(300);
      const rs = await page.evaluate(() => ({ t: document.getElementById('medalsView').textContent, win: document.querySelectorAll('#medalsView .tn-tc.win').length, ov: Math.max(document.documentElement.scrollWidth - window.innerWidth, 0) }));
      /Títulos/.test(rs.t) && /Nuno Borges/.test(rs.t) && /Campeão/.test(rs.t) && rs.win === 1 && !/Ouro|Bronze/.test(rs.t) ? ok(`${tag}: Resultados por torneio com destaque do título e contagem`) : bad(`${tag}: Resultados ${JSON.stringify(rs)}`);
      rs.ov > 1 ? bad(`${tag}: Resultados com deslize lateral ${rs.ov}px`) : ok(`${tag}: Resultados sem deslize lateral`);
      await page.evaluate(() => document.querySelector('#medalsView [data-tsel]').click()); await page.waitForTimeout(250);
      const dt = await page.evaluate(() => ({ t: document.getElementById('medalsView').textContent, win: document.querySelectorAll('#medalsView .tn-rr.win').length, back: !!document.querySelector('[data-rback]'), ov: Math.max(document.documentElement.scrollWidth - window.innerWidth, 0) }));
      /6-4 7-6/.test(dt.t) && /Casper Ruud/.test(dt.t) && dt.win === 1 && dt.back && dt.ov <= 1 ? ok(`${tag}: detalhe do torneio com jogos e resultados`) : bad(`${tag}: detalhe ${JSON.stringify(dt)}`);
      await page.evaluate(() => document.querySelector('[data-rback]').click()); await page.waitForTimeout(200);
      await page.evaluate(() => document.getElementById('viewRankingsBtn').click()); await page.waitForTimeout(500);
      const rk = await page.evaluate(() => ({ shown: document.getElementById('tennisView').offsetParent !== null, cal: document.getElementById('timeline').offsetParent !== null }));
      rk.shown && !rk.cal ? ok(`${tag}: separador Rankings abre a vista`) : bad(`${tag}: Rankings ${JSON.stringify(rk)}`);
      await page.evaluate(() => document.getElementById('viewCalendarBtn').click()); await page.waitForTimeout(300);
      await page.evaluate(() => document.getElementById('addToggleBtn').click()); await page.waitForTimeout(300);
      const f = await page.evaluate(() => ({ opp: document.getElementById('fOpp').offsetParent !== null, ctry: document.getElementById('fCountry').offsetParent !== null, sport: document.getElementById('fSport').value, det: document.getElementById('fDetalhe').getAttribute('list') }));
      const f2 = await page.evaluate(() => ({ type: document.getElementById('fDia').type, piso: document.getElementById('fPiso').offsetParent !== null }));
      f2.type === 'date' && f2.piso ? ok(`${tag}: «Dia» é calendário e há campo Piso`) : bad(`${tag}: dia/piso ${JSON.stringify(f2)}`);
      f.opp && f.ctry && f.sport === 'Ténis' && f.det === 'tnDetalhes' ? ok(`${tag}: formulário com adversário, país e «Ténis» por defeito`) : bad(`${tag}: formulário ${JSON.stringify(f)}`);
      await page.evaluate(() => { document.getElementById('fDia').value='2026-11-19'; document.getElementById('fPiso').value='Terra batida'; document.getElementById('fHora').value='12:00'; document.getElementById('fAtleta').value='Jaime Faria'; document.getElementById('fOpp').value='Fulano'; document.getElementById('fCountry').value='Portugal'; document.getElementById('fDetalhe').value='Pares'; document.getElementById('fFase').value='Meias'; });
      await page.evaluate(() => document.getElementById('addSaveBtn').click()); await page.waitForTimeout(600);
      const ev = await page.evaluate(() => EVENTS.find(e => e.athlete === 'Jaime Faria'));
      ev && ev.opp === 'Fulano' && ev.country === 'Portugal' && ev.piso === 'Terra batida' && ev.day === '19' && ev.date === '2026-11-19' ? ok(`${tag}: guarda adversário, país, piso, dia e data`) : bad(`${tag}: evento guardado ${JSON.stringify(ev)}`);
      // competição de medalhas normal NÃO tem os campos do ténis
      await page.evaluate(() => switchToCompetition('m1')); await page.waitForTimeout(400);
      const m = await page.evaluate(() => ({ btn: document.getElementById('viewRankingsBtn').style.display !== 'none', tn: isTenis_(), opp: document.getElementById('fOpp').offsetParent !== null }));
      !m.btn && !m.tn ? ok(`${tag}: medalhas normais sem botão nem campos de ténis`) : bad(`${tag}: medalhas com ténis ${JSON.stringify(m)}`);
      if (shots) { await page.evaluate(() => switchToCompetition('t1')); await page.waitForTimeout(400); await page.screenshot({ path: `${shots}/tm-${theme}-${w}.png`, fullPage: false }); }
    }
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ov > 1 ? bad(`${tag}: deslize lateral ${ov}px`) : ok(`${tag}: sem deslize lateral`);
    errs.length ? bad(`${tag}: erros JS ${errs}`) : ok(`${tag}: sem erros JS`);
    await page.close();
  }
  await browser.close(); srv.close(); console.log(fails ? `\n${fails} falha(s)` : '\nTudo certo'); process.exit(fails ? 1 : 0);
})();
