// v305: testa as páginas de adversário do _worker.js com HTMLRewriter a sério (pacote htmlrewriter) e dados simulados.
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  let fails = 0; const bad = m => { fails++; console.log('❌', m); }, ok = m => console.log('✅', m);
  // HTMLRewriter mínimo (só o que o worker usa): título, meta, canonical, #id, a.cta, a.current e head.
  class HTMLRewriter {
    constructor() { this.h = []; }
    on(sel, o) { this.h.push([sel, o.element]); return this; }
    transform(res) {
      const h = this.h;
      const p = (async () => {
        let html = await res.text();
        const run = (re, sel, fn) => { html = html.replace(re, (m, a, b, c) => fn(m, a, b, c)); };
        for (const [sel, fn] of h) {
          const el = (attrs, inner) => { const st = { attrs, inner, append: '' };
            fn({ setInnerContent: (t, o) => { st.inner = o && o.html ? t : String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }, setAttribute: (k, v) => { st.attrs = st.attrs.includes(k + '="') ? st.attrs.replace(new RegExp(k + '="[^"]*"'), k + '="' + String(v).replace(/"/g, '&quot;') + '"') : st.attrs + ' ' + k + '="' + v + '"'; },
              removeAttribute: k => { st.attrs = st.attrs.replace(new RegExp('\\s*' + k + '="[^"]*"'), ''); }, append: (t) => { st.append += t; } });
            return st; };
          if (sel === 'title') html = html.replace(/<title>([\s\S]*?)<\/title>/, (m, i) => '<title>' + el('', i).inner + '</title>');
          else if (sel === 'head') html = html.replace(/<head>([\s\S]*?)<\/head>/, (m, i) => { const st = el('', i); return '<head>' + i + st.append + '</head>'; });
          else if (/^(meta|link)/.test(sel)) {
            const tag = sel.match(/^(meta|link)/)[1], kv = sel.match(/\[(\w+)="([^"]+)"\]/);
            html = html.replace(new RegExp('<' + tag + '\\s[^>]*' + kv[1] + '="' + kv[2] + '"[^>]*>', 'g'), m => '<' + tag + el(m.slice(tag.length + 1, -1), '').attrs + '>');
          } else if (sel[0] === '#') {
            html = html.replace(new RegExp('<(\\w+)([^>]*id="' + sel.slice(1) + '"[^>]*)>([\\s\\S]*?)</\\1>'), (m, t, a, i) => '<' + t + a + '>' + el(a, i).inner + '</' + t + '>');
          } else if (sel.startsWith('a.')) {
            const cl = sel.slice(2);
            html = html.replace(new RegExp('<a([^>]*class="' + cl + '"[^>]*)>([\\s\\S]*?)</a>'), (m, a, i) => { const st = el(a, i); return '<a' + st.attrs + '>' + st.inner + '</a>'; });
          }
        }
        return html;
      })();
      return new Response(new ReadableStream({ async start(c) { c.enqueue(new TextEncoder().encode(await p)); c.close(); } }), res);
    }
  }
  globalThis.HTMLRewriter = HTMLRewriter;
  const store = new Map();
  globalThis.caches = { default: { match: async k => { const r = store.get(k.url); return r ? r.clone() : undefined; }, put: async (k, r) => { store.set(k.url, r.clone()); } } };
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' });
  const dia = n => new Date(Date.now() + n * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' });
  const evs = [
    { id: 'a1', day: dia(-30), t: '20:00', sport: 'Andebol', athlete: 'Benfica', local: 'casa', detail: 'Campeonato' },
    { id: 'a2', day: dia(-10), t: '21:00', sport: 'Futsal', athlete: 'Benfica', local: 'fora', detail: 'Campeonato' },
    { id: 'a3', day: dia(-5), t: '19:00', sport: 'Andebol', athlete: 'Benfica', local: 'fora' },
    { id: 'a4', day: dia(6), t: '20:30', sport: 'Andebol', athlete: 'Benfica', local: 'casa', venue: 'Dragão Arena' },
    { id: 'b1', day: dia(-3), t: '20:00', sport: 'Voleibol', athlete: 'Sporting <b>X</b>', local: 'casa' },
    { id: 'c1', day: dia(-2), t: '20:00', sport: 'Basquetebol', athlete: 'Ovarense', local: 'casa' },
    { id: 'd1', day: dia(-4), t: '20:00', sport: 'Équipa Única "Z"', athlete: '', local: 'casa' }
  ];
  const status = { a1: { resultado: '30-25' }, a2: { resultado: '5-2' }, a3: { resultado: '25-25' }, b1: { resultado: '3-0' }, c1: { resultado: '80-70' } };
  const api = { ok: true, competitions: [{ id: 'c', name: 'Época', mode: 'matches' }], data: { c: { events: evs.map(e => ({ ...e, athlete: e.athlete })), status } } };
  globalThis.fetch = async u => new Response(JSON.stringify(api), { status: 200 });
  const shell = fs.readFileSync(path.join(__dirname, '..', 'public', 'hoje.html'), 'utf8');
  const tmp = path.join(os.tmpdir(), 'ds-worker-' + process.pid + '.mjs');
  fs.copyFileSync(path.join(__dirname, '..', 'public', '_worker.js'), tmp);
  const W = (await import(tmp)).default;
  const env = { ASSETS: { fetch: async req => new Response(shell, { headers: { 'content-type': 'text/html' } }) } };
  const ctx = { waitUntil() {} };
  const get = async p => { const r = await W.fetch(new Request('https://dragaostats.pt' + p), env, ctx); return { r, t: await r.text() }; };
  let x = await get('/adversario/benfica');
  x.r.status === 200 ? ok('/adversario/benfica responde 200') : bad('benfica status ' + x.r.status);
  /<title>FC Porto vs Benfica: resultados/.test(x.t) ? ok('título com o adversário') : bad('título: ' + (x.t.match(/<title>.*?<\/title>/) || [])[0]);
  /rel="canonical" href="https:\/\/dragaostats\.pt\/adversario\/benfica"/.test(x.t) ? ok('canonical próprio') : bad('canonical');
  /Em 3 jogos contra o Benfica/.test(x.t) && /1 vitória, 1 empate e 1 derrota/.test(x.t) ? ok('balanço 1V 1E 1D (fora 5-2 = derrota; o 1.º jogo em casa 30-25 = vitória; 25-25 = empate)') : bad('balanço: ' + (x.t.match(/Em \d+ jogos[^<]*/) || [])[0]);
  /Próximos jogos/.test(x.t) && /Dragão Arena|20:30/.test(x.t) ? ok('próximo jogo listado') : bad('sem próximo jogo');
  /"@type":"SportsEvent"/.test(x.t) ? ok('JSON-LD SportsEvent') : bad('sem JSON-LD');
  !/class="current"/.test(x.t) ? ok('«Jogos de hoje» já não aparece como página atual') : bad('current ficou');
  x = await get('/adversario/sporting-b-x');
  x.r.status === 404 && /noindex/.test(x.r.headers.get('x-robots-tag') || '') ? ok('adversário com 1 só jogo → 404 noindex') : bad('1 jogo: ' + x.r.status);
  x = await get('/adversario/nao-existe');
  x.r.status === 404 ? ok('adversário desconhecido → 404') : bad('desconhecido: ' + x.r.status);
  x = await get('/adversarios');
  x.r.status === 200 && /href="\/adversario\/benfica"/.test(x.t) && /4 jogos/.test(x.t) ? ok('índice lista o Benfica com 4 jogos') : bad('índice');
  !/Ovarense/.test(x.t) ? ok('índice só tem adversários com ≥2 jogos') : bad('índice com 1 jogo');
  x = await get('/sitemap-jogos.xml');
  /\/adversario\/benfica/.test(x.t) && /\/adversarios</.test(x.t) ? ok('sitemap-jogos inclui as páginas de adversário') : bad('sitemap');
  /<script/i.test((await get('/adversario/benfica')).t.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '').match(/Sporting <b>/) || '') ? bad('HTML não escapado') : ok('nomes escapados (sem HTML injetado)');
  { // v306: /api/dados — cópia antiga serve-se logo (até 6 h) e atualiza por trás; sem cópia espera no máx. ~5 s
    const KEY = 'https://dragaostats.pt/__cache/dados-brutos-v2';
    store.delete(KEY);
    const real = globalThis.fetch;
    let chamadas = 0, modo = 'ok';
    globalThis.fetch = async u => { chamadas++; if (modo === 'pendurado') return new Promise(() => {}); return new Response(JSON.stringify(api), { status: 200 }); };
    let t0 = Date.now(); x = await get('/api/dados');
    x.r.status === 200 && x.r.headers.get('x-ds-age') === '0' && /"competitions"/.test(x.t) ? ok('/api/dados sem cópia: vai ao Apps Script e responde com idade 0') : bad('dados 1.ª: ' + x.r.status + ' ' + x.r.headers.get('x-ds-age'));
    const antiga = store.get(KEY);
    store.set(KEY, new Response(await antiga.clone().text(), { headers: { 'X-DS-At': String(Date.now() - 30 * 60000) } }));
    modo = 'pendurado'; t0 = Date.now(); x = await get('/api/dados');
    const dt = Date.now() - t0, idade = Number(x.r.headers.get('x-ds-age'));
    x.r.status === 200 && dt < 1500 && idade >= 1790 && idade <= 1810 ? ok(`cópia de 30 min serve-se logo (${dt} ms, idade ${idade} s) mesmo com o Apps Script pendurado`) : bad(`cópia antiga: ${x.r.status} ${dt} ms idade ${idade}`);
    store.set(KEY, new Response(await antiga.clone().text(), { headers: { 'X-DS-At': String(Date.now() - 7 * 3600000) } }));
    t0 = Date.now(); x = await get('/api/dados');
    const dt2 = Date.now() - t0;
    x.r.status === 504 && dt2 >= 4500 && dt2 < 7500 ? ok(`sem cópia utilizável e Apps Script pendurado: 504 ao fim de ${Math.round(dt2 / 1000)} s (antes eram 9 s)`) : bad(`pendurado: ${x.r.status} ${dt2} ms`);
    globalThis.fetch = real;
  }
  fs.unlinkSync(tmp);
  console.log(fails ? `\n${fails} problema(s).` : '\nTudo ok.'); process.exit(fails ? 1 : 0);
})();
