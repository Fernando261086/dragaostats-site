// ===================== v223: NOTÍCIAS DAS MODALIDADES =====================
// O Apps Script (v140) junta, de hora a hora, os títulos de notícias sobre cada modalidade (Google News) e devolve-os em
// `noticias`: { Modalidade: [{id, t: título, f: fonte, u: ligação, d: data (ms), i: imagem de capa ou ""}] }.
// O site mostra só título, fonte, data e imagem; tocar abre a notícia no site de origem. Em modo edição há "Esconder".
let NOTICIAS = {};
function newsEsc_(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, c=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
// v229: o Apps Script (v147) guarda 14 dias; as listas (Início, Notícias, modalidade) mostram só as mais recentes
const NEWS_LIST_DAYS_ = 3;
function newsRecent_(sport){ const lim = Date.now() - NEWS_LIST_DAYS_ * 86400000; return ((NOTICIAS && NOTICIAS[sport]) || []).filter(n=>n.d >= lim); }
function newsHas_(sport){ return newsRecent_(sport).length > 0; }
function newsSig_(){ try{ return Object.keys(NOTICIAS || {}).map(k=>(NOTICIAS[k] || []).map(n=>n.id).join(",")).join("|"); }catch(e){ return ""; } }
function newsAgo_(ms){
  const m = Math.round((Date.now() - ms) / 60000);
  if(isNaN(m)) return "";
  if(m < 2) return "agora mesmo";
  if(m < 60) return "há " + m + " min";
  const h = Math.round(m / 60);
  if(h < 24) return "há " + h + (h === 1 ? " hora" : " horas");
  const d = Math.round(h / 24);
  return d <= 1 ? "ontem" : "há " + d + " dias";
}
function newsCardHtml_(n, sport, showSport, noHide){
  const esc = newsEsc_;
  const url = /^https:\/\//i.test(n.u || "") ? n.u : "";
  if(!url) return "";
  const img = n.i && /^https:\/\//i.test(n.i) ? `<img src="${esc(n.i)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : "";
  const color = homeColor_(sport);
  return `<div class="nw-wrap" style="--sc:${color};"><a class="nw-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-news="${esc(n.id)}">
    <span class="nw-img${img ? "" : " nw-noimg"}">${img}</span>
    <span class="nw-body"><span class="nw-title">${esc(n.t)}</span>
    <span class="nw-meta">${showSport ? `<b class="nw-sport">${(typeof favSport_ === "function" && favSport_() === sport) ? "★ " : ""}${esc(sport)}</b>` : ""}<span>${esc(n.f || "")}</span><span>${esc(newsAgo_(n.d))}</span></span></span></a>
    ${(READONLY_MODE || noHide) ? "" : `<button type="button" class="nw-hide" data-nhide="${esc(n.id)}" title="Esconder esta notícia" aria-label="Esconder esta notícia">✕</button>`}</div>`;
}
const NEWS_NOTE_ = '<p class="nw-note">Notícias de sites de terceiros: ao tocar, abres o site original. O Dragão Stats não é autor destes textos.</p>';
function newsPanelHtml_(sport){
  if(!newsHas_(sport)) return '<div class="hv-panel"><div class="hv-panel-head"><h3>Notícias</h3></div><div class="hv-empty">Ainda sem notícias desta modalidade.</div></div>';
  return `<div class="hv-panel nw-panel"><div class="hv-panel-head"><h3>Notícias</h3></div>${newsRecent_(sport).map(n=>newsCardHtml_(n, sport, false)).join("")}${NEWS_NOTE_}</div>`;
}
function newsHomeHtml_(){
  const all = [];
  Object.keys(NOTICIAS || {}).forEach(sp=>newsRecent_(sp).forEach(n=>all.push({ n, sp })));
  if(!all.length) return "";
  const fav = (typeof favSport_ === "function") ? favSport_() : "";
  all.sort((a, b)=>(fav ? (b.sp === fav) - (a.sp === fav) : 0) || (b.n.d - a.n.d)); // a modalidade favorita (★) vai primeiro
  const seen = new Set(), top = [];
  for(const x of all){ if(seen.has(x.n.id)) continue; seen.add(x.n.id); top.push(x); if(top.length >= 5) break; }
  return `<div class="hv-panel nw-panel"><div class="hv-panel-head"><h3>Últimas notícias</h3><button type="button" class="nw-all" data-newsall="1">Ver todas →</button></div>${top.map(x=>newsCardHtml_(x.n, x.sp, true)).join("")}${NEWS_NOTE_}</div>`;
}
// imagens que falham a carregar: caem para o bloco de cor (o evento "error" não sobe, por isso usa-se a fase de captura)
document.addEventListener("error", e=>{
  const t = e.target;
  if(t && t.tagName === "IMG" && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains("nw-img")){ t.parentNode.classList.add("nw-noimg"); t.remove(); }
}, true);
function bindNews_(host, rerender){
  host.querySelectorAll("[data-newsall]").forEach(b=>{ b.onclick = ()=>{ if(typeof setView === "function"){ setView("noticias"); window.scrollTo(0, 0); } }; });
  host.querySelectorAll("[data-news]").forEach(a=>{ a.addEventListener("click", ()=>{ if(typeof track_ === "function") track_("noticia_aberta"); }); });
  host.querySelectorAll("[data-nhide]").forEach(b=>{
    b.onclick = async e=>{
      e.preventDefault(); e.stopPropagation();
      const id = b.getAttribute("data-nhide");
      if(!confirm("Esconder esta notícia do site?")) return;
      try{
        const r = await fetch(STORE_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ocultarNoticia: { id, on: true }, adminPassword: getAdminPassword() }) });
        const j = await r.json();
        if(!j || !j.ok) throw new Error("falhou");
        Object.keys(NOTICIAS).forEach(k=>{ NOTICIAS[k] = (NOTICIAS[k] || []).filter(n=>n.id !== id); });
        if(typeof rerender === "function") rerender();
      }catch(err){ alert("Não foi possível esconder a notícia. Confirma a ligação e tenta outra vez."); }
    };
  });
}

// ---------- v229: notícias de um jogo (pelas etiquetas do clube: adversário) e botão de bilhetes ----------
function newsKey_(s){ return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function newsForGame_(ev){
  try{
    const list = (NOTICIAS && NOTICIAS[ev.sport]) || [];
    const opp = newsKey_(ev.athlete);
    if(opp.length < 4 || !list.length) return [];
    const t0 = (typeof pgWhen_ === "function") ? pgWhen_(ev) : 0;
    if(!t0) return [];
    const from = t0 - 9 * 86400000, to = t0 + 4 * 86400000;
    return list.filter(n=>n.d >= from && n.d <= to && Array.isArray(n.g) && n.g.some(g=>{ const k = newsKey_(g); return k.length >= 5 && (k === opp || k.indexOf(opp) >= 0 || opp.indexOf(k) >= 0); }))
      .sort((a, b)=>b.d - a.d);
  }catch(e){ return []; }
}
function newsTicketForGame_(ev){
  const t0 = (typeof pgWhen_ === "function") ? pgWhen_(ev) : 0;
  return newsForGame_(ev).find(n=>/bilhete|ingresso/i.test(n.t || "") && /^https:\/\//i.test(n.u || "") && (!t0 || n.d <= t0)) || null;
}
function gameNewsHtml_(ev){
  const l = newsForGame_(ev).slice(0, 3);
  if(!l.length) return "";
  return `<div class="hv-panel nw-panel"><div class="hv-panel-head"><h3>Notícias do jogo</h3></div>${l.map(n=>newsCardHtml_(n, ev.sport, false, true)).join("")}${NEWS_NOTE_}</div>`;
}
