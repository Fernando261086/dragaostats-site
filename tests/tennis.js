// Painel «🎾 Ténis» (só edição): node tests/tennis.js [--shots dir]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css' };
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const mock = { ok:true, hasAdminAuth:false, competitions:[{id:'c1',name:'Época 26/27',mode:'matches'},{id:'t1',name:'Ténis 2026',mode:'tenis'}], data:{ c1:{ events:[], status:{} }, t1:{ events:[], status:{} } } };
const now = Math.floor(Date.now()/1000);
const J = (id,n,g,r,extra) => Object.assign({ id, n, g, c:'PT', r, p: 1000-r, pr: r+3, b: r-10, t: 20, res: [], h: [], m: {}, u: '2026-11-13 21:00' }, extra||{});
let tenis = { ok:true, top:{ M:[[1,'Alexander Zverev','DE',9000],[2,'Jannik Sinner','IT',8800]], F:[[1,'Elena Rybakina','KZ',8099]] },
  extras:[],
  jogadores:[
    J(125006,'Nuno Borges','M',49,{ lr:41, h:[['2026-10-26',55],['2026-11-02',52],['2026-11-09',49]], m:{pm:{r:150,pts:300}},
      res:[[now-86400,'Casper Ruud','D','6-7(5) 4-6','Quarterfinals','Paris','ATP','Hardcourt indoor',''],[now-2*86400,'Ignacio Buse','V','6-0 6-2','Round of 16','Paris','ATP','Hardcourt indoor',''],[now-9*86400,'A Muito Comprido Nome Sobrenome Longo / Parceiro Dois','V','7-6(3) 6-4','Final','Challenger de uma cidade com nome enorme, Portugal','Challenger','Clay','Retired']] }),
    J(199408,'Francisca Jorge','F',241,{ d:[107,786,-1], h:[['2026-11-09',241]] }),
    J(555,'Francisco Cabral','M',null,{ x:1, r:undefined, p:undefined, pr:undefined, b:undefined }) ] };
const carrJ = []; // v294: carreira simulada (singulares)
{ const T=[['Paris','ATP','Hardcourt indoor'],['Maia Challenger','Challenger','Clay'],['ITF M25 Faro, Portugal','ITF Men','Hardcourt outdoor'],['Torneio com um nome muito comprido de propósito, Portugal','Challenger','Grass']];
  const rounds=['Qualification round 1','Round of 32','Round of 16','Quarterfinals','Semifinals','Final'];
  for(let y=0;y<4;y++) for(let t=0;t<T.length;t++){ const base=now-(y*365+t*60)*86400; for(let r=0;r<(t===1&&y===0?6:3);r++) carrJ.push([base-(5-r)*86400,'Adversário '+y+t+r,(t===1&&y===0)||r<2?'V':'D',r%2?'6-4 7-6(5)':'6-3 6-2',rounds[r],T[t][0],T[t][1],T[t][2],'']); }
  carrJ.push([now-9e7,'Exib','V','6-0 6-0','Final','Show','Exhibition','Hard','']); carrJ.sort((a,b)=>b[0]-a[0]); }
let fails = 0; const bad = m => { fails++; console.log('❌', m); }; const ok = m => console.log('✅', m);
(async () => {
  const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith(path.sep)) p += 'index.html';
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'content-type': MIME[path.extname(p)] || 'text/plain'}); r.end(d); }); }).listen(0);
  const port = srv.address().port, browser = await chromium.launch();
  for (const [label, query] of [['público','?view=readonly'], ['edição','?view=edit']]) for (const theme of ['dark','light']) for (const w of [360, 768]) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } }), tag = `${label} ${theme} ${w}px`;
    const errs = [], posts = []; page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(([d, t, theme, c]) => {
      try { localStorage.setItem('dia22-viewer-name','Teste'); localStorage.setItem('dia22-theme', theme); localStorage.setItem('dia22-pinned-comp','t1'); } catch (e) {}
      const f = window.fetch; window.fetch = (u, o) => {
        if (String(u).includes('script.google.com')) {
          if (o && o.method === 'POST') { let b = {}; try { b = JSON.parse(o.body); } catch (e) {} window.__posts = (window.__posts||[]).concat([b]);
            let out = t;
            if (b.tenisRankHist) { const ms=[]; for (let y=2012;y<=2026;y++) for (let m=1;m<=12;m++) { if (y===2026 && m>10) break; ms.push(y+'-'+String(m).padStart(2,'0')); } const sS=ms.filter(x=>x>='2016-01').map((x,i)=>[x,Math.max(36,1300-i*9),Math.max(10,1000-i*6)]); const sD=ms.filter(x=>x>='2021-06').map((x,i)=>[x,Math.max(80,600-i*7),50]); return Promise.resolve(new Response(JSON.stringify(b.tenisRankHist.nome==='Nuno Borges' ? {ok:true,s:sS,d:sD,pend:0} : {ok:true,s:[],d:[],pend:12}), {status:200, headers:{'content-type':'application/json'}})); }
            if (b.tenisCarreira) return Promise.resolve(new Response(JSON.stringify(b.tenisCarreira.id > 0 ? { ok:true, c:{ id:b.tenisCarreira.id, n:'x', ts:Date.now(), u:'2026-11-14 00:00', j:window.__carrJ } } : { ok:false, erro:'sem ficha' }), {status:200, headers:{'content-type':'application/json'}}));
            if (b.tenisManualAdd) { out = JSON.parse(JSON.stringify(t)); const a = b.tenisManualAdd; const rec = { id: -5, n: a.nome, g: a.g, x: 1, man: 1, h: [], res: [] }; if (a.s) rec.r = Number(a.s); if (a.p) rec.d = [Number(a.p), 0]; out.jogadores.push(rec); }
            if (b.tenisManual) { out = JSON.parse(JSON.stringify(t)); const p = out.jogadores.find(x => x.id === b.tenisManual.id); p.m = p.m||{}; if (b.tenisManual.pm) p.m.pm = b.tenisManual.pm; }
            return Promise.resolve(new Response(JSON.stringify(out), {status:200, headers:{'content-type':'application/json'}})); }
          return Promise.resolve(new Response(JSON.stringify(d), {status:200, headers:{'content-type':'application/json'}})); }
        return f.apply(window, [u, o]); };
      window.prompt = () => '23 3150'; window.__carrJ = c;
    }, [mock, tenis, theme, carrJ]);
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html${query}`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.evaluate(() => { const o = document.getElementById('introOverlay'); if (o) o.style.display = 'none'; });
    const has = await page.evaluate(() => { const b = document.getElementById('viewRankingsBtn'); return !!b && b.style.display !== 'none'; });
    if (label === 'público') { has ? bad(`${tag}: botão Ténis visível no «só ver»`) : ok(`${tag}: sem botão Ténis`); const pn = await page.evaluate(() => typeof openTennisPanel_); errs.length ? bad(`${tag}: erros JS ${errs}`) : ok(`${tag}: sem erros JS`); await page.close(); continue; }
    if (!has) { bad(`${tag}: sem botão Ténis em edição`); await page.close(); continue; }
    await page.evaluate(() => document.getElementById('viewRankingsBtn').click()); await page.waitForTimeout(600);
    const rows = await page.evaluate(() => document.querySelectorAll('#tnBody .tn-row[data-pid]').length);
    rows >= 2 ? ok(`${tag}: rankings mostram ${rows} linhas`) : bad(`${tag}: rankings com ${rows} linhas`);
    const ov = () => page.evaluate(() => { const s = document.getElementById('tennisView'); return Math.max(s.scrollWidth - s.clientWidth, document.documentElement.scrollWidth - window.innerWidth); });
    const cabralSing = await page.evaluate(() => { const l = document.querySelector('#tnBody .tn-list'); return !!l && /Cabral/.test(l.textContent); });
    cabralSing ? bad(`${tag}: tenista sem pontos de singulares aparece na lista de singulares`) : ok(`${tag}: sem tenistas sem ranking nos singulares`);
    (await ov()) > 1 ? bad(`${tag}: rankings com deslize lateral ${await ov()}px`) : ok(`${tag}: rankings sem deslize lateral`);
    if (shots) await page.screenshot({ path: `${shots}/tn-${theme}-${w}-rank.png` });
    await page.evaluate(() => document.querySelector('#tnBody [data-gen="F"]').click()); await page.waitForTimeout(150);
    (await page.evaluate(() => /Francisca Jorge/.test(document.getElementById('tnBody').textContent) && /#107/.test(document.getElementById('tnBody').textContent))) ? ok(`${tag}: WTA mostra singulares e pares`) : bad(`${tag}: WTA sem pares`);
    await page.evaluate(() => document.querySelector('#tnBody [data-tab="atl"]').click()); await page.waitForTimeout(150);
    if (shots) await page.screenshot({ path: `${shots}/tn-${theme}-${w}-atl.png` });
    await page.evaluate(() => document.querySelector('#tnBody [data-pid="125006"]').click()); await page.waitForTimeout(200);
    const ficha = await page.evaluate(() => ({ svg: !!document.querySelector('.tn-chart'), g: document.querySelectorAll('.tn-g').length, t: document.getElementById('tnBody').textContent }));
    ficha.svg && ficha.g === 3 ? ok(`${tag}: ficha com gráfico e 3 jogos`) : bad(`${tag}: ficha svg=${ficha.svg} jogos=${ficha.g}`);
    (/Não passou/.test(ficha.t) && /Passou/.test(ficha.t) && /Campeão/.test(ficha.t)) ? ok(`${tag}: Passou / Não passou / Campeão`) : bad(`${tag}: etiquetas em falta`);
    (await ov()) > 1 ? bad(`${tag}: ficha com deslize lateral ${await ov()}px`) : ok(`${tag}: ficha sem deslize lateral`);
    if (shots) await page.screenshot({ path: `${shots}/tn-${theme}-${w}-ficha.png` });
    // v301: a ficha já não tem o separador Carreira (passou para os Resultados)
    (await page.evaluate(() => !document.querySelector('#tnBody [data-ftab="carr"]') && !!document.querySelector('#tnBody [data-ftab="rank"]'))) ? ok(`${tag}: ficha sem separador Carreira (fica Resumo · Ranking)`) : bad(`${tag}: ficha com separador Carreira ou sem Ranking`);
    // v296: separador Ranking (gráfico desde 2010)
    await page.evaluate(() => document.querySelector('#tnBody [data-ftab="rank"]').click()); await page.waitForTimeout(500);
    const rk = await page.evaluate(() => ({ svg: !!document.querySelector('#tnBody .tn-rhc'), ls: document.querySelectorAll('#tnBody .tn-rhc path[stroke-width]').length, rows: document.querySelectorAll('#tnBody .tn-rhr').length, t: document.getElementById('tnBody').textContent, chips: [...document.querySelectorAll('#tnBody [data-rhs]')].map(b => b.dataset.rhs).join() }));
    rk.svg && rk.ls === 2 && rk.rows >= 8 ? ok(`${tag}: Ranking com gráfico (2 linhas) e ${rk.rows - 1} anos`) : bad(`${tag}: Ranking svg=${rk.svg} linhas=${rk.ls} filas=${rk.rows}`);
    /Melhor singulares/.test(rk.t) && /#49/.test(rk.t) && rk.chips === 'ambos,s,d' ? ok(`${tag}: Ranking mostra o melhor (#49) e os filtros ${rk.chips}`) : bad(`${tag}: Ranking sem melhor/filtros (${rk.chips})`);
    (await ov()) > 1 ? bad(`${tag}: Ranking com deslize lateral ${await ov()}px`) : ok(`${tag}: Ranking sem deslize lateral`);
    if (shots) await page.screenshot({ path: `${shots}/tn-${theme}-${w}-ranking.png` });
    // v298: período, cartão ao passar o rato/tocar, área
    const v298 = await page.evaluate(() => ({ per: [...document.querySelectorAll('#tnBody [data-rhp]')].map(b => b.dataset.rhp).join(), areas: document.querySelectorAll('#tnBody .tn-rhc path[fill^="url"]').length }));
    v298.per === 'tudo,10,5' && v298.areas === 1 ? ok(`${tag}: gráfico com área e períodos ${v298.per}`) : bad(`${tag}: gráfico v298 ${JSON.stringify(v298)}`);
    const sv = await page.evaluate(() => { const r = document.querySelector('#tnBody .tn-rhc').getBoundingClientRect(); return { x: r.left + r.width * 0.6, y: r.top + r.height * 0.5 }; });
    await page.mouse.move(sv.x, sv.y); await page.waitForTimeout(150);
    const tp = await page.evaluate(() => { const t = document.querySelector('#tnBody .tn-tip'); const r = t.getBoundingClientRect(), w = document.querySelector('#tnBody .tn-rhw').getBoundingClientRect(); return { vis: !t.hidden, txt: t.textContent, dentro: r.left >= w.left - 1 && r.right <= w.right + 1 }; });
    tp.vis && /#\d+/.test(tp.txt) && tp.dentro ? ok(`${tag}: cartão do mês (${tp.txt.slice(0, 40)})`) : bad(`${tag}: cartão do mês ${JSON.stringify(tp)}`);
    await page.evaluate(() => document.querySelector('#tnBody [data-rhp="5"]').click()); await page.waitForTimeout(150);
    const z = await page.evaluate(() => ({ on: document.querySelector('#tnBody [data-rhp="5"]').classList.contains('on'), anos: [...document.querySelectorAll('#tnBody .tn-rhc text.tn-ct')].map(t => t.textContent).filter(t => /^\d{4}$/.test(t)) }));
    z.on && z.anos.length >= 2 && z.anos.length <= 7 ? ok(`${tag}: zoom 5 anos (${z.anos.join(',')})`) : bad(`${tag}: zoom 5 anos ${JSON.stringify(z)}`);
    (await ov()) > 1 ? bad(`${tag}: gráfico com deslize lateral`) : ok(`${tag}: gráfico sem deslize lateral`);
    if (shots) await page.screenshot({ path: `${shots}/tn-${theme}-${w}-grafico.png` });
    await page.evaluate(() => document.querySelector('#tnBody [data-rhp="tudo"]').click()); await page.waitForTimeout(100);
    await page.evaluate(() => document.querySelector('#tnBody [data-rhs="d"]').click()); await page.waitForTimeout(100);
    (await page.evaluate(() => document.querySelectorAll('#tnBody .tn-rhc path[stroke-width]').length)) === 1 ? ok(`${tag}: filtro Pares deixa 1 linha`) : bad(`${tag}: filtro Pares`);
    (await page.evaluate(() => (window.__posts||[]).some(p => p.tenisRankHist && p.tenisRankHist.nome === 'Nuno Borges' && p.adminPassword !== undefined))) ? ok(`${tag}: pedido do ranking leva a password`) : bad(`${tag}: pedido do ranking sem password`);
    // sem histórico (arquivo ainda a importar) e sem separador nas mulheres
    await page.evaluate(() => { document.querySelector('#tnBody .tn-back').click(); });
    await page.evaluate(() => document.querySelector('#tnBody [data-pid="199408"]').click()); await page.waitForTimeout(150);
    (await page.evaluate(() => !document.querySelector('#tnBody [data-ftab="rank"]'))) ? ok(`${tag}: mulheres sem separador Ranking`) : bad(`${tag}: mulheres com separador Ranking`);
    await page.evaluate(() => document.querySelector('#tnBody .tn-back').click());
    await page.evaluate(() => document.querySelector('#tnBody [data-pid="125006"]').click()); await page.waitForTimeout(150);
    // v296: Resultados — época anterior
    await page.evaluate(() => { setView('medalhas'); }); await page.waitForTimeout(300);
    (await page.evaluate(() => !!document.getElementById('tnRAno'))) ? ok(`${tag}: Resultados com seletor de época`) : bad(`${tag}: Resultados sem seletor de época`);
    const ano = String(new Date(carrJ[carrJ.length - 1][0] * 1000).getFullYear());
    await page.evaluate(a => { const s = document.getElementById('tnRAno'); s.value = a; s.onchange(); }, ano); await page.waitForTimeout(900);
    const ra = await page.evaluate(() => ({ cards: document.querySelectorAll('#medalsView .tn-tor').length, t: document.getElementById('medalsView').textContent, chips: document.querySelectorAll('#medalsView .tn-ra').length, sel: document.getElementById('tnRAno').value }));
    ra.cards >= 1 && /Parou em|Campeão|Final|✓/.test(ra.t) && ra.sel === ano ? ok(`${tag}: época ${ano} mostra ${ra.cards} torneios`) : bad(`${tag}: época ${ano} cards=${ra.cards} sel=${ra.sel}`);
    (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) > 1 ? bad(`${tag}: Resultados ${ano} com deslize lateral`) : ok(`${tag}: Resultados ${ano} sem deslize lateral`);
    await page.evaluate(() => { document.querySelectorAll('#medalsView details').forEach(d => d.open = true); });
    (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) > 1 ? bad(`${tag}: Resultados ${ano} aberto com deslize lateral`) : ok(`${tag}: Resultados ${ano} aberto sem deslize lateral`);
    // v297: menu «Tenista» (sem chips), opções legíveis, ano corrente na lista
    const v297 = await page.evaluate(() => { const a = document.getElementById('tnRAtl'); const y = document.getElementById('tnRAno'); const o = y && y.options[1]; const cs = o && getComputedStyle(o); return { chips: document.querySelectorAll('#medalsView .tn-ra, #medalsView .tn-rfil').length, atl: a ? a.options.length : 0, anos: y ? [...y.options].map(x => x.value) : [], optBg: cs && cs.backgroundColor, optCo: cs && cs.color }; });
    v297.chips === 0 && v297.atl >= 2 ? ok(`${tag}: menu Tenista (${v297.atl} opções, sem botões)`) : bad(`${tag}: menu Tenista ${JSON.stringify(v297)}`);
    v297.anos.includes(String(new Date().getFullYear())) ? ok(`${tag}: ano corrente na lista`) : bad(`${tag}: sem ano corrente ${v297.anos}`);
    v297.optBg !== v297.optCo ? ok(`${tag}: opções com contraste (${v297.optBg} / ${v297.optCo})`) : bad(`${tag}: opções sem contraste`);
    await page.evaluate(() => { const a = document.getElementById('tnRAtl'); a.value = a.options[1].value; a.onchange(); }); await page.waitForTimeout(150);
    (await page.evaluate(() => { const a = document.getElementById('tnRAtl'); return a && a.value !== '' && document.querySelectorAll('#medalsView .tn-tor').length >= 1; })) ? ok(`${tag}: filtrar por tenista`) : bad(`${tag}: filtro por tenista`);
    (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) > 1 ? bad(`${tag}: menus com deslize lateral`) : ok(`${tag}: menus sem deslize lateral`);
    await page.evaluate(a => { const s = document.getElementById('tnRAno'); s.value = String(new Date().getFullYear()); s.onchange(); }, ano); await page.waitForTimeout(700);
    (await page.evaluate(() => /Torneios de \d{4}/.test(document.getElementById('medalsView').textContent) && !!document.getElementById('tnRAnoUpd'))) ? ok(`${tag}: ano corrente abre com «Atualizar agora»`) : bad(`${tag}: ano corrente sem botão atualizar`);
    await page.evaluate(a => { const s = document.getElementById('tnRAno'); s.value = a; s.onchange(); }, ano); await page.waitForTimeout(500);
    if (shots) await page.screenshot({ path: `${shots}/tn-${theme}-${w}-epoca.png` });
    await page.evaluate(() => { const s = document.getElementById('tnRAno'); s.value = ''; s.onchange(); }); await page.waitForTimeout(200);
    // v300: «Carreira» nos Resultados (ao lado de «Melhores resultados»)
    const c0 = await page.evaluate(() => [...document.querySelectorAll('#medalsView [data-rord]')].map(b => b.dataset.rord));
    c0.join() === 'cron,melhores,carreira' ? ok(`${tag}: botões Mais recentes · Melhores · Carreira`) : bad(`${tag}: botões de ordem ${c0}`);
    await page.evaluate(() => { TN_RES_.atl = ''; document.querySelector('#medalsView [data-rord="carreira"]').click(); }); await page.waitForTimeout(300);
    const c1 = await page.evaluate(() => ({ rows: document.querySelectorAll('#medalsView .tn-crow').length, ano: !!document.getElementById('tnRAno'), on: document.querySelector('#medalsView [data-rord="carreira"]').classList.contains('on') }));
    c1.rows >= 1 && !c1.ano && c1.on ? ok(`${tag}: Carreira (todos) lista ${c1.rows} tenistas, sem menu de época`) : bad(`${tag}: Carreira todos ${JSON.stringify(c1)}`);
    (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) > 1 ? bad(`${tag}: Carreira (todos) com deslize lateral`) : ok(`${tag}: Carreira (todos) sem deslize lateral`);
    await page.evaluate(() => document.querySelector('#medalsView .tn-crow').click()); await page.waitForTimeout(300);
    const c2 = await page.evaluate(() => ({ k: document.querySelectorAll('#medalsView .tn-ckpis > div').length, ccat: document.querySelectorAll('#medalsView [data-ccat]').length, yr: document.querySelectorAll('#medalsView .tn-yr').length, pisos: !!document.querySelector('#medalsView .tn-pisos') }));
    c2.k === 4 && c2.ccat >= 2 && c2.yr >= 1 ? ok(`${tag}: Carreira de um tenista (KPIs, categorias, ${c2.yr} anos)`) : bad(`${tag}: Carreira tenista ${JSON.stringify(c2)}`);
    await page.evaluate(() => { document.querySelectorAll('#medalsView details').forEach(d => d.open = true); });
    (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) > 1 ? bad(`${tag}: Carreira (tenista) com deslize lateral`) : ok(`${tag}: Carreira (tenista) sem deslize lateral`);
    if (shots) await page.screenshot({ path: `${shots}/tn-${theme}-${w}-carreira.png` });
    (await page.evaluate(() => (window.__posts||[]).some(p => p.tenisCarreira && p.tenisCarreira.id === 125006 && p.adminPassword !== undefined))) ? ok(`${tag}: pedido da carreira leva a password`) : bad(`${tag}: pedido da carreira sem password`);
    await page.evaluate(() => { document.querySelector('#medalsView [data-rord="cron"]').click(); TN_RES_.atl = ''; renderTennisResults_(); }); await page.waitForTimeout(200);
    (await page.evaluate(() => { const o = [...document.getElementById('tnRAno').options].map(x => x.textContent); return !o.some(x => /Esta época/.test(x)) && /a decorrer/.test(o[0]); })) ? ok(`${tag}: menu de épocas só com anos (sem «Esta época»)`) : bad(`${tag}: menu de épocas com «Esta época»`);
    await page.evaluate(() => { setView('tenis-rank'); }); await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('#tnBody [data-tab="atl"]').click());
    await page.evaluate(() => document.querySelector('#tnBody [data-pid="125006"]').click()); await page.waitForTimeout(150);
    await page.evaluate(() => document.querySelector('#tnBody [data-ftab="res"]').click());
    await page.evaluate(() => document.querySelector('#tnBody [data-man="pm"]').click()); await page.waitForTimeout(300);
    const pm = await page.evaluate(() => (window.__posts||[]).some(p => p.tenisManual && p.tenisManual.pm && p.tenisManual.pm.r === 23 && p.adminPassword !== undefined));
    pm ? ok(`${tag}: editar pares envia {r:23} com password`) : bad(`${tag}: editar pares não enviou`);
    await page.evaluate(() => document.querySelector('#tnBody .tn-back').click());
    await page.evaluate(() => document.querySelector('#tnBody [data-tab="atl"]').click()); await page.waitForTimeout(100);
    await page.evaluate(() => document.getElementById('tnAdd').click()); await page.waitForTimeout(250);
    const dlg = await page.evaluate(() => ({ open: !!document.getElementById('tnAddOv'), fields: ['tnFN','tnFS','tnFP'].every(i => !!document.getElementById(i)), ov: Math.max(document.getElementById('tnAddOv').scrollWidth - document.getElementById('tnAddOv').clientWidth, 0) }));
    dlg.open && dlg.fields && dlg.ov <= 1 ? ok(`${tag}: janela Acrescentar com nome, singulares e pares`) : bad(`${tag}: janela ${JSON.stringify(dlg)}`);
    await page.evaluate(() => document.getElementById('tnFOK').click()); await page.waitForTimeout(150);
    (await page.evaluate(() => /Escreve o nome/.test(document.getElementById('tnFM').textContent))) ? ok(`${tag}: nome obrigatório`) : bad(`${tag}: aceitou sem nome`);
    if (shots) await page.screenshot({ path: `${shots}/tn-${theme}-${w}-add.png` });
    await page.fill('#tnFN', 'Francisco Cabral'); await page.fill('#tnFP', '12'); await page.evaluate(() => document.querySelector('[data-fg="M"]').click());
    await page.evaluate(() => document.getElementById('tnFOK').click()); await page.waitForTimeout(400);
    const posted = await page.evaluate(() => (window.__posts || []).filter(x => x.tenisManualAdd).pop());
    posted && posted.tenisManualAdd.nome === 'Francisco Cabral' && posted.tenisManualAdd.g === 'M' && posted.tenisManualAdd.s === '' && posted.tenisManualAdd.p === '12' && posted.adminPassword !== undefined ? ok(`${tag}: envia nome, género, pares e deixa singulares em branco`) : bad(`${tag}: POST ${JSON.stringify(posted)}`);
    (await page.evaluate(() => !document.getElementById('tnAddOv') && /Francisco Cabral/.test(document.getElementById('tnBody').textContent) && /à mão/.test(document.getElementById('tnBody').textContent))) ? ok(`${tag}: tenista à mão aparece na lista`) : bad(`${tag}: tenista à mão não apareceu`);
    errs.length ? bad(`${tag}: erros JS ${errs}`) : ok(`${tag}: sem erros JS`);
    await page.close();
  }
  // o GET público nunca deve pedir dados de ténis
  await browser.close(); srv.close(); console.log(fails ? `\n${fails} falha(s)` : '\nTudo certo'); process.exit(fails ? 1 : 0);
})();
