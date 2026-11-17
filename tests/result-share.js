// «Resultado guardado» com pré-geração (v307) e erro dos acessos (v307): node tests/result-share.js [--shots dir]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css', '.webp':'image/webp' };
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const hoje = new Date(); const dia = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
const mock = { ok:true, hasAdminAuth:false,
  competitions:[{id:'c1',name:'Época 26/27',mode:'matches'}],
  data:{ c1:{ events:[{id:'e1',day:dia,t:'20:00',sport:'Andebol',athlete:'Sporting',detail:'Campeonato',phase:'Jornada 12',local:'casa',venue:'Dragão Arena',seq:1}], status:{} } } };
let fails = 0; const bad = m => { fails++; console.log('❌', m); }; const ok = m => console.log('✅', m);
(async () => {
  const srv = http.createServer((q, r) => { let p = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith(path.sep)) p += 'index.html';
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, {'content-type': MIME[path.extname(p)] || 'text/plain'}); r.end(d); }); }).listen(0);
  const port = srv.address().port, browser = await chromium.launch();
  for (const theme of ['dark', 'light']) for (const w of [360, 768]) {
    const tag = `edição ${theme} ${w}px`, page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 }), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(([d, theme]) => {
      try { localStorage.setItem('dia22-viewer-name','Teste'); localStorage.setItem('dia22-theme', theme); } catch (e) {}
      window.__visitQ = []; window.__shares = []; window.__copied = [];
      const f = window.fetch;
      window.fetch = (u, o) => {
        if (String(u).includes('script.google.com')) {
          if (o && o.body && String(o.body).includes('getFullVisitLog')) { const n = window.__visitQ.shift() || { ok:true, fullVisitLog:[] }; return Promise.resolve(new Response(JSON.stringify(n), { status:200, headers:{'content-type':'application/json'} })); }
          return Promise.resolve(new Response(JSON.stringify(o && o.method === 'POST' ? { ok:true } : d), { status:200, headers:{'content-type':'application/json'} }));
        }
        return f(u, o);
      };
      try { Object.defineProperty(Notification, 'permission', { get: () => 'default' }); } catch (e) {}
      navigator.canShare = () => true;
      navigator.share = (x) => { window.__shares.push({ name: x.files && x.files[0] && x.files[0].name, type: x.files && x.files[0] && x.files[0].type, size: x.files && x.files[0] && x.files[0].size, text: x.text }); return Promise.resolve(); };
      try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve(); } }, configurable: true }); } catch (e) {}
    }, [mock, theme]);
    await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await page.goto(`http://localhost:${port}/index.html?view=edit`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.evaluate(() => { const o = document.getElementById('introOverlay'); if (o) o.style.display = 'none'; });

    // ---- «Resultado guardado»
    await page.evaluate(() => { state['e1'] = { passou: null, resultado: '31-27' }; showResultSharePrompt_('e1'); });
    await page.waitForSelector('#resultSharePrompt', { timeout: 3000 }).catch(() => {});
    const b0 = await page.evaluate(() => [...document.querySelectorAll('#resultSharePrompt [data-pg]')].map(b => b.getAttribute('data-pg') + ':' + (b.disabled ? 'off' : 'on')));
    b0.length === 4 ? ok(`${tag}: 4 botões (Instagram/Facebook imagem e reel, Reddit, TikTok)`) : bad(`${tag}: botões ${JSON.stringify(b0)}`);
    await page.waitForFunction(() => PREGEN_ && PREGEN_.img !== 'wait', null, { timeout: 30000 }).catch(() => {});
    const img = await page.evaluate(() => ({ img: PREGEN_ && PREGEN_.img, ig: PREGEN_ && PREGEN_.files.ig && PREGEN_.files.ig.name, rd: PREGEN_ && PREGEN_.files.rd && PREGEN_.files.rd.name }));
    img.img === 'ok' && /-4x5\.png$/.test(img.ig || '') && /-1x1\.png$/.test(img.rd || '') ? ok(`${tag}: imagem pré-gerada (4:5 e 1:1)`) : bad(`${tag}: imagem ${JSON.stringify(img)}`);
    const on1 = await page.evaluate(() => ['ig', 'rd'].map(k => !document.querySelector(`#resultSharePrompt [data-pg="${k}"]`).disabled));
    on1[0] && on1[1] ? ok(`${tag}: botões de imagem ativos sem esperar pelo reel`) : bad(`${tag}: botões de imagem ${JSON.stringify(on1)}`);
    // partilha da imagem (Instagram/Facebook): ficheiro 4:5 + texto copiado, tudo no mesmo toque
    await page.click('#resultSharePrompt [data-pg="ig"]'); await page.waitForTimeout(150);
    let r1 = await page.evaluate(() => ({ s: window.__shares.slice(), c: window.__copied.slice() }));
    r1.s.length === 1 && /-4x5\.png$/.test(r1.s[0].name) && r1.s[0].type === 'image/png' && r1.s[0].size > 5000 ? ok(`${tag}: Instagram/Facebook partilha a imagem 4:5`) : bad(`${tag}: partilha IG ${JSON.stringify(r1.s)}`);
    r1.c.length === 1 && /https:\/\/dragaostats\.pt/.test(r1.c[0]) && /#FCPorto/.test(r1.c[0]) && /31-27/.test(r1.c[0]) ? ok(`${tag}: legenda copiada (com resultado, link e #)`) : bad(`${tag}: legenda ${JSON.stringify(r1.c)}`);
    await page.click('#resultSharePrompt [data-pg="rd"]'); await page.waitForTimeout(150);
    r1 = await page.evaluate(() => ({ s: window.__shares.slice(), c: window.__copied.slice() }));
    r1.s.length === 2 && /-1x1\.png$/.test(r1.s[1].name) && !/#FCPorto/.test(r1.c[1] || '#FCPorto') && /https:\/\/dragaostats\.pt/.test(r1.c[1]) ? ok(`${tag}: Reddit partilha a imagem 1:1 com legenda sem #`) : bad(`${tag}: Reddit ${JSON.stringify(r1)}`);
    // reel
    await page.waitForFunction(() => PREGEN_ && PREGEN_.vid !== 'wait', null, { timeout: 90000 }).catch(() => {});
    const vid = await page.evaluate(() => ({ vid: PREGEN_ && PREGEN_.vid, name: PREGEN_ && PREGEN_.files.vid && PREGEN_.files.vid.name, type: PREGEN_ && PREGEN_.files.vid && PREGEN_.files.vid.type, size: PREGEN_ && PREGEN_.files.vid && PREGEN_.files.vid.size }));
    if (vid.vid === 'ok' && vid.size > 20000 && /^video\//.test(vid.type)) {
      ok(`${tag}: reel pré-gerado (${vid.name}, ${Math.round(vid.size / 1024)} KB)`);
      await page.click('#resultSharePrompt [data-pg="tt"]'); await page.waitForTimeout(150);
      const r2 = await page.evaluate(() => ({ s: window.__shares.slice(-1)[0], c: window.__copied.slice(-1)[0] }));
      r2.s && /^video\//.test(r2.s.type) && /link na bio/i.test(r2.c) ? ok(`${tag}: TikTok partilha o reel com legenda «link na bio»`) : bad(`${tag}: TikTok ${JSON.stringify(r2)}`);
    } else bad(`${tag}: reel ${JSON.stringify(vid)}`);
    const lay = await page.evaluate(() => { const el = document.getElementById('resultSharePrompt').getBoundingClientRect(); return { l: el.left, r: el.right, vw: innerWidth, ov: document.documentElement.scrollWidth - innerWidth, h: el.height }; });
    lay.l >= 0 && lay.r <= lay.vw + 0.5 && lay.ov <= 1 ? ok(`${tag}: folha dentro do ecrã, sem deslize lateral (altura ${Math.round(lay.h)} px)`) : bad(`${tag}: layout ${JSON.stringify(lay)}`);
    if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `rsp-${theme}-${w}.png`) }); }
    await page.evaluate(() => document.querySelector('#resultSharePrompt [data-rsp="more"]').click()); await page.waitForTimeout(400);
    (await page.evaluate(() => !!document.getElementById('shareHub') && !document.getElementById('resultSharePrompt'))) ? ok(`${tag}: «Mais opções» abre o painel Partilhar`) : bad(`${tag}: «Mais opções» não abriu o painel`);
    await page.evaluate(() => closeShareHub_());

    // ---- erro dos acessos
    const run = async (queue) => {
      await page.evaluate((q) => { window.__visitQ = q; visitsViewMode = 'lista'; const p = document.getElementById('visitsLogPanel'); p.style.display = ''; renderVisitsLogPanel(); }, queue);
      await page.waitForTimeout(queue.length > 1 ? 3300 : 800);
      return page.evaluate(() => document.getElementById('visitsLogPanel').textContent.replace(/\s+/g, ' '));
    };
    let t = await run([{ ok:false, error:'Demasiadas gravações ao mesmo tempo — tenta outra vez em breve.' }, { ok:true, fullVisitLog:[{ name:'Zé', type:'visit', t:new Date().toISOString() }] }]);
    !/Erro/.test(t) && /Zé/.test(t) ? ok(`${tag}: servidor ocupado → repete sozinho e mostra os acessos`) : bad(`${tag}: ocupado → ${t.slice(0, 160)}`);
    t = await run([{ ok:false, error:"Password de admin inválida ou em falta. [Diagnóstico: recebida 'ab...yz' (8 caracteres) — guardadas: 'qq...rr' (9 caracteres)]" }]);
    /Password de admin inválida/.test(t) && !/ab\.\.\.yz|qq\.\.\.rr|Diagn/.test(t) && /Tentar outra vez/.test(t) ? ok(`${tag}: motivo real (password) sem o diagnóstico com partes das passwords, com «Tentar outra vez»`) : bad(`${tag}: password → ${t.slice(0, 200)}`);
    t = await run([{ ok:true }]);
    /sem a lista de acessos/.test(t) && /Tentar outra vez/.test(t) ? ok(`${tag}: resposta sem lista → explica a causa provável`) : bad(`${tag}: sem lista → ${t.slice(0, 200)}`);
    await page.evaluate(() => { window.__visitQ = [{ ok:true, fullVisitLog:[{ name:'Ana', type:'visit', t:new Date().toISOString() }] }]; document.getElementById('retryVisitsBtn').click(); }); await page.waitForTimeout(600);
    /Ana/.test(await page.evaluate(() => document.getElementById('visitsLogPanel').textContent)) ? ok(`${tag}: «Tentar outra vez» volta a pedir e mostra os acessos`) : bad(`${tag}: «Tentar outra vez» não funcionou`);
    errs.length ? bad(`${tag}: erros JS ${errs.slice(0, 2).join(' | ')}`) : ok(`${tag}: sem erros de JavaScript`);
    await page.close();
  }
  await browser.close(); srv.close();
  console.log(fails ? `\n${fails} falha(s)` : '\nTudo certo (resultado guardado + acessos)');
  process.exit(fails ? 1 : 0);
})();
