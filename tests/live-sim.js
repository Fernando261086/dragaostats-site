// Simulação de um jogo AO VIVO de voleibol, do início ao fim, contra um servidor simulado (doGet a evoluir no tempo).
// Uso: node tests/live-sim.js            → caminho direto ao Apps Script (como até à v279)
//      VIA_WORKER=1 node tests/live-sim.js → a 1.ª carga pelo /api/dados do worker (v280), com falha do worker no final
// Verifica: sem cartão antes do jogo; cartão AO VIVO ao começar; marcador/sets a atualizar; TERMINOU; some quando o resultado é escrito.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DIST = path.join(__dirname, '..', 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };
const VIA_WORKER = !!process.env.VIA_WORKER;
let fails = 0; const bad = m => { fails++; console.log('❌', m); }; const ok = m => console.log('✅', m);

const lis = d => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d).replace(' ', 'T');
const ini = new Date(Date.now() - 4 * 60000), [DAY, HORA] = lis(ini).split('T');

// estado do "servidor" — o teste muda-o e vê quanto tempo o site demora a refletir
const S = { fase: 'antes', reqs: 0, viaWorkerReqs: 0, directReqs: 0, workerDown: false };
function payload() {
  const base = { ok: true, hasAdminAuth: false, competitions: [{ id: 'c1', name: 'Época 26/27', mode: 'matches' }], noticias: {}, data: { c1: { events: [
    { id: 'v1', day: DAY, t: HORA, sport: 'Voleibol', athlete: 'SC Braga', local: 'casa', detail: 'Campeonato', seq: 1 } ], status: {} } } };
  const jog = { sport: 'Voleibol', adv: 'SC Braga' };
  if (S.fase === 'antes') { base.data.c1.events[0].t = lis(new Date(Date.now() + 40 * 60000)).split('T')[1]; base.data.c1.events[0].day = lis(new Date(Date.now() + 40 * 60000)).split('T')[0]; }
  if (S.fase === 'set1') base.cevLive = { updated: Date.now(), jogos: { v1: { ...jog, estado: 'vivo', setsFcp: 0, setsAdv: 0, sets: [[12, 9]] } } };
  if (S.fase === 'set1fim') base.cevLive = { updated: Date.now(), jogos: { v1: { ...jog, estado: 'vivo', setsFcp: 1, setsAdv: 0, sets: [[25, 21], [3, 2]] } } };
  if (S.fase === 'fim') base.cevLive = { updated: Date.now(), jogos: { v1: { ...jog, estado: 'fim', setsFcp: 3, setsAdv: 1, sets: [[25, 21], [22, 25], [25, 19], [25, 23]] } } };
  if (S.fase === 'resultado') { base.cevLive = { updated: Date.now(), jogos: { v1: { ...jog, estado: 'fim', setsFcp: 3, setsAdv: 1, sets: [[25, 21], [22, 25], [25, 19], [25, 23]] } } }; base.data.c1.status = { v1: { resultado: '3-1', resultTag: 'vitoria' } }; }
  return base;
}

(async () => {
  const srv = http.createServer((q, r) => {
    const u = q.url.split('?')[0];
    if (u === '/api/dados') { // worker simulado (o servidor estático de testes não o tem)
      if (!VIA_WORKER || S.workerDown) { r.writeHead(404); return r.end(); }
      S.viaWorkerReqs++; r.writeHead(200, { 'content-type': 'application/json', 'x-ds-age': '3' }); return r.end(JSON.stringify(payload()));
    }
    let p = path.join(DIST, decodeURIComponent(u)); if (p.endsWith(path.sep)) p += 'index.html';
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'text/plain' }); r.end(d); });
  }).listen(0);
  const port = srv.address().port, browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, timezoneId: 'Europe/Lisbon', locale: 'pt-PT' });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/^https?:\/\/(?!localhost)/, async r => {
    if (r.request().url().includes('script.google.com')) { S.directReqs++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload()) }); }
    return r.abort();
  });
  await page.addInitScript(() => { try { localStorage.setItem('dia22-viewer-name', 'Teste'); } catch (e) {} });
  const t0 = Date.now();
  await page.goto(`http://localhost:${port}/index.html?view=readonly`, { waitUntil: 'load' });
  await page.evaluate(() => { const o = document.getElementById('introOverlay'); if (o) o.style.display = 'none'; });
  const banner = () => page.evaluate(() => { const h = document.getElementById('liveNowBanner'); return h ? { shown: getComputedStyle(h).display !== 'none' && !!h.innerText.trim(), txt: h.innerText.replace(/\s+/g, ' ').trim() } : { shown: false, txt: '' }; });
  const waitFor = async (fn, ms = 15000) => { const s = Date.now(); while (Date.now() - s < ms) { if (await fn()) return Date.now() - s; await page.waitForTimeout(150); } return -1; };

  await page.waitForTimeout(2000);
  const loadMs = Date.now() - t0;
  VIA_WORKER ? (S.viaWorkerReqs >= 1 ? ok(`1.ª carga pelo worker (${S.viaWorkerReqs} pedido) em ${loadMs} ms`) : bad('a 1.ª carga não usou o worker')) : ok(`1.ª carga direta em ${loadMs} ms`);
  let b = await banner(); !b.shown ? ok('antes do jogo: sem cartão AO VIVO') : bad(`antes do jogo apareceu o cartão: ${b.txt}`);

  S.fase = 'set1'; let ms = await waitFor(async () => /AO VIVO/.test((await banner()).txt) && /1\.º set: 12-9/.test((await banner()).txt));
  ms >= 0 ? ok(`jogo começou: cartão AO VIVO com «1.º set: 12-9» em ${(ms / 1000).toFixed(1)} s`) : bad(`cartão ao vivo não apareceu: ${(await banner()).txt}`);

  S.fase = 'set1fim'; ms = await waitFor(async () => /1\s*–\s*0/.test((await banner()).txt) && /2\.º set: 3-2/.test((await banner()).txt));
  ms >= 0 ? ok(`1.º set ganho: marcador 1–0 e «2.º set: 3-2» em ${(ms / 1000).toFixed(1)} s`) : bad(`marcador não atualizou: ${(await banner()).txt}`);

  if (VIA_WORKER) { // o worker cai a meio do jogo: as atualizações têm de continuar (vão sempre direto ao Apps Script)
    S.workerDown = true;
  }
  S.fase = 'fim'; ms = await waitFor(async () => /TERMINOU/.test((await banner()).txt) && /Resultado final/.test((await banner()).txt) && /3\s*–\s*1/.test((await banner()).txt));
  ms >= 0 ? ok(`fim do jogo: «TERMINOU» 3–1 com parciais em ${(ms / 1000).toFixed(1)} s`) : bad(`fim não apareceu: ${(await banner()).txt}`);

  S.fase = 'resultado'; ms = await waitFor(async () => !(await banner()).shown);
  ms >= 0 ? ok(`resultado escrito: o cartão desaparece em ${(ms / 1000).toFixed(1)} s`) : bad(`cartão não desapareceu: ${(await banner()).txt}`);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ov > 1 ? bad(`deslize lateral de ${ov}px`) : ok('360 px sem deslize lateral durante todo o jogo');
  VIA_WORKER && S.directReqs >= 4 ? ok(`as atualizações foram sempre diretas ao Apps Script (${S.directReqs} pedidos; o worker só serviu a 1.ª carga: ${S.viaWorkerReqs})`) : (VIA_WORKER && bad(`pedidos diretos=${S.directReqs} worker=${S.viaWorkerReqs}`));
  errs.length ? bad(`erros JS → ${errs.join(' | ')}`) : ok('sem erros JS');
  await browser.close(); srv.close();
  console.log(fails ? `\n${fails} problema(s).` : '\nSimulação ok.'); process.exit(fails ? 1 : 0);
})();
