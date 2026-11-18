// v308: cartão do calendário (linha local/canal + Ver transmissão/Classificação) e Match Predictor escondido: node tests/card-info.js [--shots dir]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css', '.webp':'image/webp' };
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const d = new Date(); d.setDate(d.getDate() + 2);
const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hoje = new Date(); const isoH = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
const q = { type: 'placar', text: 'Qual será o resultado do jogo?' };
const mock = { ok:true, hasAdminAuth:false,
  competitions:[{id:'c1',name:'Época 26/27',mode:'matches'}],
  standings:{ Andebol:{ sport:'Andebol', comp:'1ª Divisão', cols:['Pts','J'], rows:[{p:1,t:'FC Porto',c:[10,4]},{p:2,t:'Sporting',c:[8,4]}], updated:Date.now() } },
  data:{ c1:{ events:[
    {id:'a1',day:iso,t:'20:00',sport:'Andebol',athlete:'Sporting',detail:'Campeonato',phase:'5ª Jornada',local:'casa',venue:'Dragão Arena',watchName:'Porto Canal',watchUrl:'https://portocanal.sapo.pt/x',predictionQuestion:q},
    {id:'a2',day:iso,t:'18:00',sport:'Basquetebol',athlete:'Benfica',detail:'Taça',phase:'Meias',local:'fora',predictionQuestion:q},
    {id:'a3',day:isoH,t:'00:05',sport:'Andebol',athlete:'Benfica',detail:'Campeonato',phase:'3ª Jornada',local:'casa',venue:'Dragão Arena',watchName:'Porto Canal',watchUrl:'https://portocanal.sapo.pt/y',predictionQuestion:q} ],
    status:{ a3:{ resultado:'30-25', resultTag:'win' } } } } };
let fails = 0; const bad = m => { fails++; console.log('❌', m); }; const ok = m => console.log('✅', m);
(async () => {
  const srv = http.createServer((rq, r) => { let p = path.join(DIST, decodeURIComponent(rq.url.split('?')[0])); if (p.endsWith(path.sep)) p += 'index.html';
    fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'content-type': MIME[path.extname(p)] || 'text/plain'}); r.end(b); }); }).listen(0);
  const port = srv.address().port, browser = await chromium.launch();
  for (const mode of ['público', 'edição']) for (const theme of ['dark', 'light']) for (const w of [360, 768]) {
    const tag = `${mode} ${theme} ${w}px`, page = await browser.newPage({ viewport: { width: w, height: 900 } }), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(([m, theme, mode]) => {
      try { localStorage.setItem('dia22-viewer-name','Teste'); localStorage.setItem('dia22-theme', theme); } catch (e) {}
      const f = window.fetch;
      window.fetch = (u, o) => String(u).includes('script.google.com') ? Promise.resolve(new Response(JSON.stringify(o && o.method === 'POST' ? { ok:true } : m), { status:200, headers:{'content-type':'application/json'} })) : f(u, o);
    }, [mock, theme, mode]);
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html${mode === 'edição' ? '?view=edit' : '?view=readonly'}`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.evaluate(() => { const o = document.getElementById('introOverlay'); if (o) o.style.display = 'none'; activeSport = 'Todos'; setView('calendario'); activeDay = 'todos'; matchesViewFilter = 'todos'; renderTimeline(); });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const row = id => document.getElementById('ev-card-' + id);
      const info = id => { const x = row(id) && row(id).querySelector('.mr-info'); return x ? { txt: x.textContent.replace(/\s+/g, ' ').trim(), btns: [...x.querySelectorAll('.mr-i-btn')].map(b => b.textContent.trim()) } : null; };
      return { a1: info('a1'), a2: info('a2'), a3: info('a3'), pred: document.querySelectorAll('.prediction-bar, [class*=prediction-]').length, rank: !!document.querySelector('#predictionRankingBtn') && getComputedStyle(document.getElementById('predictionRankingBtn')).display !== 'none',
        banner: getComputedStyle(document.getElementById('personalPredictionBanner')).display, ov: document.documentElement.scrollWidth - innerWidth };
    });
    r.a1 && /Dragão Arena/.test(r.a1.txt) && /Porto Canal/.test(r.a1.txt) && r.a1.btns.join('|') === 'Ver transmissão|Classificação' ? ok(`${tag}: jogo com local, canal e os 2 botões`) : bad(`${tag}: a1 ${JSON.stringify(r.a1)}`);
    r.a2 && /Fora/.test(r.a2.txt) && r.a2.btns.length === 0 ? ok(`${tag}: taça sem canal/classificação → só «Fora», sem botões`) : bad(`${tag}: a2 ${JSON.stringify(r.a2)}`);
    r.a3 && !/Dragão Arena|Porto Canal/.test(r.a3.txt) && r.a3.btns.join('|') === 'Classificação' ? ok(`${tag}: jogo terminado só com «Classificação»`) : bad(`${tag}: a3 ${JSON.stringify(r.a3)}`);
    r.pred === 0 && !r.rank && r.banner === 'none' ? ok(`${tag}: Match Predictor escondido (barra, ranking, banner)`) : bad(`${tag}: predictor visível ${JSON.stringify({p:r.pred,rank:r.rank,b:r.banner})}`);
    r.ov <= 1 ? ok(`${tag}: sem deslize lateral`) : bad(`${tag}: deslize ${r.ov}px`);
    const wide = await page.evaluate(() => [...document.querySelectorAll('.match-row .mr-info')].every(x => x.getBoundingClientRect().right <= innerWidth + 0.5));
    wide ? ok(`${tag}: linha dentro do ecrã`) : bad(`${tag}: linha fora do ecrã`);
    // clique no botão Classificação abre a página da modalidade
    await page.evaluate(() => document.querySelector('#ev-card-a1 [data-mrtable="1"]').click()); await page.waitForTimeout(500);
    (await page.evaluate(() => window.__curView_)) === 'modalidade' ? ok(`${tag}: «Classificação» abre a página da modalidade`) : bad(`${tag}: «Classificação» não abriu (${await page.evaluate(() => window.__curView_)})`);
    if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.evaluate(() => { setView('calendario'); renderTimeline(); }); await page.waitForTimeout(300); await page.screenshot({ path: path.join(shots, `card-${mode}-${theme}-${w}.png`) }); }
    errs.length ? bad(`${tag}: erros JS ${errs.slice(0, 2).join(' | ')}`) : ok(`${tag}: sem erros de JavaScript`);
    await page.close();
  }
  await browser.close(); srv.close();
  console.log(fails ? `\n${fails} falha(s)` : '\nTudo certo (cartão do calendário)');
  process.exit(fails ? 1 : 0);
})();
