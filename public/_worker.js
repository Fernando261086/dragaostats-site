// Dragão Stats — Cloudflare Pages "advanced mode" (v187)
// Faz DUAS coisas e só isso; tudo o resto passa direto para os ficheiros do site:
//  1) Link de um jogo (/?comp=..&jogo=..): troca o título/descrição da pré-visualização (WhatsApp, Facebook, Google…)
//     por "🤾 Andebol — FC Porto 31-28 Kiel" em vez do texto genérico do site.
//  2) Páginas de modalidade (/andebol.html …): acrescenta no HTML (para o Google ler) os próximos jogos, a
//     classificação e os dados estruturados (schema.org SportsEvent).
// Se QUALQUER coisa falhar (dados lentos, erro, jogo não existe), devolve a página normal sem alterações.
// Os dados vêm do mesmo Apps Script que o site usa e ficam 2 minutos em cache.

const STORE_URL_DEFAULT = "https://script.google.com/macros/s/AKfycbzsPW_XhIwE-fq9GGd9rn_wPQkkOoH__dbJ6MBvRIW3mZE_kiw2JT3HszxUqCIcgOC9pw/exec";
const SITE = "https://dragaostats.pt";
const CACHE_SECONDS = 120;
const FETCH_TIMEOUT_MS = 4500;

const SPORT_PAGES = {
  "/andebol.html": ["Andebol", "🤾"],
  "/basquetebol.html": ["Basquetebol", "🏀"],
  "/hoquei-em-patins.html": ["Hóquei Patins", "🏒"],
  "/voleibol.html": ["Voleibol", "🏐"],
  "/futebol-feminino.html": ["Futebol Feminino", "⚽"],
  "/futsal.html": ["Futsal", "⚽"],
  "/equipa-b.html": ["Equipa B", "⚽"]
};
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (request.method === "GET") {
        if ((path === "/" || path === "/index.html") && url.searchParams.get("jogo")) {
          const r = await jogoPage_(request, env, ctx, url);
          if (r) return r;
        } else if (SPORT_PAGES[path.endsWith(".html") ? path : path + ".html"]) {
          const key = path.endsWith(".html") ? path : path + ".html";
          const r = await sportPage_(request, env, ctx, SPORT_PAGES[key]);
          if (r) return r;
        }
      }
    } catch (e) { /* cai para a página normal */ }
    return passThrough_(request, env, path);
  }
};

async function passThrough_(request, env, path) {
  const res = await env.ASSETS.fetch(request);
  if (path === "/" || path === "/index.html") {
    const h = new Response(res.body, res);
    h.headers.set("Cache-Control", "no-cache, must-revalidate"); // o mesmo que o _headers manda para a página principal
    return h;
  }
  return res;
}

// ---------- dados (cache de 2 min, com tempo limite)
async function getData_(env, ctx) {
  const cache = caches.default;
  const key = new Request(SITE + "/__cache/dados-v1");
  const hit = await cache.match(key);
  if (hit) return await hit.json();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  let d;
  try {
    const r = await fetch((env.STORE_URL || STORE_URL_DEFAULT) + "?_=" + Date.now(), { signal: ctl.signal, redirect: "follow" });
    d = await r.json();
  } finally { clearTimeout(timer); }
  if (!d || !d.competitions) return null;
  const c = compact_(d);
  ctx.waitUntil(cache.put(key, new Response(JSON.stringify(c), { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=" + CACHE_SECONDS } })));
  return c;
}

function compact_(d) {
  const events = [];
  (d.competitions || []).forEach(function (c) {
    if (c.mode !== "matches" || c.archived) return;
    const dd = (d.data || {})[c.id] || {};
    (dd.events || []).forEach(function (ev) {
      if (!ev || !ev.id || !ev.day || !ev.sport) return;
      const st = (dd.status || {})[ev.id] || {};
      events.push({
        id: String(ev.id), sport: ev.sport, day: ev.day, t: ev.t || "", adv: ev.athlete || "", fora: ev.local === "fora",
        det: ev.detail || "", fase: ev.phase || "", venue: ev.venue || "",
        res: (st.resultado && String(st.resultado).trim()) || "", tag: st.resultTag || ""
      });
    });
  });
  return { events: events, standings: d.standings || {} };
}

// ---------- utilidades
const ESC = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function emoji_(sport) {
  const s = String(sport || "").toLowerCase();
  if (s.includes("andebol")) return "🤾";
  if (s.includes("basquet")) return "🏀";
  if (s.includes("hóquei") || s.includes("hoquei")) return "🏒";
  if (s.includes("volei")) return "🏐";
  if (s.includes("futsal") || s.includes("futebol") || s.includes("equipa b")) return "⚽";
  return "🏅";
}
function teams_(ev) { return ev.fora ? { home: ev.adv, away: "FC Porto" } : { home: "FC Porto", away: ev.adv }; }
function dateLabel_(day) {
  const p = String(day).split("-");
  return p.length === 3 ? Number(p[2]) + " de " + MESES[Number(p[1]) - 1] : String(day);
}
function resultWord_(ev) {
  if (ev.tag === "win") return "Vitória";
  if (ev.tag === "loss") return "Derrota";
  if (ev.tag === "draw") return "Empate";
  const m = ev.res.match(/(\d+)\s*[-–:]\s*(\d+)/);
  if (!m) return "";
  const a = Number(m[1]), b = Number(m[2]), fcp = ev.fora ? b : a, adv = ev.fora ? a : b;
  return fcp > adv ? "Vitória" : fcp < adv ? "Derrota" : "Empate";
}
function lastSunday_(y, m) { const d = new Date(Date.UTC(y, m + 1, 0)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; }
// Hora de Lisboa → instante UTC (verão: +01:00 entre o último domingo de março e o de outubro, às 01:00 UTC)
function startInfo_(day, t) {
  const p = String(day).split("-").map(Number);
  const hm = String(t || "").match(/^(\d{1,2}):(\d{2})$/);
  if (p.length !== 3 || !hm) return null;
  const guess = Date.UTC(p[0], p[1] - 1, p[2], Number(hm[1]), Number(hm[2]));
  const ini = lastSunday_(p[0], 2).getTime() + 3600000, fim = lastSunday_(p[0], 9).getTime() + 3600000;
  const dst = guess >= ini && guess < fim;
  return { ms: guess - (dst ? 3600000 : 0), offset: dst ? "+01:00" : "+00:00" };
}

// ---------- 1) pré-visualização do jogo
async function jogoPage_(request, env, ctx, url) {
  const data = await getData_(env, ctx);
  if (!data) return null;
  const id = url.searchParams.get("jogo");
  const ev = data.events.find(e => e.id === id);
  if (!ev) return null;
  const t = teams_(ev), em = emoji_(ev.sport);
  const word = resultWord_(ev);
  let title, desc;
  if (ev.res) {
    title = em + " " + ev.sport + " — " + t.home + " " + ev.res + " " + t.away + (word ? " (" + word + ")" : "");
    desc = "Resultado final" + (ev.det ? " · " + ev.det : "") + " · " + dateLabel_(ev.day) + ". Estatísticas e classificação no Dragão Stats.";
  } else {
    title = em + " " + ev.sport + " — " + t.home + " vs " + t.away;
    desc = dateLabel_(ev.day) + (ev.t ? " às " + ev.t : "") + (ev.det ? " · " + ev.det : "") + (ev.venue ? " · " + ev.venue : "") + ". Segue o jogo e o resultado no Dragão Stats.";
  }
  const res = await env.ASSETS.fetch(request);
  const out = new HTMLRewriter()
    .on("title", { element(e) { e.setInnerContent(title + " | Dragão Stats"); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute("content", desc); } })
    .on('meta[property="og:title"]', { element(e) { e.setAttribute("content", title); } })
    .on('meta[property="og:description"]', { element(e) { e.setAttribute("content", desc); } })
    .on('meta[property="og:url"]', { element(e) { e.setAttribute("content", url.toString()); } })
    .on('meta[name="twitter:title"]', { element(e) { e.setAttribute("content", title); } })
    .on('meta[name="twitter:description"]', { element(e) { e.setAttribute("content", desc); } })
    .transform(res);
  const r = new Response(out.body, out);
  r.headers.set("Cache-Control", "no-cache, must-revalidate");
  return r;
}

// ---------- 2) páginas de modalidade (conteúdo para o Google)
async function sportPage_(request, env, ctx, info) {
  const sport = info[0];
  const data = await getData_(env, ctx);
  if (!data) return null;
  const now = Date.now();
  const proximos = data.events
    .filter(e => e.sport === sport)
    .map(e => ({ e: e, s: startInfo_(e.day, e.t) }))
    .filter(x => x.s && x.s.ms >= now - 3 * 3600000 && !x.e.res)
    .sort((a, b) => a.s.ms - b.s.ms)
    .slice(0, 5);
  const st = (data.standings || {})[sport];
  const box = "background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 16px;margin:14px 0;text-align:left;";
  const lbl = "font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-bottom:6px;";
  let html = "";
  if (proximos.length) {
    html += '<div style="' + box + '"><div style="' + lbl + '">Próximos jogos</div>' + proximos.map(x => {
      const t = teams_(x.e);
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;font-size:15px;"><span>' + ESC(t.home) + " vs " + ESC(t.away) +
        '</span><span style="opacity:.7;white-space:nowrap;">' + ESC(dateLabel_(x.e.day)) + (x.e.t ? " · " + ESC(x.e.t) : "") + "</span></div>";
    }).join("") + "</div>";
  }
  if (st && Array.isArray(st.rows) && st.rows.length) {
    const cols = st.cols || [], ij = cols.indexOf("J"), ip = cols.indexOf("Pts");
    const rows = st.rows.filter((r, i) => i < 8 || r.me);
    html += '<div style="' + box + '"><div style="' + lbl + '">Classificação' + (st.comp ? " · " + ESC(st.comp) : "") + "</div>" +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;">' + rows.map(r => {
        const c = r.c || [];
        return '<tr style="' + (r.me ? "font-weight:700;color:#5bb4f0;" : "") + '"><td style="padding:3px 0;width:28px;">' + ESC(r.p) + '</td><td>' + ESC(r.t) + "</td>" +
          (ij >= 0 ? '<td style="text-align:right;opacity:.8;">' + ESC(c[ij]) + " J</td>" : "") +
          (ip >= 0 ? '<td style="text-align:right;width:56px;">' + ESC(c[ip]) + " pts</td>" : "") + "</tr>";
      }).join("") + "</table></div>";
  }
  if (!html) return null;
  const ld = proximos.map(x => {
    const t = teams_(x.e);
    const o = {
      "@context": "https://schema.org", "@type": "SportsEvent", name: t.home + " vs " + t.away, sport: sport,
      startDate: x.e.day + "T" + String(x.e.t).padStart(5, "0") + ":00" + x.s.offset,
      eventStatus: "https://schema.org/EventScheduled",
      homeTeam: { "@type": "SportsTeam", name: t.home }, awayTeam: { "@type": "SportsTeam", name: t.away },
      url: SITE + "/?jogo=" + encodeURIComponent(x.e.id)
    };
    if (x.e.venue) o.location = { "@type": "Place", name: x.e.venue };
    return o;
  });
  const res = await env.ASSETS.fetch(request);
  let rw = new HTMLRewriter().on("div.other", { element(e) { e.before(html, { html: true }); } });
  if (ld.length) rw = rw.on("head", { element(e) { e.append('<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, "\\u003c") + "</script>", { html: true }); } });
  return rw.transform(res);
}
