// ===================== v180: "HOJE", MODALIDADE FAVORITA E CONTAGEM ANÓNIMA =====================
// Hoje: faixa de chips no Início com as modalidades que jogam hoje (hora ou resultado).
// Favorita: guardada só neste aparelho (localStorage), sem conta; o Início abre nela.
// track_: conta ações (sem nomes, sem IDs, sem identificar ninguém) e envia agregado ao Apps Script.
function favSport_(){ try{ return localStorage.getItem("dia22-fav-sport") || ""; }catch(e){ return ""; } }
function favToggle_(sp){
  try{
    if(favSport_() === sp){ localStorage.removeItem("dia22-fav-sport"); }
    else{ localStorage.setItem("dia22-fav-sport", sp); if(typeof track_ === "function") track_("favorita"); }
  }catch(e){}
}
let favApplied_ = false;
function favApplyOnce_(sportsAll){
  if(favApplied_) return;
  favApplied_ = true;
  const f = favSport_();
  if(f && Array.isArray(sportsAll) && sportsAll.includes(f) && homeSport_ === "Todas") homeSport_ = f;
}

function todayStripHtml_(withD){
  try{
    const esc = homeEsc_;
    const items = (withD || []).filter(x=>homeDayDiff_(x.d) === 0).sort((a, b)=>a.d - b.d);
    if(!items.length) return "";
    const chips = items.map(x=>{
      const ev = x.ev, st = (typeof getEv === "function" && getEv(ev.id)) || {};
      const res = st.resultado && String(st.resultado).trim();
      const j = (typeof cevLiveFor_ === "function") ? cevLiveFor_(ev) : null;
      const live = !res && j && j.estado === "vivo";
      const right = res ? esc(res) : (live ? '<i class="hv-dot"></i>AO VIVO' : esc(ev.t || ""));
      return `<button type="button" class="hv-tday${live ? " is-live" : ""}" data-tday="${esc(ev.id)}" style="--sc:${homeColor_(ev.sport)};"><span class="td-sp">${esc(ev.sport)}</span><span class="td-t">${right}</span></button>`;
    }).join("");
    return `<div class="hv-today"><span class="hv-today-h">Hoje joga</span><div class="hv-today-row">${chips}</div></div>`;
  }catch(e){ return ""; }
}

// ---- contagem anónima (só quem vê; nunca em modo edição)
const TRACK_URL_ = (typeof STORE_URL !== "undefined") ? STORE_URL : "";
let trackBuf_ = {};
function track_(name){
  try{
    if(!READONLY_MODE || !name) return;
    trackBuf_[name] = (trackBuf_[name] || 0) + 1;
  }catch(e){}
}
function trackFlush_(){
  try{
    const keys = Object.keys(trackBuf_);
    if(!keys.length || !TRACK_URL_) return;
    const body = JSON.stringify({ track: trackBuf_ });
    trackBuf_ = {};
    if(navigator.sendBeacon){
      try{ if(navigator.sendBeacon(TRACK_URL_, new Blob([body], { type: "text/plain" }))) return; }catch(e){}
    }
    fetch(TRACK_URL_, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, keepalive: true }).catch(()=>{});
  }catch(e){}
}
setInterval(trackFlush_, 45000);
document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState === "hidden") trackFlush_(); });
window.addEventListener("pagehide", trackFlush_);

// pontos de contagem (delegados, sem mexer nos módulos)
document.addEventListener("click", e=>{
  const t = e.target.closest && e.target.closest("button, a, .sq-click, [data-go], [data-hero]");
  if(!t) return;
  const id = t.id || "";
  if(t.matches && t.matches("[data-sqp]")) track_("jogador_aberto");
  else if(t.matches && t.matches("[data-search]")) track_("pesquisa");
  else if(t.matches && t.matches("[data-cls]")) track_("classificacao_inicio");
  else if(t.matches && t.matches("[data-remind]")) track_("lembrar_me");
  else if(t.matches && (t.matches("[data-go]") || t.matches("[data-hero]"))) track_("jogo_aberto");
  else if(t.matches && t.matches("[data-ncyes]")) track_("notif_convite_sim");
  else if(id === "weekReelBtn") track_("reel_gerado");
  else if(id === "installAppBtn" || id === "installBannerBtn") track_("instalar_clique");
}, true);
document.addEventListener("click", e=>{
  const t = e.target.closest && e.target.closest(".sp-tab, [data-sptab], [data-tab]");
  if(!t) return;
  const k = t.getAttribute("data-sptab") || t.getAttribute("data-tab") || "";
  if(k === "plantel") track_("plantel_aberto");
  else if(k === "classificacao") track_("classificacao_aberta");
  else if(k === "marcadores") track_("marcadores_aberto");
}, true);
setTimeout(()=>track_("sessao"), 2000);

// ---- v181: partilha com o resultado no texto + convite depois de uma vitória
function resultWin_(ev, st){
  try{
    const sc = String((st && st.resultado) || "").trim();
    if(!sc) return false;
    if(st.resultTag) return st.resultTag === "win";
    const m = sc.match(/(\d+)\s*[-–:]\s*(\d+)/);
    if(!m) return false;
    const a = Number(m[1]), b = Number(m[2]);
    return (ev.local === "fora" ? b : a) > (ev.local === "fora" ? a : b);
  }catch(e){ return false; }
}
function shareTextFan_(ev){
  const t = postTeams_(ev), st = (typeof getEv === "function" && getEv(ev.id)) || {};
  const score = String(st.resultado || "").trim();
  const link = gameLink_(ev);
  const tag = st.resultTag === "win" ? " (Vitória)" : st.resultTag === "loss" ? " (Derrota)" : st.resultTag === "draw" ? " (Empate)" : (resultWin_(ev, st) ? " (Vitória)" : "");
  const emoji = (typeof postSportEmoji_ === "function") ? postSportEmoji_(ev.sport) : "💙";
  const titulo = score ? `${emoji} ${ev.sport} — ${t.home} ${score} ${t.away}${tag}` : `${emoji} ${ev.sport} — ${t.home} vs ${t.away}${ev.t ? " (" + ev.t + ")" : ""}`;
  // v195: marcadores no texto de partilha (só jogo terminado e com marcadores escritos)
  let marc = "";
  try{
    if(score){
      const main = (typeof getStatTypesFor === "function" ? getStatTypesFor(ev.sport) : ["Golos"])[0] || "Golos";
      const soGolos = (typeof MARCADORES_LABEL_SPORTS !== "undefined" && MARCADORES_LABEL_SPORTS.has(ev.sport));
      const tot = {};
      (Array.isArray(ev.playerStats) ? ev.playerStats : []).forEach(p=>{
        if(!p || p.team === "adv" || !p.name || !String(p.name).trim()) return;
        const n = soGolos ? (Number(p.stats && p.stats.Golos) || 1) : (Number(p.stats && p.stats[main]) || 0);
        if(n > 0) tot[String(p.name).trim()] = (tot[String(p.name).trim()] || 0) + n;
      });
      const lista = Object.keys(tot).sort((a, b)=>tot[b] - tot[a]).slice(0, 6);
      if(lista.length && main === "Golos") marc = "\nMarcadores: " + lista.map(n=>n + (tot[n] > 1 ? " (" + tot[n] + ")" : "")).join(", ");
    }
  }catch(e){}
  return { titulo, texto: titulo + marc + "\nVê o jogo completo:", link };
}
async function shareGameFan_(ev){
  const s = shareTextFan_(ev);
  if(navigator.share){ try{ await navigator.share({ title: s.titulo, text: s.texto, url: s.link }); }catch(e){} return; }
  const all = s.texto + " " + s.link;
  if(navigator.clipboard){ try{ await navigator.clipboard.writeText(all); alert("Copiado! Já podes colar e enviar:\n" + all); return; }catch(e){} }
  prompt("Copia isto:", all);
}
function winInviteHtml_(done){
  try{
    if(!done || !done.length) return "";
    const x = done[0], ev = x.ev, st = (typeof getEv === "function" && getEv(ev.id)) || {};
    if(homeDayDiff_(x.d) < -2 || !resultWin_(ev, st)) return "";
    let dis = ""; try{ dis = localStorage.getItem("dia22-win-dismissed") || ""; }catch(e){}
    if(dis === ev.id) return "";
    const esc = homeEsc_, t = postTeams_(ev);
    return `<div class="nc-card hv-win"><span class="nc-ico">💙</span><div class="nc-body"><b class="nc-t">Vitória! ${esc(t.home)} ${esc(String(st.resultado).trim())} ${esc(t.away)}</b><span class="nc-s">Partilha com um amigo adepto.</span></div>
      <div class="nc-btns"><button type="button" class="hv-btn hv-btn-main" data-winshare="${esc(ev.id)}">Partilhar</button><button type="button" class="nc-no" data-windis="${esc(ev.id)}" aria-label="Fechar">✕</button></div></div>`;
  }catch(e){ return ""; }
}
document.addEventListener("click", e=>{
  const sh = e.target.closest && e.target.closest("[data-winshare]");
  const ds = e.target.closest && e.target.closest("[data-windis]");
  if(sh){
    const ev = (typeof EVENTS !== "undefined") && EVENTS.find(v=>v.id === sh.getAttribute("data-winshare"));
    if(ev){ track_("convite_vitoria"); shareGameFan_(ev); }
  }else if(ds){
    try{ localStorage.setItem("dia22-win-dismissed", ds.getAttribute("data-windis")); }catch(e){}
    if(typeof renderHomeView_ === "function") renderHomeView_(true);
  }
});

// ---- v183: bloco "Modalidades" no Início (entrada clara para cada página de modalidade)
function sportsGridHtml_(sportsAll, upcoming){
  try{
    if(!sportsAll || !sportsAll.length) return "";
    const esc = homeEsc_;
    const tiles = sportsAll.map(sp=>{
      const nx = (upcoming || []).find(x=>x.ev.sport === sp);
      const when = nx ? (homeDayDiff_(nx.d) === 0 ? "Hoje" : homeDayDiff_(nx.d) === 1 ? "Amanhã" : HOME_WD_[nx.d.getDay()] + " " + nx.d.getDate()) + (nx.ev.t ? " · " + nx.ev.t : "") : "Sem jogos marcados";
      const s = (typeof STANDINGS === "object" && STANDINGS) ? STANDINGS[sp] : null;
      const me = s && (s.rows || []).find(r=>r.me);
      const pos = me ? `<i class="sg-pos">${esc(me.p)}.º</i>` : "";
      return `<button type="button" class="hv-sg" data-sportpage="${esc(sp)}" style="--sc:${homeColor_(sp)};"><span class="sg-n">${esc(sp)}${pos}</span><span class="sg-s">${esc(when)}</span></button>`;
    }).join("");
    return `<div class="hv-panel hv-modgrid"><div class="hv-panel-head"><h3>Modalidades</h3><span class="hv-cls-hint">Toca para ver a página</span></div><div class="sg-grid">${tiles}</div></div>`;
  }catch(e){ return ""; }
}

// ---- v183: redes e apoio no rodapé; uma só pesquisa
(function(){
  const go = (id, ev)=>{ const el = document.getElementById(id); if(el) el.click(); if(typeof track_ === "function") track_(ev); };
  const fb = document.getElementById("footFb"), ig = document.getElementById("footIg"), su = document.getElementById("footSupport");
  if(fb) fb.onclick = ()=>go("facebookBtn", "rede_facebook");
  if(ig) ig.onclick = ()=>go("instagramBtn", "rede_instagram");
  if(su) su.onclick = ()=>go("supportBtn", "apoiar_clique");
  const lupa = document.getElementById("searchToggleBtn");
  if(lupa) lupa.addEventListener("click", e=>{
    if(typeof currentCompMode === "function" && currentCompMode() === "matches" && typeof openSearchSheet_ === "function"){ e.stopImmediatePropagation(); e.preventDefault(); openSearchSheet_(); }
  }, true);
})();

// ===================== AVISO "NOVO: JOGOS AO VIVO" (v216) =====================
// Cartão no topo do Início (só no link "só ver"), dispensável com um toque e que não volta a aparecer nesse aparelho.
// Para retirar de vez: LIVE_INTRO_ON_ = false. Para voltar a mostrar a toda a gente com uma novidade nova: mudar LIVE_INTRO_KEY_.
const LIVE_INTRO_ON_ = true;
const LIVE_INTRO_KEY_ = "dia22-live-intro-v1";
function liveIntroHtml_(){
  try{
    if(!LIVE_INTRO_ON_ || !READONLY_MODE) return "";
    if(localStorage.getItem(LIVE_INTRO_KEY_)) return "";
    const canNotify = typeof notifyCtaVariant_ === "function" && notifyCtaVariant_() === "enable";
    return `<div class="nc-card li-card"><span class="nc-ico">🔴</span><div class="nc-body"><b class="nc-t">Novo: jogos ao vivo!</b><span class="nc-s">Acompanha o resultado e o minuto dos jogos do FC Porto em direto, aqui no Dragão Stats.</span></div>
      <div class="nc-btns">${canNotify ? `<button type="button" class="hv-btn hv-btn-main nc-yes" data-liyes="1">Ativar avisos</button>` : ""}<button type="button" class="nc-no" data-lino="1">${canNotify ? "Agora não" : "Percebi"}</button></div></div>`;
  }catch(e){ return ""; }
}
function bindLiveIntro_(host, rerender){
  const done = ()=>{ try{ localStorage.setItem(LIVE_INTRO_KEY_, String(Date.now())); }catch(e){} try{ rerender(); }catch(e){} };
  host.querySelectorAll("[data-lino]").forEach(b=>{ b.onclick = done; });
  host.querySelectorAll("[data-liyes]").forEach(b=>{ b.onclick = async ()=>{ try{ await enableNotifications(); }catch(e){} done(); }; });
}
