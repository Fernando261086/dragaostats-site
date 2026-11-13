// Dragão Stats — Cloudflare Pages "advanced mode" (v187)
// Faz QUATRO coisas e só isso (v195: + calendário subscrito .ics e imagem por modalidade na pré-visualização); tudo o resto passa direto para os ficheiros do site:
//  1) Link de um jogo (/?comp=..&jogo=..): troca o título/descrição da pré-visualização (WhatsApp, Facebook, Google…)
//     por "🤾 Andebol — FC Porto 31-28 Kiel" em vez do texto genérico do site.
//  1b) (v196+) Esses links também levam canonical próprio, dados estruturados (SportsEvent) e, se o editor já criou a imagem do jogo
//      (Apps Script v172, guardada no Drive), um og:image com o resultado. /sitemap-jogos.xml lista os jogos recentes para o Google.
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
  "/futebol.html": ["Equipa A", "⚽"],
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
      if (request.method === "GET" && path === "/diag") return await diagnostico_(env, ctx);
      if (request.method === "GET" && path === "/api/dados") return await dadosBrutos_(env, ctx);
      if (request.method === "POST" && path === "/rep") return await relatorioErros_(request);
      if (request.method === "GET" && path === "/sitemap-jogos.xml") {
        const r = await sitemapJogos_(env, ctx);
        if (r) return r;
      }
      if (request.method === "GET" && /^\/calendario\/[a-z-]+\.ics$/.test(path)) {
        const r = await calendarioIcs_(env, ctx, path);
        if (r) return r;
      }
      if (request.method === "GET") {
        if ((path === "/" || path === "/index.html") && url.searchParams.get("jogo")) {
          const r = await jogoPage_(request, env, ctx, url);
          if (r) return r;
        } else if (path === "/hoje" || path === "/hoje.html") {
          const r = await hojePage_(request, env, ctx);
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

// ---------- slug de cada modalidade (ficheiros /og/<slug>.png e /calendario/<slug>.ics)
function slugOf_(sport) {
  const k = Object.keys(SPORT_PAGES).find(p => SPORT_PAGES[p][0] === sport);
  return k ? k.replace("/", "").replace(".html", "") : "";
}

// ---------- 3) calendário para subscrever (.ics): /calendario/andebol.ics, ..., /calendario/todas.ics
function icsEsc_(s) { return String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsFold_(line) {
  const enc = new TextEncoder(); let out = "", cur = "", bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > 73) { out += cur + "\r\n "; cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  return out + cur;
}
function icsStamp_(ms) { return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }
async function calendarioIcs_(env, ctx, path) {
  const slug = path.replace("/calendario/", "").replace(".ics", "");
  const sport = slug === "todas" ? null : (Object.keys(SPORT_PAGES).map(k => SPORT_PAGES[k][0]).find(n => slugOf_(n) === slug) || "");
  if (sport === "") return null;
  let data = null;
  try { data = await getData_(env, ctx); } catch (e) { data = null; }
  if (!data) return new Response("Calendário temporariamente indisponível", { status: 503, headers: { "Retry-After": "300" } });
  const nome = sport ? "Dragão Stats — FC Porto " + sport : "Dragão Stats — FC Porto (todas as modalidades)";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dragao Stats//FC Porto//PT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:" + icsEsc_(nome), "X-WR-TIMEZONE:Europe/Lisbon", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  const agora = icsStamp_(Date.now());
  data.events.filter(e => !sport || e.sport === sport).forEach(e => {
    const s = startInfo_(e.day, e.t);
    if (!s) return;
    const t = teams_(e);
    const titulo = emoji_(e.sport) + " " + (e.res ? e.sport + ": " + t.home + " " + e.res + " " + t.away : e.sport + ": " + t.home + " vs " + t.away);
    const desc = [e.det, e.fase, e.res ? "Resultado final: " + e.res : "Segue em direto em " + SITE].filter(Boolean).join(" · ");
    L.push("BEGIN:VEVENT", "UID:" + e.id + "@dragaostats.pt", "DTSTAMP:" + agora, "DTSTART:" + icsStamp_(s.ms), "DTEND:" + icsStamp_(s.ms + 2 * 3600000),
      "SUMMARY:" + icsEsc_(titulo), "DESCRIPTION:" + icsEsc_(desc), "URL:" + SITE + "/?jogo=" + encodeURIComponent(e.id));
    if (e.venue) L.push("LOCATION:" + icsEsc_(e.venue));
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return new Response(L.map(icsFold_).join("\r\n") + "\r\n", { headers: {
    "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "public, max-age=900", "Content-Disposition": 'inline; filename="dragaostats-' + slug + '.ics"' } });
}

// ---------- dados (cache de 2 min, com tempo limite)
async function getData_(env, ctx) {
  // cópia fresca (2 min) e cópia velha (1 dia): o Apps Script pode demorar vários segundos,
  // por isso quem chega com a fresca caducada recebe já a velha e a atualização corre em segundo plano.
  const cache = caches.default;
  const keyF = new Request(SITE + "/__cache/dados-v1");
  const keyS = new Request(SITE + "/__cache/dados-velha-v1");
  const hit = await cache.match(keyF);
  if (hit) return await hit.json();
  const refresh = async (timeoutMs) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let d;
    try {
      const r = await fetch((env.STORE_URL || STORE_URL_DEFAULT) + "?_=" + Date.now(), { signal: ctl.signal, redirect: "follow" });
      d = await r.json();
    } finally { clearTimeout(timer); }
    if (!d || !d.competitions) return null;
    const c = compact_(d);
    const body = JSON.stringify(c);
    await cache.put(keyF, new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=" + CACHE_SECONDS } }));
    await cache.put(keyS, new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=86400" } }));
    return c;
  };
  const velha = await cache.match(keyS);
  if (velha) {
    ctx.waitUntil(refresh(25000).catch(() => null));
    return await velha.json();
  }
  return await refresh(15000); // 1.ª vez: espera mais tempo
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
        id: String(ev.id), comp: String(c.id), og: ev.ogImg || "", ogres: ev.ogRes || "", sport: ev.sport, day: ev.day, t: ev.t || "", adv: ev.athlete || "", fora: ev.local === "fora",
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
  if (s.includes("futsal") || s.includes("futebol") || s.includes("equipa b") || s.includes("equipa a")) return "⚽";
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
  const canon = SITE + "/?comp=" + encodeURIComponent(ev.comp || "") + "&jogo=" + encodeURIComponent(ev.id);
  const imgCustom = (ev.res && ev.og && ev.ogres === ev.res && /^[A-Za-z0-9_-]{10,80}$/.test(ev.og)) ? "https://lh3.googleusercontent.com/d/" + ev.og + "=w1200" : "";
  const imgFinal = imgCustom || (slugOf_(ev.sport) ? SITE + "/og/" + slugOf_(ev.sport) + ".png" : "");
  const s0 = startInfo_(ev.day, ev.t);
  const ld = {
    "@context": "https://schema.org", "@type": "SportsEvent", name: t.home + " vs " + t.away, sport: ev.sport,
    description: ev.res ? "Resultado final: " + t.home + " " + ev.res + " " + t.away + (ev.det ? " (" + ev.det + ")" : "") : desc,
    eventStatus: ev.res ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled", url: canon,
    homeTeam: { "@type": "SportsTeam", name: t.home }, awayTeam: { "@type": "SportsTeam", name: t.away }
  };
  ld.startDate = s0 ? ev.day + "T" + String(ev.t).padStart(5, "0") + ":00" + s0.offset : ev.day;
  if (ev.venue) ld.location = { "@type": "Place", name: ev.venue };
  if (imgFinal) ld.image = imgFinal;
  const out = new HTMLRewriter()
    .on('link[rel="canonical"]', { element(e) { e.setAttribute("href", canon); } })
    .on("head", { element(e) { e.append('<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, "\\u003c") + "</script>" + (imgCustom ? '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' : ""), { html: true }); } })
    .on("title", { element(e) { e.setInnerContent(title + " | Dragão Stats"); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute("content", desc); } })
    .on('meta[property="og:title"]', { element(e) { e.setAttribute("content", title); } })
    .on('meta[property="og:description"]', { element(e) { e.setAttribute("content", desc); } })
    .on('meta[property="og:url"]', { element(e) { e.setAttribute("content", canon); } })
    .on('meta[name="twitter:title"]', { element(e) { e.setAttribute("content", title); } })
    .on('meta[name="twitter:description"]', { element(e) { e.setAttribute("content", desc); } })
    .on('meta[property="og:image"]', { element(e) { if (imgFinal) e.setAttribute("content", imgFinal); } })
    .on('meta[name="twitter:image"]', { element(e) { if (imgFinal) e.setAttribute("content", imgFinal); } })
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

// ---------- 1c) lista de jogos para o Google: /sitemap-jogos.xml (últimos 90 dias e próximas 3 semanas)
async function sitemapJogos_(env, ctx) {
  const data = await getData_(env, ctx);
  if (!data) return null;
  const hoje = Date.now(), de = hoje - 90 * 86400000, ate = hoje + 21 * 86400000;
  const itens = data.events.filter(e => { const t = Date.parse(e.day + "T12:00:00Z"); return t >= de && t <= ate; })
    .sort((a, b) => b.day.localeCompare(a.day)).slice(0, 1500)
    .map(e => "<url><loc>" + ESC(SITE + "/?comp=" + encodeURIComponent(e.comp || "") + "&jogo=" + encodeURIComponent(e.id)) + "</loc><lastmod>" + ESC(e.day) + "</lastmod></url>");
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + itens.join("\n") + "\n</urlset>\n";
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

// ---------- 1d) (v273) relatório de erros: /rep reencaminha para o Sentry (UE) os relatórios do site.
// Só passa envelopes do NOSSO projeto, só o corpo (nenhum cabeçalho do visitante, por isso o IP dele não chega ao Sentry).
const SENTRY_HOST = "o4512419488727040.ingest.de.sentry.io";
const SENTRY_PROJECT = "4512419564683344";
async function relatorioErros_(request) {
  try {
    const buf = await request.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > 200000) return new Response(null, { status: 204 });
    const bytes = new Uint8Array(buf);
    const nl = bytes.indexOf(10);
    const head = JSON.parse(new TextDecoder().decode(nl > 0 ? bytes.subarray(0, nl) : bytes));
    const dsn = new URL(String(head.dsn || ""));
    if (dsn.hostname !== SENTRY_HOST || dsn.pathname.replace(/^\//, "") !== SENTRY_PROJECT) return new Response(null, { status: 204 });
    const r = await fetch("https://" + SENTRY_HOST + "/api/" + SENTRY_PROJECT + "/envelope/", {
      method: "POST", body: buf, headers: { "Content-Type": "application/x-sentry-envelope" }
    });
    return new Response(null, { status: r.ok ? 200 : 204 });
  } catch (e) { return new Response(null, { status: 204 }); }
}

// ---------- 3) /hoje: jogos de hoje, próximos dias e últimos resultados (todas as modalidades)
function lisbonDay_(ms) { return new Date(ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" }); }
function weekdayLabel_(day) {
  const d = new Date(day + "T12:00:00Z");
  return ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][d.getUTCDay()];
}
function hojeConteudo_(events, nowMs) {
  const hoje = lisbonDay_(nowMs), fim = lisbonDay_(nowMs + 7 * 86400000);
  const link = e => SITE + "/?comp=" + encodeURIComponent(e.comp || "") + "&jogo=" + encodeURIComponent(e.id);
  const li = (e, mostrarRes) => {
    const t = teams_(e);
    const dir = mostrarRes && e.res
      ? '<span class="jg-r">' + ESC(e.res) + "</span>"
      : '<span class="jg-t">' + ESC(e.t || "—") + "</span>";
    return '<li><a href="' + ESC(link(e)) + '"><span><b>' + ESC(emoji_(e.sport) + " " + t.home + " vs " + t.away) + "</b>" +
      '<span class="jg-m">' + ESC(e.sport + (e.det ? " · " + e.det : "") + (e.venue ? " · " + e.venue : "")) + "</span></span>" + dir + "</a></li>";
  };
  const porHora = (a, b) => (a.t || "99:99").localeCompare(b.t || "99:99");
  const dHoje = events.filter(e => e.day === hoje).sort(porHora);
  const prox = events.filter(e => e.day > hoje && e.day <= fim && !e.res).sort((a, b) => a.day.localeCompare(b.day) || porHora(a, b)).slice(0, 12);
  const ult = events.filter(e => e.res && e.day <= hoje).sort((a, b) => b.day.localeCompare(a.day) || (b.t || "").localeCompare(a.t || "")).slice(0, 8);
  let html = '<section class="jg-sec"><h2>Hoje, ' + ESC(weekdayLabel_(hoje) + ", " + dateLabel_(hoje)) + "</h2>";
  html += dHoje.length ? "<ul>" + dHoje.map(e => li(e, true)).join("") + "</ul>" : '<p class="jg-vazio">Hoje não há jogos do FC Porto nas modalidades que acompanhamos.</p>';
  html += "</section>";
  if (prox.length) html += '<section class="jg-sec"><h2>Próximos dias</h2><ul>' + prox.map(e => li({ ...e, t: dateLabel_(e.day) + " · " + (e.t || "") }, false)).join("") + "</ul></section>";
  if (ult.length) html += '<section class="jg-sec"><h2>Últimos resultados</h2><ul>' + ult.map(e => li(e, true)).join("") + "</ul></section>";
  const ld = dHoje.concat(prox).map(e => {
    const t = teams_(e), s0 = startInfo_(e.day, e.t);
    const o = { "@context": "https://schema.org", "@type": "SportsEvent", name: t.home + " vs " + t.away, sport: e.sport, url: link(e),
      startDate: s0 ? e.day + "T" + String(e.t).padStart(5, "0") + ":00" + s0.offset : e.day,
      eventStatus: e.res ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
      homeTeam: { "@type": "SportsTeam", name: t.home }, awayTeam: { "@type": "SportsTeam", name: t.away } };
    if (e.venue) o.location = { "@type": "Place", name: e.venue };
    return o;
  });
  const n = dHoje.length;
  const dia = weekdayLabel_(hoje) + ", " + dateLabel_(hoje);
  const title = (n ? "Jogos do FC Porto hoje, " : "FC Porto: próximos jogos, ") + dateLabel_(hoje) + " | Dragão Stats";
  const desc = n
    ? "Hoje, " + dia + ", o FC Porto joga em " + n + (n === 1 ? " modalidade" : " modalidades") + ": " + dHoje.slice(0, 4).map(e => e.sport + (e.t ? " às " + e.t : "")).join(", ") + ". Horários, local e resultados."
    : "Hoje, " + dia + ", não há jogos do FC Porto. Vê os próximos jogos e os últimos resultados de todas as modalidades.";
  return { html, ld, title, desc, h1: n ? "Jogos do <b>FC Porto</b> hoje" : "Próximos jogos do <b>FC Porto</b>", n };
}
async function hojePage_(request, env, ctx) {
  const data = await getData_(env, ctx);
  if (!data) return null;
  const c = hojeConteudo_(data.events, Date.now());
  const res = await env.ASSETS.fetch(request);
  const out = new HTMLRewriter()
    .on("title", { element(e) { e.setInnerContent(c.title); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute("content", c.desc); } })
    .on('meta[property="og:title"]', { element(e) { e.setAttribute("content", c.title); } })
    .on('meta[property="og:description"]', { element(e) { e.setAttribute("content", c.desc); } })
    .on('meta[name="twitter:title"]', { element(e) { e.setAttribute("content", c.title); } })
    .on('meta[name="twitter:description"]', { element(e) { e.setAttribute("content", c.desc); } })
    .on("#hojeTitulo", { element(e) { e.setInnerContent(c.h1, { html: true }); } })
    .on("#hojeIntro", { element(e) { e.setInnerContent(c.desc); } })
    .on("#jogos-hoje", { element(e) { e.setInnerContent(c.html, { html: true }); } })
    .on("head", { element(e) { if (c.ld.length) e.append('<script type="application/ld+json">' + JSON.stringify(c.ld).replace(/</g, "\\u003c") + "</script>", { html: true }); } })
    .transform(res);
  const r = new Response(out.body, out);
  r.headers.set("Cache-Control", "public, max-age=300");
  return r;
}

// ---------- v280: /api/dados — os mesmos dados do Apps Script, só para a 1.ª carga do link «só ver»
// O site tenta isto primeiro (com limite de tempo) e, se falhar de qualquer maneira, vai direto ao Apps Script como sempre.
// As atualizações seguintes (de 6 em 6 s, ao vivo) NÃO passam por aqui: vão sempre direto, por isso o marcador nunca fica
// mais atrasado do que já era. Cópia: fresca até 8 s; de 8 a 45 s serve já e atualiza em segundo plano; acima disso espera
// pelo Apps Script (máx. 9 s) e, se este falhar, serve a cópia (até 10 min) ou deixa o site ir direto.
const DADOS_FRESCOS_S = 8, DADOS_MORNOS_S = 45, DADOS_MAX_S = 600;
let dadosEmCurso_ = null;
function dadosResposta_(body, idadeS) {
  return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-DS-Age": String(Math.max(0, Math.round(idadeS))) } });
}
function dadosAtualizar_(env, cache, key, timeoutMs) {
  if (!dadosEmCurso_) {
    dadosEmCurso_ = (async () => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const r = await fetch((env.STORE_URL || STORE_URL_DEFAULT) + "?_=" + Date.now(), { signal: ctl.signal, redirect: "follow" });
        if (!r.ok) return null;
        const body = await r.text();
        if (body.charCodeAt(0) !== 123 || body.indexOf('"competitions"') < 0) return null; // não é o JSON dos dados (ex.: página de erro)
        await cache.put(key, new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=" + DADOS_MAX_S, "X-DS-At": String(Date.now()) } }));
        return body;
      } catch (e) { return null; } finally { clearTimeout(timer); dadosEmCurso_ = null; }
    })();
  }
  return dadosEmCurso_;
}
async function dadosBrutos_(env, ctx) {
  const cache = caches.default, key = new Request(SITE + "/__cache/dados-brutos-v1");
  const hit = await cache.match(key);
  const idade = hit ? (Date.now() - Number(hit.headers.get("X-DS-At") || 0)) / 1000 : Infinity;
  if (hit && idade < DADOS_FRESCOS_S) return dadosResposta_(hit.body, idade);
  if (hit && idade < DADOS_MORNOS_S) {
    ctx.waitUntil(dadosAtualizar_(env, cache, key, 25000));
    return dadosResposta_(hit.body, idade);
  }
  const novo = await dadosAtualizar_(env, cache, key, 9000);
  if (novo) return dadosResposta_(novo, 0);
  if (hit && idade < DADOS_MAX_S) return dadosResposta_(hit.body, idade);
  return new Response("", { status: 504, headers: { "Cache-Control": "no-store" } });
}

// ---------- diagnóstico: /diag (texto simples; diz se o worker corre e se lê os dados)
async function diagnostico_(env, ctx) {
  const out = { worker: "v280", hora: new Date().toISOString() };
  const t0 = Date.now();
  try {
    const cache = await caches.default.match(new Request(SITE + "/__cache/dados-v1"));
    out.cache = !!cache;
    const d = await getData_(env, ctx);
    out.dados = d ? "ok" : "vazio";
    out.jogos = d ? d.events.length : 0;
  } catch (e) { out.dados = "erro"; out.erro = String(e && e.message || e).slice(0, 200); }
  out.ms = Date.now() - t0;
  out.storeUrl = (env.STORE_URL ? "env" : "defeito");
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
